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
  // Accept inputs like:
  // - "591357357"
  // - "+995 591 357 357"
  // - "995591357357"
  // and return digits-only in international format for provider: 995XXXXXXXXX
  const digits = String(toRaw || "").replace(/\D/g, "");
  if (!digits) return null;

  // If already international (Georgia)
  if (digits.startsWith("995") && digits.length >= 11 && digits.length <= 15) return digits;

  // Common Georgian mobile: 9 digits starting with 5 (e.g. 591357357)
  if (digits.length === 9 && digits.startsWith("5")) return `995${digits}`;

  // Some users type leading 0 (e.g. 0591357357)
  if (digits.length === 10 && digits.startsWith("0") && digits[1] === "5") return `995${digits.slice(1)}`;

  // Fallback: accept generic international digits length 6..15
  if (digits.length >= 6 && digits.length <= 15) return digits;

  return null;
}

export function buildStatusSmsText(status: SmsItemStatus, shtrikhkodi: string, regionName?: string) {
  const code = shtrikhkodi || "ამანათი";

  if (status === "IN_WAREHOUSE") {
    return (
      `მოგესალმებით, კომპანია Express Logistic Service გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსულია ამანათი კოდით ${code}. ` +
      `გთხოვთ, ამანათის გასატანათ მობრძანდეთ ჩვენს ოფისში. ` +
      `მისამართი: ქ.თბილისი, გაგარინის 4-4ა, სამუშაო საათები: ყოველდღე, 11 საათიდან 19 საათამდე. ` +
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

  // REGION
  const regionText = regionName && regionName.trim().length > 0 ? regionName.trim() : "რეგიონი";
  return (
    `მოგესალმებით, კომპანია Express Logistic Service გაცნობებთ, რომ თქვენს სახელზე საფრანგეთიდან ჩამოსული ამანათი კოდით ${code} გამოგეგზავნებათ ${regionText}. ` +
    `დამატებითი კითხვების შემთხვევაში, გთხოვთ დაგვიკავშირდეთ (+995) 591 357 357. ` +
    `მადლობას გიხდით, რომ სარგებლობთ ჩვენი მომსახურებით💜`
  );
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
  const username = process.env.SMSUSERNAME;
  const password = process.env.SMSPASSWORD;
  const clientId = process.env.SMSCLIENTID;
  const serviceId = process.env.SMSSERVICEID;
   const outboundHeader = process.env.SMS_OUTBOUND_HEADER;

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

  const headers: Record<string, string> = {};
  if (outboundHeader) {
    // Some firewalls/providers require a static header value to allow outgoing SMS requests.
    headers["Header"] = outboundHeader;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    headers,
  });
  const providerResponse = (await res.text()).trim();

  if (!res.ok) {
    console.error("[SMS] Provider error", {
      toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
      status: res.status,
      providerResponse,
    });
    throw new SmsProviderError(`SMS provider request failed (HTTP ${res.status})`, {
      status: res.status,
      providerResponse,
    });
  }

  console.log("[SMS] Successfully sent", {
    toMasked: `${to.slice(0, 3)}****${to.slice(-2)}`,
    providerResponse,
  });

  return { providerResponse };
}

