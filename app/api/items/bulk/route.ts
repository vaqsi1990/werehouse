import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { itemSchema, type ItemFormData } from "../../../lib/validations";
import { buildStatusSmsText, sendSmsViaMsgGe } from "@/app/lib/sms";
import type { Item, Prisma } from "@/app/generated/prisma/client";

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
      } catch (error: unknown) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : "Validation failed"}`
        );
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
        const results: Item[] = [];
        for (const item of validatedItems) {
          // tarighi is now stored as string in DD/MM/YYYY format
          const itemData = { ...item } as Prisma.ItemCreateInput;
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

    // Auto-send SMS for each imported item (non-blocking for overall import success).
    const smsCandidates = createdItems.filter((it) => {
      const canNotifyStatus =
        (it.status === "IN_WAREHOUSE" ||
          it.status === "STOPPED" ||
          it.status === "RELEASED" ||
          it.status === "REGION") &&
        !it.smsSent &&
        Boolean(it.telefoni);
      return canNotifyStatus;
    });

    const concurrency = 5;
    const successIds: string[] = [];
    const failures: Array<{ id: string; to: string; message: string }> = [];

    let cursor = 0;
    const workerCount = Math.min(concurrency, smsCandidates.length);

    const workers = Array.from({ length: workerCount }, async () => {
      while (true) {
        const current = smsCandidates[cursor];
        cursor += 1;
        if (!current) break;

        try {
          const text = buildStatusSmsText(current.status, current.shtrikhkodi || "");
          await sendSmsViaMsgGe({ to: current.telefoni, text });
          successIds.push(current.id);
        } catch (e: unknown) {
          failures.push({
            id: current.id,
            to: current.telefoni,
            message: e instanceof Error ? e.message : "SMS send failed",
          });
        }
      }
    });

    await Promise.all(workers);

    if (successIds.length > 0) {
      await prisma.item.updateMany({
        where: { id: { in: successIds } },
        data: { smsSent: true },
      });
    }

    const successIdSet = new Set(successIds);
    const createdItemsWithSms = createdItems.map((it) =>
      successIdSet.has(it.id) ? { ...it, smsSent: true } : it
    );

    return NextResponse.json(
      { 
        items: createdItemsWithSms,
        success: createdItems.length,
        errors: errors.length > 0 ? errors : undefined,
        sms: {
          attempted: smsCandidates.length,
          sent: successIds.length,
          failed: failures.length,
          failures: failures.length > 0 ? failures.slice(0, 20) : undefined,
          failuresTruncated: failures.length > 20 ? failures.length - 20 : 0,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating items:", error);
    return NextResponse.json(
      { 
        error: "Failed to create items",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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
  } catch (error: unknown) {
    console.error("Error deleting items:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete items",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
