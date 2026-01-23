"use client";

import { useState } from "react";
import { itemSchema, type ItemFormData } from "../lib/validations";
import { z } from "zod";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

interface AddProductFormProps {
  onAdd: (product: ItemFormData) => void;
  onBulkAdd?: (products: ItemFormData[]) => void;
  onClose?: () => void;
  activeSection?: string;
}

type FormMode = "manual" | "file";

export default function AddProductForm({ onAdd, onBulkAdd, onClose, activeSection }: AddProductFormProps) {
  const [mode, setMode] = useState<FormMode>("manual");
  const [formData, setFormData] = useState({
    shtrikhkodi: "",
    gamomcemeli: "",
    mimgebi: "",
    telefoni: "",
    kalaki: "",
    sakGadakhda: "",
    tarighi: "",
    tsona: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine status based on activeSection
    const defaultStatus = activeSection === "stopped" ? "STOPPED" : activeSection === "region" ? "REGION" : "IN_WAREHOUSE";
    
    try {
      const validatedData = itemSchema.parse({
        ...formData,
        status: defaultStatus,
      });
      
      onAdd(validatedData);
      
      // Reset form
      setFormData({
        shtrikhkodi: "",
        gamomcemeli: "",
        mimgebi: "",
        telefoni: "",
        kalaki: "",
        sakGadakhda: "",
        tarighi: "",
        tsona: "",
      });
      setErrors({});
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const parseExcelFile = async (file: File): Promise<ItemFormData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: false, cellNF: false });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          // Convert to JSON with raw option to preserve date strings
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            raw: false, // Convert all values to strings to preserve date formats
            defval: null // Use null for empty cells
          }) as any[];

          const items: ItemFormData[] = [];
          
          if (jsonData.length === 0) {
            reject(new Error("Excel ფაილი ცარიელია"));
            return;
          }

          // Expected columns: shtrikhkodi, gamomcemeli, mimgebi, telefoni, tsona, kalaki, sakGadakhda, tarighi
          // Try to auto-detect column mapping
          const headers = Object.keys(jsonData[0] || {});
          
          // Debug: Log headers and first row to see what Excel is returning
          if (jsonData.length > 0) {
            console.log("Excel headers:", headers);
            console.log("First row sample:", JSON.stringify(jsonData[0], null, 2));
          }
          
          // Create a case-insensitive lookup map with normalized keys
          const createLookupMap = (row: any) => {
            const map: Record<string, any> = {};
            Object.keys(row).forEach(key => {
              // Store original key
              map[key] = row[key];
              // Store lowercase version
              map[key.toLowerCase()] = row[key];
              // Store normalized version (remove extra spaces, special chars)
              const normalized = key.toLowerCase().replace(/\s+/g, ' ').trim();
              map[normalized] = row[key];
              // Store without spaces
              map[key.toLowerCase().replace(/\s+/g, '')] = row[key];
              // Store without dots
              map[key.toLowerCase().replace(/\./g, '')] = row[key];
              // Store without spaces and dots
              map[key.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')] = row[key];
            });
            return map;
          };
          
          jsonData.forEach((row, index) => {
            try {
              // Skip empty rows
              const rowValues = Object.values(row).filter(v => v !== null && v !== undefined && String(v).trim() !== "");
              if (rowValues.length === 0) return;

              const rowMap = createLookupMap(row);
              
              // Try different possible column names (case-insensitive, with normalization)
              // Returns string or number (for Excel serial dates)
              const getValue = (keys: string[], returnNumber = false): string | number | undefined => {
                for (const key of keys) {
                  // Try exact match first
                  if (rowMap[key] !== undefined) {
                    const value = rowMap[key];
                    if (value !== null && value !== undefined) {
                      // For dates, return number if it's a number (Excel serial date)
                      if (returnNumber && typeof value === 'number') {
                        return value;
                      }
                      const strValue = String(value).trim();
                      if (strValue !== "" && strValue !== "null" && strValue !== "undefined") {
                        return strValue;
                      }
                    }
                  }
                  // Try case-insensitive match
                  const lowerKey = key.toLowerCase();
                  if (rowMap[lowerKey] !== undefined) {
                    const value = rowMap[lowerKey];
                    if (value !== null && value !== undefined) {
                      if (returnNumber && typeof value === 'number') {
                        return value;
                      }
                      const strValue = String(value).trim();
                      if (strValue !== "" && strValue !== "null" && strValue !== "undefined") {
                        return strValue;
                      }
                    }
                  }
                  // Try normalized match (remove spaces)
                  const normalizedKey = lowerKey.replace(/\s+/g, '');
                  if (rowMap[normalizedKey] !== undefined) {
                    const value = rowMap[normalizedKey];
                    if (value !== null && value !== undefined) {
                      if (returnNumber && typeof value === 'number') {
                        return value;
                      }
                      const strValue = String(value).trim();
                      if (strValue !== "" && strValue !== "null" && strValue !== "undefined") {
                        return strValue;
                      }
                    }
                  }
                  // Try without dots
                  const noDotsKey = lowerKey.replace(/\./g, '');
                  if (rowMap[noDotsKey] !== undefined) {
                    const value = rowMap[noDotsKey];
                    if (value !== null && value !== undefined) {
                      if (returnNumber && typeof value === 'number') {
                        return value;
                      }
                      const strValue = String(value).trim();
                      if (strValue !== "" && strValue !== "null" && strValue !== "undefined") {
                        return strValue;
                      }
                    }
                  }
                  // Try partial match - check if any header contains the key
                  const headerKeys = Object.keys(row);
                  for (const headerKey of headerKeys) {
                    const normalizedHeader = headerKey.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
                    const normalizedSearch = lowerKey.replace(/\s+/g, '').replace(/\./g, '');
                    if (normalizedHeader.includes(normalizedSearch) || normalizedSearch.includes(normalizedHeader)) {
                      const value = row[headerKey];
                      if (value !== null && value !== undefined) {
                        if (returnNumber && typeof value === 'number') {
                          return value;
                        }
                        const strValue = String(value).trim();
                        if (strValue !== "" && strValue !== "null" && strValue !== "undefined") {
                          return strValue;
                        }
                      }
                    }
                  }
                }
                return undefined;
              };

              const shtrikhkodi = getValue(["შტრიხ კოდი", "shtrikhkodi", "mtrikhkodi", "productNumber", "Product Code", "product code", "კოდი", "A", "A1"]);
              const gamomcemeli = getValue(["გამომგზავნი", "გამომგზავნი", "gamomcemeli", "Sender", "sender", "B", "B1"]);
              const mimgebi = getValue(["მიმღები", "mimgebi", "Receiver", "receiver", "Name", "name", "სახელი", "C", "C1"]);
              const telefoni = getValue(["ტელეფონი", "telefoni", "phone", "Phone", "ტელ", "D", "D1"]);
              const tsona = getValue(["წონა", "tsona", "weight", "Weight", "წონა (kg)", "E", "E1"]);
              const kalaki = getValue(["ქალაქი", "kalaki", "city", "City", "F", "F1"]);
              const sakGadakhda = getValue(["საქ.გადახდა", "საქ გადახდა", "საქგადახდა", "sakGadakhda", "sak.gadakhda", "sak gadakhda", "sakgadakhda", "Payment", "payment", "გადახდა", "G", "G1"]);
              
              // Get tarighi from Excel - Excel might return dates as serial numbers, strings, or Date objects
              // Try getValue with returnNumber=true to get Excel serial dates
              let tarighiRaw = getValue(["თარიღი", "tarighi", "date", "Date", "H", "H1"]);
              let tarighiRawAsNumber = getValue(["თარიღი", "tarighi", "date", "Date", "H", "H1"], true);
              
              // Also try to get directly from row in case getValue didn't find it
              if (!tarighiRaw && !tarighiRawAsNumber) {
                const headerKeys = Object.keys(row);
                for (const key of headerKeys) {
                  const lowerKey = key.toLowerCase().trim();
                  if (lowerKey === "თარიღი" || lowerKey.includes("თარიღი") || lowerKey === "tarighi" || lowerKey === "date") {
                    const value = row[key];
                    if (value !== undefined && value !== null && value !== "") {
                      // If it's a Date object, convert to string
                      if (value instanceof Date) {
                        const day = value.getDate();
                        const month = value.getMonth() + 1;
                        const year = value.getFullYear();
                        tarighiRaw = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                      } else if (typeof value === 'number') {
                        tarighiRawAsNumber = value;
                      } else {
                        tarighiRaw = String(value).trim();
                      }
                      break;
                    }
                  }
                }
              }
              
              const tarighiValue = tarighiRaw || tarighiRawAsNumber;
              
              // Debug logging
              if (index < 3) {
                console.log(`Row ${index + 1} - tarighiRaw:`, tarighiRaw, "tarighiRawAsNumber:", tarighiRawAsNumber, "tarighiValue:", tarighiValue, "row keys:", Object.keys(row));
              }

              // Convert date from various formats to DD/MM/YYYY format
              // Handles both string formats, Excel serial numbers, and Date objects
              const convertDateToDDMMYYYY = (dateValue: string | number | Date | undefined): string | undefined => {
                if (!dateValue && dateValue !== 0) return undefined;
                
                try {
                  let day: number, month: number, year: number;
                  
                  // If it's already a Date object
                  if (dateValue instanceof Date) {
                    if (!isNaN(dateValue.getTime()) && dateValue.getFullYear() > 1900 && dateValue.getFullYear() < 2100) {
                      day = dateValue.getDate();
                      month = dateValue.getMonth() + 1;
                      year = dateValue.getFullYear();
                      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                    }
                    return undefined;
                  }
                  
                  // If it's a number, it might be Excel serial number
                  if (typeof dateValue === 'number') {
                    // Excel serial date: January 1, 1900 = 1
                    // Excel epoch is December 30, 1899
                    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
                    const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
                    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                      day = date.getDate();
                      month = date.getMonth() + 1; // Month is 1-indexed for display
                      year = date.getFullYear();
                      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                    }
                    return undefined;
                  }
                  
                  // If it's a string
                  const dateStr = String(dateValue).trim();
                  if (dateStr === "" || dateStr === "null" || dateStr === "undefined") return undefined;
                  
                  // If already in DD/MM/YYYY format, return as is (with validation)
                  const ddmmYYYYPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                  const match = dateStr.match(ddmmYYYYPattern);
                  if (match) {
                    const d = parseInt(match[1]);
                    const m = parseInt(match[2]);
                    const y = parseInt(match[3]);
                    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y < 2100) {
                      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
                    }
                  }
                  
                  // Try parsing as ISO format (YYYY-MM-DD or with time)
                  if (dateStr.includes('T') || dateStr.includes('Z') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                      day = date.getDate();
                      month = date.getMonth() + 1;
                      year = date.getFullYear();
                      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                    }
                    return undefined;
                  }
                  
                  // Try parsing as Excel date (MM/DD/YYYY or DD/MM/YYYY)
                  const dateParts = dateStr.split(/[\/\-\.]/);
                  if (dateParts.length === 3) {
                    // Try MM/DD/YYYY format first (US format)
                    if (parseInt(dateParts[0]) > 12) {
                      // DD/MM/YYYY format (European format)
                      day = parseInt(dateParts[0]);
                      month = parseInt(dateParts[1]);
                      year = parseInt(dateParts[2]);
                    } else {
                      // MM/DD/YYYY format
                      month = parseInt(dateParts[0]);
                      day = parseInt(dateParts[1]);
                      year = parseInt(dateParts[2]);
                    }
                    
                    // Handle 2-digit years
                    if (year < 100) {
                      year += 2000;
                    }
                    
                    // Validate
                    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year < 2100) {
                      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                    }
                  }
                  
                  // If we get here, try general Date parsing as last resort
                  const generalDate = new Date(dateStr);
                  if (!isNaN(generalDate.getTime()) && generalDate.getFullYear() > 1900 && generalDate.getFullYear() < 2100) {
                    day = generalDate.getDate();
                    month = generalDate.getMonth() + 1;
                    year = generalDate.getFullYear();
                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                  }
                } catch (e) {
                  console.warn("Date conversion failed:", dateValue, e);
                }
                
                return undefined;
              };
              
              // Convert to DD/MM/YYYY format
              const tarighi = convertDateToDDMMYYYY(tarighiValue);

              // Allow empty sakGadakhda (use empty string as default)
              const sakGadakhdaValue = sakGadakhda || "";

              // Check required fields (sakGadakhda is now optional, can be empty)
              if (shtrikhkodi && gamomcemeli && mimgebi && telefoni && tsona && kalaki) {
                try {
                  const defaultStatus = activeSection === "stopped" ? "STOPPED" : activeSection === "region" ? "REGION" : "IN_WAREHOUSE";
                  const item = itemSchema.parse({
                    shtrikhkodi,
                    gamomcemeli,
                    mimgebi,
                    telefoni,
                    tsona,
                    kalaki,
                    sakGadakhda: sakGadakhdaValue,
                    tarighi: tarighi || undefined,
                    status: defaultStatus,
                  });
                  items.push(item);
                } catch (validationError: any) {
                  console.warn(`Row ${index + 2} validation failed:`, validationError.message, {
                    shtrikhkodi,
                    gamomcemeli,
                    mimgebi,
                    telefoni,
                    tsona,
                    kalaki,
                    sakGadakhda: sakGadakhdaValue,
                  });
                }
              } else {
                console.warn(`Row ${index + 2} missing required fields:`, {
                  hasShtrikhkodi: !!shtrikhkodi,
                  hasGamomcemeli: !!gamomcemeli,
                  hasMimgebi: !!mimgebi,
                  hasTelefoni: !!telefoni,
                  hasTsona: !!tsona,
                  hasKalaki: !!kalaki,
                });
              }
            } catch (err) {
              console.warn(`Row ${index + 2} failed validation:`, err);
            }
          });

          if (items.length === 0) {
            const availableHeaders = headers.length > 0 ? headers.join(", ") : "სვეტები ვერ მოიძებნა";
            reject(new Error(`ფაილში ვერ მოიძებნა სწორი მონაცემები. გთხოვთ შეამოწმოთ სვეტების სახელები.\n\nმოსალოდნელი სვეტები: შტრიხ კოდი, გამომგზავნი (ან გამომგზავნი), მიმღები, ტელეფონი, წონა, ქალაქი, საქ.გადახდა, თარიღი\n\nნაპოვნი სვეტები: ${availableHeaders}`));
          } else {
            resolve(items);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("ფაილის წაკითხვა ვერ მოხერხდა"));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseWordFile = async (file: File): Promise<ItemFormData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;

          // Parse text - expect format like:
          // ამანათის ნომერი: XXX
          // სახელი: XXX
          // etc.
          const items: ItemFormData[] = [];
          const blocks = text.split(/\n\s*\n/); // Split by double newlines

          blocks.forEach((block, index) => {
            try {
              const lines = block.split("\n").map(l => l.trim()).filter(l => l);
              const data: any = {};

              lines.forEach(line => {
                const lowerLine = line.toLowerCase();
                if (line.includes("შტრიხ კოდი") || lowerLine.includes("product code") || lowerLine.includes("shtrikhkodi") || lowerLine.includes("mtrikhkodi") || lowerLine.includes("productnumber")) {
                  data.shtrikhkodi = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("გამომგზავნი") || line.includes("გამომგზავნი") || lowerLine.includes("sender") || lowerLine.includes("gamomcemeli")) {
                  data.gamomcemeli = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("მიმღები") || lowerLine.includes("receiver") || lowerLine.includes("mimgebi") || lowerLine.includes("name")) {
                  data.mimgebi = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("ტელეფონი") || lowerLine.includes("telefoni") || lowerLine.includes("phone")) {
                  data.telefoni = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("წონა") || lowerLine.includes("tsona") || lowerLine.includes("weight")) {
                  data.tsona = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("ქალაქი") || lowerLine.includes("kalaki") || lowerLine.includes("city")) {
                  data.kalaki = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("საქ.გადახდა") || line.includes("საქ გადახდა") || line.includes("საქგადახდა") || line.includes("გადახდა") || lowerLine.includes("sakgadakhda") || lowerLine.includes("sak.gadakhda") || lowerLine.includes("sak gadakhda") || lowerLine.includes("payment")) {
                  data.sakGadakhda = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("თარიღი") || lowerLine.includes("tarighi") || lowerLine.includes("date")) {
                  data.tarighi = line.split(/[:：]/)[1]?.trim() || "";
                }
              });

              // Convert date from various formats to DD/MM/YYYY format
              const convertDateToDDMMYYYY = (dateValue: string | number | undefined): string | undefined => {
                if (!dateValue && dateValue !== 0) return undefined;
                
                try {
                  let day: number, month: number, year: number;
                  
                  // If it's a number, it might be Excel serial number
                  if (typeof dateValue === 'number') {
                    const excelEpoch = new Date(1899, 11, 30);
                    const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
                    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                      day = date.getDate();
                      month = date.getMonth() + 1;
                      year = date.getFullYear();
                    } else {
                      return undefined;
                    }
                  } else {
                    const dateStr = String(dateValue).trim();
                    if (dateStr === "" || dateStr === "null" || dateStr === "undefined") return undefined;
                    
                    // If already in DD/MM/YYYY format, return as is
                    const ddmmYYYYPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                    const match = dateStr.match(ddmmYYYYPattern);
                    if (match) {
                      const d = parseInt(match[1]);
                      const m = parseInt(match[2]);
                      const y = parseInt(match[3]);
                      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y < 2100) {
                        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
                      }
                    }
                    
                    // Try parsing as ISO format or other formats
                    if (dateStr.includes('T') || dateStr.includes('Z') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                      const date = new Date(dateStr);
                      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                        day = date.getDate();
                        month = date.getMonth() + 1;
                        year = date.getFullYear();
                      } else {
                        return undefined;
                      }
                    } else {
                      const dateParts = dateStr.split(/[\/\-\.]/);
                      if (dateParts.length === 3) {
                        if (parseInt(dateParts[0]) > 12) {
                          day = parseInt(dateParts[0]);
                          month = parseInt(dateParts[1]);
                          year = parseInt(dateParts[2]);
                        } else {
                          month = parseInt(dateParts[0]);
                          day = parseInt(dateParts[1]);
                          year = parseInt(dateParts[2]);
                        }
                        if (year < 100) year += 2000;
                        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year >= 2100) {
                          return undefined;
                        }
                      } else {
                        return undefined;
                      }
                    }
                  }
                  
                  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                } catch (e) {
                  console.warn("Date conversion failed:", dateValue, e);
                }
                
                return undefined;
              };

              if (data.shtrikhkodi && data.gamomcemeli && data.mimgebi && data.telefoni && data.tsona && data.kalaki && data.sakGadakhda) {
                const defaultStatus = activeSection === "stopped" ? "STOPPED" : activeSection === "region" ? "REGION" : "IN_WAREHOUSE";
                const item = itemSchema.parse({
                  ...data,
                  tarighi: convertDateToDDMMYYYY(data.tarighi),
                  status: defaultStatus,
                });
                items.push(item);
              }
            } catch (err) {
              console.warn(`Block ${index + 1} failed validation:`, err);
            }
          });

          if (items.length === 0) {
            reject(new Error("ფაილში ვერ მოიძებნა სწორი მონაცემები. გთხოვთ შეამოწმოთ ფორმატი."));
          } else {
            resolve(items);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("ფაილის წაკითხვა ვერ მოხერხდა"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setIsUploading(true);

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      let items: ItemFormData[] = [];

      if (fileExtension === "xlsx" || fileExtension === "xls") {
        items = await parseExcelFile(file);
      } else if (fileExtension === "docx" || fileExtension === "doc") {
        items = await parseWordFile(file);
      } else {
        setFileError("მხარდაჭერილია მხოლოდ Excel (.xlsx, .xls) და Word (.docx, .doc) ფაილები");
        setIsUploading(false);
        return;
      }

      if (items.length > 0 && onBulkAdd) {
        onBulkAdd(items);
        if (onClose) {
          onClose();
        }
      }
    } catch (error: any) {
      setFileError(error.message || "ფაილის დამუშავება ვერ მოხერხდა");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === "manual"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          ხელით შეყვანა
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === "file"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          ფაილის ატვირთვა
        </button>
      </div>

      {mode === "manual" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          შტრიხ კოდი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.shtrikhkodi}
          onChange={(e) => handleChange("shtrikhkodi", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.shtrikhkodi ? "border-red-500" : "border-gray-300"
          }`}
        
        />
        {errors.shtrikhkodi && (
          <p className="mt-1 text-[16px] text-red-500">{errors.shtrikhkodi}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          გამომგზავნი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.gamomcemeli}
          onChange={(e) => handleChange("gamomcemeli", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.gamomcemeli ? "border-red-500" : "border-gray-300"
          }`}
        
        />
        {errors.gamomcemeli && (
          <p className="mt-1 text-[16px] text-red-500">{errors.gamomcemeli}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          მიმღები <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.mimgebi}
          onChange={(e) => handleChange("mimgebi", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.mimgebi ? "border-red-500" : "border-gray-300"
          }`}
       
        />
        {errors.mimgebi && (
          <p className="mt-1 text-[16px] text-red-500">{errors.mimgebi}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          ტელეფონი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.telefoni}
          onChange={(e) => handleChange("telefoni", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.telefoni ? "border-red-500" : "border-gray-300"
          }`}
      
        />
        {errors.telefoni && (
          <p className="mt-1 text-[16px] text-red-500">{errors.telefoni}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          წონა (kg) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.tsona}
          onChange={(e) => handleChange("tsona", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.tsona ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="მაგ: 2.5"
        />
        {errors.tsona && (
          <p className="mt-1 text-[16px] text-red-500">{errors.tsona}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          ქალაქი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.kalaki}
          onChange={(e) => handleChange("kalaki", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.kalaki ? "border-red-500" : "border-gray-300"
          }`}
      
        />
        {errors.kalaki && (
          <p className="mt-1 text-[16px] text-red-500">{errors.kalaki}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          საქ.გადახდა <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.sakGadakhda}
          onChange={(e) => handleChange("sakGadakhda", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.sakGadakhda ? "border-red-500" : "border-gray-300"
          }`}
     
        />
        {errors.sakGadakhda && (
          <p className="mt-1 text-[16px] text-red-500">{errors.sakGadakhda}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          თარიღი
        </label>
        <input
          type="text"
          value={formData.tarighi}
          onChange={(e) => handleChange("tarighi", e.target.value)}
          placeholder="DD/MM/YYYY"
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-gray-400 ${
            errors.tarighi ? "border-red-500" : "border-gray-300"
          }`}
     
        />
        {errors.tarighi && (
          <p className="mt-1 text-[16px] text-red-500">{errors.tarighi}</p>
        )}
      </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              დამატება
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-2">
              ატვირთეთ Excel ან Word ფაილი
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.docx,.doc"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-[16px] text-gray-600">
                  {isUploading ? "იტვირთება..." : "დააწექით ატვირთვისთვის ან გადაიტანეთ ფაილი აქ"}
                </span>
                <span className="text-sm text-gray-500">
                  მხარდაჭერილი: .xlsx, .xls, .docx, .doc
                </span>
              </label>
            </div>
            {fileError && (
              <p className="mt-2 text-[16px] text-red-500">{fileError}</p>
            )}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-2">Excel ფაილის ფორმატი:</p>
              <p className="text-xs text-gray-600">
                სვეტები: შტრიხ კოდი, გამომგზავნი, მიმღები, ტელეფონი, წონა, ქალაქი, საქ.გადახდა, თარიღი
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              გაუქმება
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
