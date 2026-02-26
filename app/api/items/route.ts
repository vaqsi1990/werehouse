import { NextResponse } from "next/server";
import prisma from "../../lib/prisma";
import { buildStatusSmsText, sendSmsViaMsgGe } from "@/app/lib/sms";
import type { Prisma } from "@/app/generated/prisma/client";

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
    const itemData = { ...body } as Prisma.ItemCreateInput;
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

    // ავტომატური SMS გაგზავნა მხოლოდ მაშინ, თუ სტატუსი ერთ-ერთი არსებულიდანაა
    // (STOPPED, IN_WAREHOUSE, RELEASED, REGION) და ტელეფონის ველი შევსებულია.
    // SMS-ის ჩავარდნა არ აფუჭებს ნივთის შექმნას.
    let smsSent = item.smsSent;
    // REGION-ზე SMS არ იგზავნება
    const canNotifyStatus =
      (item.status === "IN_WAREHOUSE" ||
        item.status === "STOPPED" ||
        item.status === "RELEASED") &&
      !item.smsSent &&
      item.telefoni;

    if (canNotifyStatus) {
      try {
        const regionName = item.status === "REGION" ? item.kalaki?.trim() : undefined;
        const text = buildStatusSmsText(item.status, item.shtrikhkodi || "", regionName);
        await sendSmsViaMsgGe({
          to: String(item.telefoni).trim(),
          text,
        });
        smsSent = true;
        await prisma.item.update({
          where: { id: item.id },
          data: { smsSent: true },
        });
      } catch (smsError) {
        console.error("Failed to send SMS for item:", item.id, smsError);
      }
    }

    return NextResponse.json({ ...item, smsSent }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating item:", error);
    const details =
      typeof error === "object" && error !== null
        ? {
            message: "message" in error ? String((error as { message?: unknown }).message) : undefined,
            code: "code" in error ? String((error as { code?: unknown }).code) : undefined,
            meta: "meta" in error ? (error as { meta?: unknown }).meta : undefined,
          }
        : { message: undefined, code: undefined, meta: undefined };
    console.error("Error details:", details);
    return NextResponse.json(
      { 
        error: "Failed to create item",
        message: error instanceof Error ? error.message : "Unknown error",
        code: details.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}

