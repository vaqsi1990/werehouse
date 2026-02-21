import { NextResponse } from "next/server";
import { z } from "zod";
import { SmsProviderError, sendSmsViaMsgGe } from "@/app/lib/sms";

const sendBulkSmsSchema = z.object({
  to: z.array(z.string().min(1)).min(1, "At least one recipient is required"),
  text: z.string().min(1, "Message text is required").max(1000, "Message too long"),
});

export async function POST(request: Request) {
  try {
    const requiredKey = process.env.SMS_API_KEY;
    if (requiredKey) {
      const providedKey = request.headers.get("x-sms-api-key");
      if (!providedKey || providedKey !== requiredKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const parsed = sendBulkSmsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { to, text } = parsed.data;
    const results: { to: string; success: boolean; error?: string }[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const phone of to) {
      try {
        await sendSmsViaMsgGe({ to: phone.trim(), text });
        results.push({ to: phone, success: true });
        successCount++;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "SMS send failed";
        results.push({ to: phone, success: false, error: message });
        failCount++;
      }
    }

    return NextResponse.json({
      success: failCount === 0,
      successCount,
      failCount,
      results,
    });
  } catch (error: unknown) {
    console.error("SMS bulk send error:", error);

    if (error instanceof SmsProviderError) {
      return NextResponse.json(
        {
          error: "SMS provider error",
          message: error.message,
          providerResponse: error.providerResponse,
          status: error.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
