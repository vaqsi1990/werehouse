import { NextResponse } from "next/server";

function expectedPassword(country: unknown) {
  if (country === "RUSSIA") {
    return process.env.Russian_password;
  }
  return process.env.APP_PASSWORD || "admin123";
}

export async function POST(request: Request) {
  try {
    const { password, country } = await request.json();

    if (!password) {
      return NextResponse.json(
        { message: "პაროლი აუცილებელია" },
        { status: 400 }
      );
    }

    const expected = expectedPassword(country);
    if (!expected) {
      return NextResponse.json(
        { message: "პაროლი არ არის კონფიგურირებული" },
        { status: 500 }
      );
    }

    if (password === expected) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { message: "პაროლი არასწორია" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "შეცდომა სერვერზე" },
      { status: 500 }
    );
  }
}

