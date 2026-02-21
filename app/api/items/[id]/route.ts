import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { buildStatusSmsText, sendSmsViaMsgGe } from "@/app/lib/sms";

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
    const validStatuses = ["STOPPED", "IN_WAREHOUSE", "RELEASED", "REGION"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          error: "Invalid status",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }
    
    const item = await prisma.item.update({
      where: {
        id: id,
      },
      data: body,
    });
    console.log("Item updated successfully:", item);

    // SMS სტატუსის შეცვლისას – თუ ახალი სტატუსი ერთ-ერთია (IN_WAREHOUSE, STOPPED, RELEASED); REGION-ზე SMS არ იგზავნება
    const canNotifyStatus =
      (item.status === "IN_WAREHOUSE" ||
        item.status === "STOPPED" ||
        item.status === "RELEASED") &&
      item.telefoni?.trim();

    let smsSent = item.smsSent;
    if (canNotifyStatus) {
      try {
        const regionName = item.status === "REGION" ? item.kalaki?.trim() : undefined;
        const text = buildStatusSmsText(item.status, item.shtrikhkodi || "", regionName);
    
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

