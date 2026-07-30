import { NextResponse } from "next/server";
import { z } from "zod";
import { SmsProviderError, sendSmsViaMsgGe } from "@/app/lib/sms";

const sendSmsSchema = z.object({
  to: z.string().min(6, "Recipient phone is required"),
  text: z.string().min(1, "Message text is required").max(1000, "Message too long"),
});

export async function POST(request: Request) {
  try {
    // Optional protection: if SMS_INTERNAL_API_KEY is set, require it via header.
    const requiredKey = process.env.SMS_INTERNAL_API_KEY;
    if (requiredKey) {
      const providedKey = request.headers.get("x-sms-api-key");
      if (!providedKey || providedKey !== requiredKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const parsed = sendSmsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { providerResponse } = await sendSmsViaMsgGe({
      to: parsed.data.to,
      text: parsed.data.text,
    });

    return NextResponse.json({
      success: true,
      providerResponse,
    });
  } catch (error: unknown) {
    console.error("SMS send error:", error);

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

