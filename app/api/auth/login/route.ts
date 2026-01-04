import { NextResponse } from "next/server";

// პაროლი შეიძლება იყოს environment variable-ში
// თუ არ არის დაყენებული, გამოიყენება default პაროლი
const APP_PASSWORD = process.env.APP_PASSWORD || "admin123";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { message: "პაროლი აუცილებელია" },
        { status: 400 }
      );
    }

    if (password === APP_PASSWORD) {
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

