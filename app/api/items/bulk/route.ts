import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { itemSchema } from "../../../lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Expected an array of items." },
        { status: 400 }
      );
    }

    // Validate all items
    const validatedItems = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const validatedItem = itemSchema.parse({
          ...items[i],
          status: items[i].status || "IN_WAREHOUSE",
        });
        validatedItems.push(validatedItem);
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message || "Validation failed"}`);
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        { 
          error: "No valid items found",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Create items in bulk
    const createdItems = await prisma.$transaction(
      validatedItems.map((item) =>
        prisma.item.create({
          data: item,
        })
      )
    );

    console.log(`Successfully created ${createdItems.length} items`);

    return NextResponse.json(
      { 
        items: createdItems,
        success: createdItems.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating items:", error);
    return NextResponse.json(
      { 
        error: "Failed to create items",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Delete all items
    const result = await prisma.item.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} items`);

    return NextResponse.json(
      { 
        message: "All items deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting items:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete items",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
