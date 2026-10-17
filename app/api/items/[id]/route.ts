import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { buildStatusSmsText, parcelOriginFromCountry, sendSmsViaMsgGe } from "@/app/lib/sms";
import { todayDateLabel } from "@/app/lib/dates";
import { isRussiaOnlyStatus, ITEM_STATUSES } from "@/app/lib/statuses";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.item.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("Updating item:", id, "with data:", body);
    
    // Validate status if provided
    const validStatuses: string[] = [...ITEM_STATUSES];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          error: "Invalid status",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (body.status && isRussiaOnlyStatus(body.status) && existing.country !== "RUSSIA") {
      return NextResponse.json(
        { error: "Invalid status", message: "ეს სტატუსი მხოლოდ რუსეთისთვისაა" },
        { status: 400 }
      );
    }

    const data = { ...body };
    delete data.country;
    if (existing.country === "RUSSIA" && body.status && body.status !== existing.status) {
      data.tarighi = todayDateLabel();
    }

    const item = await prisma.item.update({
      where: {
        id: id,
      },
      data,
    });
    console.log("Item updated successfully:", item);

    let smsSent = item.smsSent;
    if (
      item.country !== "RUSSIA" &&
      (item.status === "IN_WAREHOUSE" ||
        item.status === "STOPPED" ||
        item.status === "RELEASED" ||
        item.status === "REGION") &&
      item.telefoni?.trim()
    ) {
      try {
        const regionName = item.status === "REGION" ? item.kalaki?.trim() : undefined;
        const text = buildStatusSmsText(
          item.status,
          item.shtrikhkodi || "",
          regionName,
          parcelOriginFromCountry(item.country)
        );
        await sendSmsViaMsgGe({
          to: String(item.telefoni).trim(),
          text,
        });
        smsSent = true;
        await prisma.item.update({
          where: { id: item.id },
          data: { smsSent: true },
        });
        console.log("[SMS] Sent on status update", { itemId: item.id, status: item.status });
      } catch (smsError) {
        console.error("Failed to send SMS on status update:", item.id, smsError);
      }
    }

    return NextResponse.json({ ...item, smsSent });
  } catch (error: any) {
    console.error("Error updating item:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to update item",
        message: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN",
        meta: error?.meta,
      },
      { status: 500 }
    );
  }
}

