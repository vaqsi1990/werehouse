import { z } from "zod";

export const ItemStatusEnum = z.enum(["STOPPED", "IN_WAREHOUSE", "RELEASED"]);

export const itemSchema = z.object({
  productNumber: z.string().min(1, "ამანათის ნომერი სავალდებულოა"),
  Name: z.string().min(1, "კლიენტის სახელი სავალდებულოა"),
  fullName: z.string().min(1, "კლიენტის გვარი სავალდებულოა"),
  phone: z.string().min(1, "ტელეფონი სავალდებულოა"),
  city: z.string().min(1, "ქალაქი სავალდებულოა"),
  address: z.string().min(1, "მისამართი სავალდებულოა"),
  status: ItemStatusEnum.default("IN_WAREHOUSE"),
});

export type ItemFormData = z.infer<typeof itemSchema>;

