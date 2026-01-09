import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

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
    return NextResponse.json(item);
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

