"use client";

import { useState, useEffect } from "react";
import { itemSchema, type ItemFormData } from "../lib/validations";
import { z } from "zod";

interface Item {
  id: string;
  shtrikhkodi: string;
  gamomcemeli: string;
  mimgebi: string;
  telefoni: string;
  kalaki: string;
  sakGadakhda: string;
  tarighi?: string | Date | null;
  tsona: string;
  status: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";
}

interface EditItemFormProps {
  item: Item;
  onUpdate: (id: string, data: ItemFormData) => void;
  onClose?: () => void;
}

export default function EditItemForm({ item, onUpdate, onClose }: EditItemFormProps) {
  const [formData, setFormData] = useState({
    shtrikhkodi: item.shtrikhkodi,
    gamomcemeli: item.gamomcemeli,
    mimgebi: item.mimgebi,
    telefoni: item.telefoni,
    kalaki: item.kalaki,
    sakGadakhda: item.sakGadakhda || "",
    tarighi: item.tarighi ? (typeof item.tarighi === 'string' ? item.tarighi : new Date(item.tarighi).toISOString().split('T')[0]) : "",
    tsona: item.tsona,
    status: item.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      shtrikhkodi: item.shtrikhkodi,
      gamomcemeli: item.gamomcemeli,
      mimgebi: item.mimgebi,
      telefoni: item.telefoni,
      kalaki: item.kalaki,
      sakGadakhda: item.sakGadakhda || "",
      tarighi: item.tarighi ? (typeof item.tarighi === 'string' ? item.tarighi : new Date(item.tarighi).toISOString().split('T')[0]) : "",
      tsona: item.tsona,
      status: item.status,
    });
  }, [item]);

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
    
    try {
      const validatedData = itemSchema.parse(formData);
      onUpdate(item.id, validatedData);
      
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

  return (
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
          გამომცემელი <span className="text-red-500">*</span>
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
          type="date"
          value={formData.tarighi}
          onChange={(e) => handleChange("tarighi", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.tarighi ? "border-red-500" : "border-gray-300"
          }`}
    
        />
        {errors.tarighi && (
          <p className="mt-1 text-[16px] text-red-500">{errors.tarighi}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          სტატუსი <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black ${
            errors.status ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="STOPPED">გაჩერებული</option>
          <option value="IN_WAREHOUSE">საწყობშია</option>
          <option value="RELEASED">გაცემულია</option>
          <option value="REGION">რეგიონი</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-[16px] text-red-500">{errors.status}</p>
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
          განახლება
        </button>
      </div>
    </form>
  );
}

