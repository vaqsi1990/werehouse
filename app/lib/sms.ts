/**
 * GOSMS.GE API 3.0 – https://api.gosms.ge/api
 * Send SMS and check delivery status via JSON POST/GET.
 */

type SendSmsInput = {
  to: string;
  text: string;
};

export type SmsItemStatus = "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";

const GOSMS_API_BASE = "https://api.gosms.ge/api";

const GOSMS_ERROR_MESSAGES: Record<number, string> = {
  100: "Invalid API key",
  101: "Invalid sender name",
  102: "Insufficient balance",
  103: "Invalid parameters or message too long",
  104: "Message not found",
  105: "Invalid phone number",
  106: "Failed to generate/send OTP",
  107: "Sender already exists",
  108: "Cannot create sender / API not configured",
  109: "Too many OTP requests",
  110: "Account locked",
  111: "OTP expired",
  112: "OTP already used",
  113: "Invalid noSmsNumber",
};

export class SmsProviderError extends Error {
  status: number;
  providerResponse: string;

  constructor(message: string, opts: { status: number; providerResponse: string }) {
    super(message);
    this.name = "SmsProviderError";
    this.status = opts.status;
    this.providerResponse = opts.providerResponse;
  }
}

/** Normalize phone to GOSMS format: 995XXXXXXXXX (no + prefix). */
export function normalizePhone(toRaw: string): string | null {
  const digits = String(toRaw || "").replace(/\D/g, "");
  if (!digits) return null;

  let normalized: string | null = null;

  if (digits.startsWith("995") && digits.length >= 11 && digits.length <= 15) {
    normalized = digits;
  } else if (digits.length === 9 && digits.startsWith("5")) {
    normalized = `995${digits}`;
  } else if (digits.length === 10 && digits.startsWith("0") && digits[1] === "5") {
    normalized = `995${digits.slice(1)}`;
  } else if (digits.length >= 6 && digits.length <= 15) {
    normalized = digits;
  }

  return normalized;
}

/** @deprecated Use normalizePhone – kept for existing tests/imports. */
export function normalizePhoneToMsgGe(toRaw: string): string | null {
  const phone = normalizePhone(toRaw);
  return phone ? `+${phone}` : null;
}

export function buildStatusSmsText(status: SmsItemStatus, shtrikhkodi: string, regionName?: string): string {
  const code = shtrikhkodi || "ამანათი";

  if (status === "IN_WAREHOUSE") {
    return (
      `Postifly გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსულია ამანათი კოდით ${code}. ` +
      `გთხოვთ, ამანათის გასატანათ მობრძანდეთ ჩვენს ოფისში. ` +
      `მისამართი: ქ.თბილისი, გაგარინის 4-4ა, სამუშაო საათები: ყოველ დღე, კვირის გარდა 11 საათიდან 19 საათამდე. ` +
      `საკურიერო მომსახურების ან სხვა კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ (+995) 591 357 357. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  if (status === "STOPPED") {
    return (
      `Postifly გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსული ამანათი კოდით ${code} შეჩერდა საბაჟოზე. ` +
      `დამატებითი კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ (+995) 591 357 357. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  if (status === "RELEASED") {
    return (
      `Postifly გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსული ამანათი კოდით ${code} გატანილია. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  if (status === "REGION") {
    return (
      `Postifly გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსული ამანათი კოდით ${code} გამოგეგზავნებათ რეგიონში. ` +
      `ამანათს მისამართზე მიიღებთ 2-3 სამუშაო დღეში. ` +
      `დამატებითი კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ (+995) 591 357 357. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  return "";
}

export function buildWarehouseArrivalSmsText(shtrikhkodi: string) {
  return buildStatusSmsText("IN_WAREHOUSE", shtrikhkodi);
}

type GosmsApiError = {
  errorCode?: number;
  message?: string;
};

type GosmsApiResponse = GosmsApiError & {
  success?: boolean;
};

type GosmsSendResponse = GosmsApiResponse & {
  messageId?: number;
  message_id?: number;
  balance?: number;
  to?: string;
  from?: string;
  text?: string;
};

type GosmsCheckResponse = GosmsApiResponse & {
  status?: string;
  messageId?: number;
  to?: string;
  from?: string;
  text?: string;
};

function getSmsConfig() {
  const apiKey = process.env.SMS_API_KEY?.trim();
  const sender = process.env.SMS_SENDER?.trim();

  if (!apiKey) {
    throw new Error("SMS credentials are not configured (SMS_API_KEY)");
  }
  if (!sender) {
    throw new Error("SMS sender is not configured (SMS_SENDER)");
  }

  return { apiKey, sender };
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 5)}****${phone.slice(-2)}`;
}

function parseProviderResponse(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function getGosmsErrorMessage(data: GosmsApiError, fallback: string) {
  if (typeof data.errorCode === "number") {
    return GOSMS_ERROR_MESSAGES[data.errorCode] ?? data.message ?? `${fallback} (code: ${data.errorCode})`;
  }
  return data.message ?? fallback;
}

function assertGosmsSuccess<T extends GosmsApiResponse>(
  res: Response,
  raw: string,
  data: T,
  fallbackError: string
) {
  if (!res.ok || data.success === false || typeof data.errorCode === "number") {
    const message = getGosmsErrorMessage(data, fallbackError);
    console.error("[SMS] Provider error response", {
      httpStatus: res.status,
      message,
      body: data,
    });
    throw new SmsProviderError(message, {
      status: res.status,
      providerResponse: raw,
    });
  }
}

export async function sendSms(input: SendSmsInput) {
  const { apiKey, sender } = getSmsConfig();
  const to = normalizePhone(input.to);
  if (!to) throw new Error("Invalid phone number");

  console.log("[SMS] Sending via gosms.ge", {
    toMasked: maskPhone(to),
    hasText: Boolean(input.text),
    sender,
  });

  const res = await fetch(`${GOSMS_API_BASE}/sendsms`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      from: sender,
      to,
      text: input.text,
    }),
  });

  const raw = (await res.text()).trim();
  const data = (parseProviderResponse(raw) ?? {}) as GosmsSendResponse;

  console.log("[SMS] Provider response", { httpStatus: res.status, body: data });

  if (!raw) {
    throw new SmsProviderError("SMS provider returned empty response", {
      status: res.status,
      providerResponse: "",
    });
  }

  assertGosmsSuccess(res, raw, data, "SMS provider error");

  const messageId = String(data.messageId ?? data.message_id ?? "");

  console.log("[SMS] Successfully sent", {
    toMasked: maskPhone(to),
    messageId: messageId || undefined,
    balance: data.balance,
  });

  return { providerResponse: raw, messageId };
}

/** @deprecated Use sendSms – kept for existing imports. */
export async function sendSmsViaMsgGe(input: SendSmsInput) {
  return sendSms(input);
}

export async function checkSmsDeliveryStatus(messageId: string): Promise<{
  status: string;
  statusLabel: string;
  raw: string;
}> {
  const { apiKey } = getSmsConfig();
  const parsedMessageId = Number(messageId);
  if (!messageId || Number.isNaN(parsedMessageId)) {
    throw new Error("Invalid messageId for SMS status check");
  }

  const url = new URL(`${GOSMS_API_BASE}/checksms`);
  url.search = new URLSearchParams({
    api_key: apiKey,
    messageId: String(parsedMessageId),
  }).toString();

  console.log("[SMS] Track request", { messageId });

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const raw = (await res.text()).trim();
  const data = (parseProviderResponse(raw) ?? {}) as GosmsCheckResponse;

  console.log("[SMS] Track response", { httpStatus: res.status, body: data });

  assertGosmsSuccess(res, raw, data, "SMS status check failed");

  const status = data.status ?? "unknown";
  const statusLabel = status;

  console.log("[SMS] Delivery status", { messageId, status, statusLabel });
  return { status, statusLabel, raw };
}

export async function checkSmsBalance(): Promise<{ balance: number; raw: string }> {
  const { apiKey } = getSmsConfig();

  const url = new URL(`${GOSMS_API_BASE}/sms-balance`);
  url.search = new URLSearchParams({ api_key: apiKey }).toString();

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const raw = (await res.text()).trim();
  const data = (parseProviderResponse(raw) ?? {}) as GosmsApiResponse & { balance?: number };

  assertGosmsSuccess(res, raw, data, "SMS balance check failed");

  return { balance: data.balance ?? 0, raw };
}
