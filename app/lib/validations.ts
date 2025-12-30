import { z } from "zod";

export const ItemStatusEnum = z.enum(["RECEIVED", "IN_TRANSIT", "IN_WAREHOUSE", "RELEASED"]);

export const itemSchema = z.object({
  title: z.string().min(1, "ნივთის აღწერა სავალდებულოა"),
  Name: z.string().min(1, "კლიენტის სახელი სავალდებულოა"),
  fullName: z.string().min(1, "კლიენტის გვარი სავალდებულოა"),
  phone: z.string().min(1, "ტელეფონი სავალდებულოა"),
  email: z.string().email("არასწორი ელფოსტის ფორმატი"),
  status: ItemStatusEnum.default("RECEIVED"),
});

export type ItemFormData = z.infer<typeof itemSchema>;

