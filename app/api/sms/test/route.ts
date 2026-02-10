import { NextResponse } from "next/server";
import { sendSmsViaMsgGe } from "@/app/lib/sms";

export async function GET(request: Request) {
  try {
    // Optional simple protection with the same SMS_API_KEY as main /api/sms
    const requiredKey = process.env.SMS_API_KEY;
    if (requiredKey) {
      const providedKey = request.headers.get("x-sms-api-key");
      if (!providedKey || providedKey !== requiredKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const toParam = searchParams.get("to");
    const textParam = searchParams.get("text");

    const toEnv = process.env.SMS_TEST_NUMBER;
    const to = toParam || toEnv;

    if (!to) {
      return NextResponse.json(
        {
          error: "Missing phone number",
          message:
            "Provide ?to=9955XXXXXXX in query string or set SMS_TEST_NUMBER in .env",
        },
        { status: 400 }
      );
    }

    const text =
      textParam ||
      "ტესტ SMS Warehouse სისტემიდან – თუ იღებთ ამ შეტყობინებას, SMS ინტეგრაცია მუშაობს.";

    const { providerResponse } = await sendSmsViaMsgGe({ to, text });

    return NextResponse.json({
      success: true,
      to,
      text,
      providerResponse,
    });
  } catch (error: unknown) {
    console.error("SMS test endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

