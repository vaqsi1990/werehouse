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
    console.log("Creating item with data:", body);
    
    // tarighi is now stored as string in DD/MM/YYYY format
    const itemData: any = { ...body };
    // If tarighi is empty or invalid, set to null
    if (itemData.tarighi !== undefined && itemData.tarighi !== null && itemData.tarighi !== "") {
      const tarighiStr = String(itemData.tarighi).trim();
      if (tarighiStr === "" || tarighiStr === "null" || tarighiStr === "undefined") {
        itemData.tarighi = null;
      } else {
        itemData.tarighi = tarighiStr;
      }
    } else {
      itemData.tarighi = null;
    }
    
    const item = await prisma.item.create({
      data: itemData,
    });
    console.log("Item created successfully:", item);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Error creating item:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to create item",
        message: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}

