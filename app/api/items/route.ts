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
    
    // Convert tarighi to Date object
    const itemData: any = { ...body };
    if (itemData.tarighi !== undefined && itemData.tarighi !== null) {
      try {
        // If it's a number, it might be Excel serial number
        if (typeof itemData.tarighi === 'number') {
          // Excel serial date: January 1, 1900 = 1
          const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
          const date = new Date(excelEpoch.getTime() + (itemData.tarighi - 1) * 24 * 60 * 60 * 1000);
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            itemData.tarighi = date;
          } else {
            itemData.tarighi = null;
          }
        } else if (typeof itemData.tarighi === 'string') {
          const dateStr = itemData.tarighi.trim();
          if (dateStr === "" || dateStr === "null" || dateStr === "undefined") {
            itemData.tarighi = null;
          } else {
            // If already ISO format, parse directly
            if (dateStr.includes('T') || dateStr.includes('Z')) {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                itemData.tarighi = date;
              } else {
                itemData.tarighi = null;
              }
            } else {
              // Try parsing as Excel date (MM/DD/YYYY or DD/MM/YYYY)
              const dateParts = dateStr.split(/[\/\-\.]/);
              if (dateParts.length === 3) {
                let day: number, month: number, year: number;
                
                // Try MM/DD/YYYY format first (US format)
                if (parseInt(dateParts[0]) > 12) {
                  // DD/MM/YYYY format (European format)
                  day = parseInt(dateParts[0]);
                  month = parseInt(dateParts[1]) - 1;
                  year = parseInt(dateParts[2]);
                } else {
                  // MM/DD/YYYY format
                  month = parseInt(dateParts[0]) - 1;
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
                  if (!isNaN(date.getTime())) {
                    itemData.tarighi = date;
                  } else {
                    itemData.tarighi = null;
                  }
                } else {
                  itemData.tarighi = null;
                }
              } else {
                // Try parsing as ISO date string
                const isoDate = new Date(dateStr);
                if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() > 1900 && isoDate.getFullYear() < 2100) {
                  itemData.tarighi = isoDate;
                } else {
                  itemData.tarighi = null;
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("Date conversion failed:", itemData.tarighi, e);
        itemData.tarighi = null;
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

