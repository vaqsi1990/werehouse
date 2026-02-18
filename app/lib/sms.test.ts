/**
 * SMS lib tests – run: npx tsx app/lib/sms.test.ts
 * Real send/track only if SEND_REAL_SMS=1 and TO_PHONE is set.
 */

import {
  normalizePhoneToMsgGe,
  buildStatusSmsText,
  buildWarehouseArrivalSmsText,
  sendSmsViaMsgGe,
  checkSmsDeliveryStatus,
  SmsProviderError,
  type SmsItemStatus,
} from "./sms";

function log(label: string, data: unknown) {
  console.log(`\n[TEST] ${label}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
}

// --- normalizePhoneToMsgGe
console.log("\n=== normalizePhoneToMsgGe ===");
const phones = [
  "591357357",
  "0591357357",
  "995591357357",
  "+995 591 357 357",
  "invalid",
  "",
];
for (const p of phones) {
  const out = normalizePhoneToMsgGe(p);
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

// --- Optional: real send + track (only if env set)
const sendReal = process.env.SEND_REAL_SMS === "1";
const toPhone = process.env.TO_PHONE?.trim();

if (sendReal && toPhone) {
  console.log("\n=== sendSmsViaMsgGe (real) ===");
  sendSmsViaMsgGe({
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
