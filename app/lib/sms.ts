/**
 * MS Group API 1.0 – sendsms.php & track.php
 * https://bi.msg.ge – Send SMS and check delivery status via HTTP GET.
 * Georgian/Unicode: use utf=1 (7bit 160 chars, unicode 70 chars).
 * Shared/cloud hosting: set MSG_HEADER with alternate password from your manager.
 */

type SendSmsInput = {
  to: string;
  text: string;
};

export type SmsItemStatus = "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";

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

export function normalizePhoneToMsgGe(toRaw: string): string | null {

  // and return international format with + sign for provider: +995XXXXXXXXX
  const digits = String(toRaw || "").replace(/\D/g, "");
  if (!digits) return null;

  let normalized: string | null = null;

  // If already international (Georgia) - starts with 995
  if (digits.startsWith("995") && digits.length >= 11 && digits.length <= 15) {
    normalized = digits;
  }
  // Common Georgian mobile: 9 digits starting with 5 (e.g. 591357357)
  else if (digits.length === 9 && digits.startsWith("5")) {
    normalized = `995${digits}`;
  }
  // Some users type leading 0 (e.g. 0591357357)
  else if (digits.length === 10 && digits.startsWith("0") && digits[1] === "5") {
    normalized = `995${digits.slice(1)}`;
  }
  // Fallback: accept generic international digits length 6..15
  else if (digits.length >= 6 && digits.length <= 15) {
    normalized = digits;
  }

  // Add + sign prefix as required by msg.ge API (format: +995XXXXXXXXX)
  // msg.ge API requires phone numbers in format: +995XXXXXXXXX
  return normalized ? `+${normalized}` : null;
}

export function buildStatusSmsText(status: SmsItemStatus, shtrikhkodi: string, regionName?: string): string {
  const code = shtrikhkodi || "ამანათი";

  if (status === "IN_WAREHOUSE") {
    return (
      `მოგესალმებით, კომპანია Express Logistic Service გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსულია ამანათი კოდით ${code}. ` +
      `გთხოვთ, ამანათის გასატანათ მობრძანდეთ ჩვენს ოფისში. ` +
      `მისამართი: ქ.თბილისი, გაგარინის 4-4ა, სამუშაო საათები: ყოველ დღე, კვირის გარდა 11 საათიდან 19 საათამდე. ` +
      `საკურიერო მომსახურების ან სხვა კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ (+995) 591 357 357. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  if (status === "STOPPED") {
    return (
      `მოგესალმებით, კომპანია Express Logistic Service გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსული ამანათი კოდით ${code} შეჩერდა საბაჟოზე. ` +
      `დამატებითი კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ (+995) 591 357 357. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  if (status === "RELEASED") {
    return (
      `მოგესალმებით, კომპანია Express Logistic Service გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსული ამანათი კოდით ${code} გატანილია. ` +
      `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
    );
  }

  // REGION ან ნებისმიერი სხვა სტატუსისთვის – ტექსტს არ ვაგენერირებთ,
  // რომ REGION შემთხვევაში შემთხვევითაც არ გაიგზავნოს SMS.
  return "";
}

export function buildWarehouseArrivalSmsText(shtrikhkodi: string) {
  return buildStatusSmsText("IN_WAREHOUSE", shtrikhkodi);
}

function needsUnicode(text: string) {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) return true;
  }
  return false;
}

export async function sendSmsViaMsgGe(input: SendSmsInput) {
  const username = 'expresslogiticservice';
  const password = 'Nn8I4IgS3y';
  const clientId = '1156';
  const serviceId = '3150';
  const outboundHeader = 'xL6nn@6fsMc';

  if (!username || !password || !clientId || !serviceId) {
    throw new Error("SMS credentials are not configured (SMSUSERNAME/SMSPASSWORD/SMSCLIENTID/SMSSERVICEID)");
  }

  const to = normalizePhoneToMsgGe(input.to);
  if (!to) throw new Error("Invalid phone number");

  console.log("[SMS] Sending via msg.ge", {
    toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
    hasText: Boolean(input.text),
  });

  const url = new URL("https://bi.msg.ge/sendsms.php");
  const params = new URLSearchParams({
    username,
    password,
    client_id: clientId,
    service_id: serviceId,
    to,
    text: input.text,
  });
  if (needsUnicode(input.text)) params.set("utf", "1");
  url.search = params.toString();

  const safeUrl = url.toString().replace(/password=[^&]*/i, "password=***");
  console.log("[SMS] Request URL", safeUrl);

  const headers: Record<string, string> = {};
  if (outboundHeader) {
    // Shared hosting / cloud: alternate password in MSG_HEADER (per MS Group API docs).
    headers["MSG_HEADER"] = outboundHeader;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    headers,
  });
  const providerResponse = (await res.text()).trim();

  console.log("[SMS] Provider response", { httpStatus: res.status, body: providerResponse });

 
  if (!providerResponse || providerResponse.length === 0) {
    console.error("[SMS] Empty provider response", {
      toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
      status: res.status,
    });
    throw new SmsProviderError("SMS provider returned empty response", {
      status: res.status,
      providerResponse: "",
    });
  }

  // Response format: "CODE-MESSAGE_ID" (e.g. 0000-000001)
  const [responseCode, messageIdRaw] = providerResponse.includes("-")
    ? providerResponse.split("-", 2)
    : [providerResponse.substring(0, 4), ""];

  if (!res.ok) {
    console.error("[SMS] Provider HTTP error", {
      toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
      status: res.status,
      providerResponse,
    });
    throw new SmsProviderError(`SMS provider request failed (HTTP ${res.status})`, {
      status: res.status,
      providerResponse,
    });
  }

  // Check response code even if HTTP status is 200
  if (responseCode !== "0000") {
    let errorMessage = `SMS provider error (code: ${responseCode})`;
    switch (responseCode) {
      case "0001":
        errorMessage = "Invalid password or nickname or restricted IP address";
        break;
      case "0003":
        errorMessage = "Required fields are empty (username, password, client_id, service_id)";
        break;
      case "0005":
        errorMessage = "Blank message body";
        break;
      case "0007":
        errorMessage = "Invalid phone number";
        break;
      case "0008":
        errorMessage = "Insufficient balance";
        break;
      case "0009":
        errorMessage = "Invalid sender ID";
        break;
      case "0010":
        errorMessage = "The message contains banned word";
        break;
      default:
        errorMessage = `SMS provider error (code: ${responseCode})`;
    }
    
    console.error("[SMS] Provider error response", {
      toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
      responseCode,
      providerResponse,
      errorMessage,
    });
    
    throw new SmsProviderError(errorMessage, {
      status: res.status,
      providerResponse,
    });
  }

  const messageId = messageIdRaw?.trim() || "";

  console.log("[SMS] Successfully sent", {
    toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
    providerResponse,
    messageId: messageId || undefined,
  });

  return { providerResponse, messageId };
}

/** track.php delivery status codes (MS Group API 1.0) */
export type SmsDeliveryStatus =
  | 0   // Pending
  | 1   // Was sent to a subscriber
  | 2   // Failed to send to a subscriber
  | 4   // Status pending
  | 8   // Submitted to the SMS Center
  | 16  // Rejected by SMS Center
  | 64; // Incorrect password or nickname or restricted IP address

const DELIVERY_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Was sent to a subscriber",
  2: "Failed to send to a subscriber",
  4: "Status pending",
  8: "Submitted to the SMS Center",
  16: "Rejected by SMS Center",
  64: "Incorrect password or nickname or restricted IP address",
};

/**
 * Check SMS delivery status (track.php).
 * Requires: message_id (from send response), username, password, client_id.
 */
export async function checkSmsDeliveryStatus(messageId: string): Promise<{
  status: SmsDeliveryStatus;
  statusLabel: string;
  raw: string;
}> {
  const username = process.env.SMSUSERNAME ?? "expresslogiticservice";
  const password = process.env.SMSPASSWORD ?? "Nn8I4IgS3y";
  const clientId = process.env.SMSCLIENTID ?? "1156";
  const outboundHeader = process.env.SMS_MSG_HEADER ?? "xL6nn@6fsMc";

  if (!username || !password || !clientId) {
    throw new Error("SMS credentials not configured for track (username, password, client_id)");
  }

  const url = new URL("https://bi.msg.ge/track.php");
  url.search = new URLSearchParams({
    message_id: String(messageId),
    username,
    password,
    client_id: clientId,
  }).toString();
  const trackUrl = url.toString();

  console.log("[SMS] Track request", { messageId, trackUrl: trackUrl.replace(/password=[^&]*/i, "password=***") });

  const headers: Record<string, string> = {};
  if (outboundHeader) headers["MSG_HEADER"] = outboundHeader;

  const res = await fetch(trackUrl, { method: "GET", cache: "no-store", headers });
  const raw = (await res.text()).trim();

  console.log("[SMS] Track response", { httpStatus: res.status, raw });

  const code = parseInt(raw, 10);

  if (!res.ok) {
    throw new SmsProviderError(`Track request failed (HTTP ${res.status})`, {
      status: res.status,
      providerResponse: raw,
    });
  }

  const status = isNaN(code) ? 0 : (code as SmsDeliveryStatus);
  const statusLabel = DELIVERY_STATUS_LABELS[status] ?? `Unknown (${raw})`;

  console.log("[SMS] Delivery status", { messageId, status, statusLabel });
  return { status, statusLabel, raw };
}

