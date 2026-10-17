/**
 * SMS lib tests – run: npx tsx app/lib/sms.test.ts
 * Real send/track only if SEND_REAL_SMS=1 and TO_PHONE is set.
 */

import {
  normalizePhone,
  SMS_CODE_TOKEN,
  insertParcelCode,
  buildStatusSmsText,
  buildWarehouseArrivalSmsText,
  sendSms,
  checkSmsDeliveryStatus,
  SmsProviderError,
  type SmsItemStatus,
} from "./sms";

function log(label: string, data: unknown) {
  console.log(`\n[TEST] ${label}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
}

// --- normalizePhone
console.log("\n=== normalizePhone ===");
const phones = [
  "591357357",
  "0591357357",
  "995591357357",
  "+995 591 357 357",
  "invalid",
  "",
];
for (const p of phones) {
  const out = normalizePhone(p);
  log(`normalize("${p}")`, out);
}

// --- buildStatusSmsText
console.log("\n=== buildStatusSmsText ===");
const statuses: SmsItemStatus[] = ["IN_WAREHOUSE", "STOPPED", "RELEASED", "REGION"];
for (const s of statuses) {
  const text = buildStatusSmsText(s, "TEST123", s === "REGION" ? "ბათუმი" : undefined);
  log(s, { length: text.length, preview: text.slice(0, 80) + "..." });
}

// --- buildWarehouseArrivalSmsText
console.log("\n=== buildWarehouseArrivalSmsText ===");
const warehouseText = buildWarehouseArrivalSmsText("ABC456");
log("warehouse arrival", { length: warehouseText.length, preview: warehouseText.slice(0, 60) + "..." });

const shared = buildStatusSmsText("PENDING", SMS_CODE_TOKEN, undefined, "RUSSIA", "ka");
const edited = shared.replace("მოლოდინშია", "მზადაა");
const first = insertParcelCode(edited, "CODE-A");
const second = insertParcelCode(edited, "CODE-B");
const russian = insertParcelCode(
  buildStatusSmsText("IN_TRANSIT", SMS_CODE_TOKEN, undefined, "RUSSIA", "ru"),
  "RU-2"
);
if (shared.includes("CODE-A") || !shared.includes(SMS_CODE_TOKEN)) throw new Error("preview shows a real parcel code");
if (!first.includes("კოდით CODE-A") || first.includes(SMS_CODE_TOKEN)) throw new Error("first code was not inserted");
if (!second.includes("კოდით CODE-B") || second.includes("CODE-A")) throw new Error("second code was not inserted");
if (!first.includes("მზადაა") || !second.includes("მზადაა")) throw new Error("edited wording was lost");
if (!russian.includes("с кодом RU-2") || russian.includes(SMS_CODE_TOKEN)) throw new Error("russian code was not inserted");
console.log("\n=== insertParcelCode ok ===");

// --- Optional: real send + track (only if env set)
const sendReal = process.env.SEND_REAL_SMS === "1";
const toPhone = process.env.TO_PHONE?.trim();

if (sendReal && toPhone) {
  console.log("\n=== sendSms (real) ===");
  sendSms({
    to: toPhone,
    text: "Test SMS from werehouse – " + new Date().toISOString(),
  })
    .then((r) => {
      log("send result", r);
      if (r.messageId) {
        console.log("\n=== checkSmsDeliveryStatus (real) ===");
        return checkSmsDeliveryStatus(r.messageId).then((s) => log("track result", s));
      }
    })
    .catch((e) => {
      if (e instanceof SmsProviderError) {
        console.error("[TEST] SmsProviderError", e.message, e.status, e.providerResponse);
      } else {
        console.error("[TEST] Error", e);
      }
    });
} else {
  console.log("\n=== Skip real send (set SEND_REAL_SMS=1 and TO_PHONE to run) ===");
}

console.log("\n[Done]\n");
