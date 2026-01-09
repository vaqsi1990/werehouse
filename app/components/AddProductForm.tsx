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
    productNumber: "",
    Name: "",
    fullName: "",
    phone: "",
    city: "",
    address: "",
    weight: "",
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
        productNumber: "",
        Name: "",
        fullName: "",
        phone: "",
        city: "",
        address: "",
        weight: "",
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
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

          const items: ItemFormData[] = [];
          
          if (jsonData.length === 0) {
            reject(new Error("Excel ფაილი ცარიელია"));
            return;
          }

          // Expected columns: productNumber, Name, fullName, phone, city, address
          // Try to auto-detect column mapping
          const headers = Object.keys(jsonData[0] || {});
          
          jsonData.forEach((row, index) => {
            try {
              // Skip empty rows
              const rowValues = Object.values(row).filter(v => v !== null && v !== undefined && String(v).trim() !== "");
              if (rowValues.length === 0) return;

              // Try different possible column names (case-insensitive)
              const getValue = (keys: string[]) => {
                for (const key of keys) {
                  const value = row[key];
                  if (value !== null && value !== undefined && String(value).trim() !== "") {
                    return String(value).trim();
                  }
                }
                return "";
              };

              const productNumber = getValue(["ამანათის ნომერი", "productNumber", "Product Number", "A", "A1"]);
              const name = getValue(["სახელი", "კლიენტის სახელი", "Name", "First Name", "B", "B1"]);
              const fullName = getValue(["გვარი", "კლიენტის გვარი", "fullName", "Last Name", "C", "C1"]);
              const phone = getValue(["ტელეფონი", "phone", "Phone", "D", "D1"]);
              const city = getValue(["ქალაქი", "city", "City", "E", "E1"]);
              const address = getValue(["მისამართი", "address", "Address", "F", "F1"]);
              const weight = getValue(["წონა", "weight", "Weight", "G", "G1"]);

              if (productNumber && name && fullName && phone && city && address && weight) {
                const defaultStatus = activeSection === "stopped" ? "STOPPED" : activeSection === "region" ? "REGION" : "IN_WAREHOUSE";
                const item = itemSchema.parse({
                  productNumber,
                  Name: name,
                  fullName,
                  phone,
                  city,
                  address,
                  weight,
                  status: defaultStatus,
                });
                items.push(item);
              }
            } catch (err) {
              console.warn(`Row ${index + 2} failed validation:`, err);
            }
          });

          if (items.length === 0) {
            reject(new Error("ფაილში ვერ მოიძებნა სწორი მონაცემები. გთხოვთ შეამოწმოთ სვეტების სახელები."));
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
                if (line.includes("ამანათის ნომერი") || line.includes("Product Number")) {
                  data.productNumber = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("სახელი") || line.includes("კლიენტის სახელი") || line.includes("Name") || line.includes("First Name")) {
                  data.Name = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("გვარი") || line.includes("კლიენტის გვარი") || line.includes("fullName") || line.includes("Last Name")) {
                  data.fullName = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("ტელეფონი") || line.includes("phone") || line.includes("Phone")) {
                  data.phone = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("ქალაქი") || line.includes("city") || line.includes("City")) {
                  data.city = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("მისამართი") || line.includes("address") || line.includes("Address")) {
                  data.address = line.split(/[:：]/)[1]?.trim() || "";
                } else if (line.includes("წონა") || line.includes("weight") || line.includes("Weight")) {
                  data.weight = line.split(/[:：]/)[1]?.trim() || "";
                }
              });

              if (data.productNumber && data.Name && data.fullName && data.phone && data.city && data.address && data.weight) {
                const defaultStatus = activeSection === "stopped" ? "STOPPED" : activeSection === "region" ? "REGION" : "IN_WAREHOUSE";
                const item = itemSchema.parse({
                  ...data,
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
          ამანათის ნომერი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.productNumber}
          onChange={(e) => handleChange("productNumber", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.productNumber ? "border-red-500" : "border-gray-300"
          }`}
        
        />
        {errors.productNumber && (
          <p className="mt-1 text-[16px] text-red-500">{errors.productNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          სახელი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.Name}
          onChange={(e) => handleChange("Name", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.Name ? "border-red-500" : "border-gray-300"
          }`}
        
        />
        {errors.Name && (
          <p className="mt-1 text-[16px] text-red-500">{errors.Name}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          გვარი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.fullName ? "border-red-500" : "border-gray-300"
          }`}
       
        />
        {errors.fullName && (
          <p className="mt-1 text-[16px] text-red-500">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          ტელეფონი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.phone ? "border-red-500" : "border-gray-300"
          }`}
      
        />
        {errors.phone && (
          <p className="mt-1 text-[16px] text-red-500">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          ქალაქი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => handleChange("city", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.city ? "border-red-500" : "border-gray-300"
          }`}
      
        />
        {errors.city && (
          <p className="mt-1 text-[16px] text-red-500">{errors.city}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          მისამართი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.address ? "border-red-500" : "border-gray-300"
          }`}
     
        />
        {errors.address && (
          <p className="mt-1 text-[16px] text-red-500">{errors.address}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          წონა (kg) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.weight}
          onChange={(e) => handleChange("weight", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.weight ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="მაგ: 2.5"
        />
        {errors.weight && (
          <p className="mt-1 text-[16px] text-red-500">{errors.weight}</p>
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
                სვეტები: ამანათის ნომერი, სახელი, გვარი, ტელეფონი, ქალაქი, მისამართი, წონა (kg)
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
