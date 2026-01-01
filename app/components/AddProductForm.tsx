"use client";

import { useState } from "react";
import { itemSchema, type ItemFormData } from "../lib/validations";
import { z } from "zod";

interface AddProductFormProps {
  onAdd: (product: ItemFormData) => void;
  onClose?: () => void;
}

export default function AddProductForm({ onAdd, onClose }: AddProductFormProps) {
  const [formData, setFormData] = useState({
    productNumber: "",
    Name: "",
    fullName: "",
    phone: "",
    city: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const validatedData = itemSchema.parse({
        ...formData,
        status: "RECEIVED", // შემოსული ნივთები default-ად RECEIVED
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          პროდუქტის ნომერი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.productNumber}
          onChange={(e) => handleChange("productNumber", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.productNumber ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="მაგ: PRD-001"
        />
        {errors.productNumber && (
          <p className="mt-1 text-[16px] text-red-500">{errors.productNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          კლიენტის სახელი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.Name}
          onChange={(e) => handleChange("Name", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.Name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="მაგ: გიორგი"
        />
        {errors.Name && (
          <p className="mt-1 text-[16px] text-red-500">{errors.Name}</p>
        )}
      </div>

      <div>
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          კლიენტის გვარი <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg text-black placeholder:text-black ${
            errors.fullName ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="მაგ: გიორგი ბერიძე"
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
          placeholder="ტელეფონის ნომერი"
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
          placeholder="მაგ: თბილისი"
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
          placeholder="მაგ: რუსთაველის გამზირი 1"
        />
        {errors.address && (
          <p className="mt-1 text-[16px] text-red-500">{errors.address}</p>
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
  );
}
