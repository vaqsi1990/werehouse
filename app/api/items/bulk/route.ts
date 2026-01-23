import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { itemSchema, type ItemFormData } from "../../../lib/validations";

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
    const validatedItems: ItemFormData[] = [];
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

    // Create items in bulk with increased timeout for large files
    const createdItems = await prisma.$transaction(
      async (tx) => {
        const results = [];
        for (const item of validatedItems) {
          // tarighi is now stored as string in DD/MM/YYYY format
          const itemData: any = { ...item };
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
          
          const created = await tx.item.create({
            data: itemData,
          });
          results.push(created);
        }
        return results;
      },
      {
        maxWait: 20000, // Maximum time to wait for a transaction slot
        timeout: 120000, // Maximum time the transaction can run (120 seconds / 2 minutes)
      }
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
