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

    // Helper function to convert date strings/numbers to ISO format
    const convertDateToISO = (dateValue: string | number | Date | undefined | null): Date | null => {
      if (!dateValue && dateValue !== 0) return null;
      
      try {
        // If it's already a Date object
        if (dateValue instanceof Date) {
          if (!isNaN(dateValue.getTime())) return dateValue;
          return null;
        }
        
        // If it's a number, it might be Excel serial number
        if (typeof dateValue === 'number') {
          // Excel serial date: January 1, 1900 = 1
          // JavaScript Date: January 1, 1900 = -2208988800000 ms
          // Excel epoch is January 1, 1900, but Excel incorrectly treats 1900 as a leap year
          // So we need to adjust: Excel date 1 = January 1, 1900
          const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
          const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }
          return null;
        }
        
        // If it's a string
        const dateStr = String(dateValue).trim();
        if (dateStr === "" || dateStr === "null" || dateStr === "undefined") return null;
        
        // If already ISO format, parse directly
        if (dateStr.includes('T') || dateStr.includes('Z')) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }
        }
        
        // Try parsing as Excel date (MM/DD/YYYY or DD/MM/YYYY)
        const dateParts = dateStr.split(/[\/\-\.]/);
        if (dateParts.length === 3) {
          let day: number, month: number, year: number;
          
          // Try MM/DD/YYYY format first (US format)
          if (parseInt(dateParts[0]) > 12) {
            // DD/MM/YYYY format (European format)
            day = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
            year = parseInt(dateParts[2]);
          } else {
            // MM/DD/YYYY format
            month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
            day = parseInt(dateParts[1]);
            year = parseInt(dateParts[2]);
          }
          
          // Handle 2-digit years
          if (year < 100) {
            year += 2000;
          }
          
          // Validate year range
          if (year >= 1900 && year < 2100) {
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
          }
        }
        
        // Try parsing as ISO date string
        const isoDate = new Date(dateStr);
        if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() > 1900 && isoDate.getFullYear() < 2100) {
          return isoDate;
        }
      } catch (e) {
        console.warn("Date conversion failed:", dateValue, e);
      }
      
      return null;
    };

    // Create items in bulk with increased timeout for large files
    const createdItems = await prisma.$transaction(
      async (tx) => {
        const results = [];
        for (const item of validatedItems) {
          // Convert tarighi to Date object
          const itemData: any = { ...item };
          if (itemData.tarighi !== undefined && itemData.tarighi !== null) {
            const convertedDate = convertDateToISO(itemData.tarighi);
            itemData.tarighi = convertedDate;
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
