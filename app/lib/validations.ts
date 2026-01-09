import { z } from "zod";

export const ItemStatusEnum = z.enum(["STOPPED", "IN_WAREHOUSE", "RELEASED", "REGION"]);

export const itemSchema = z.object({
  productNumber: z.string().min(1, "ამანათის ნომერი სავალდებულოა"),
  Name: z.string().min(1, "სახელი სავალდებულოა"),
  fullName: z.string().min(1, "გვარი სავალდებულოა"),
  phone: z.string().min(1, "ტელეფონი სავალდებულოა"),
  city: z.string().min(1, "ქალაქი სავალდებულოა"),
  address: z.string().min(1, "მისამართი სავალდებულოა"),
  weight: z.string().min(1, "წონა (kg) სავალდებულოა"),
  status: ItemStatusEnum.default("IN_WAREHOUSE"),
});

export type ItemFormData = z.infer<typeof itemSchema>;

