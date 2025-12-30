import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await prisma.item.create({
      data: body,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

