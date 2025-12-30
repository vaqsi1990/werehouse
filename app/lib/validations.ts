import { z } from "zod";

export const ItemStatusEnum = z.enum(["IN_TRANSIT", "IN_WAREHOUSE", "RELEASED"]);

export const itemSchema = z.object({
  title: z.string().min(1, "ნივთის აღწერა სავალდებულოა"),
  Name: z.string().min(1, "კლიენტის სახელი სავალდებულოა"),
  fullName: z.string().min(1, "სრული სახელი სავალდებულოა"),
  phone: z
    .string()
    .min(1, "ტელეფონი სავალდებულოა")
    .regex(/^995\d{9}$/, "ტელეფონი უნდა იყოს ფორმატში: 9955XXXXXXXX"),
  email: z.string().email("არასწორი ელფოსტის ფორმატი"),
  status: ItemStatusEnum.default("IN_TRANSIT"),
});

export type ItemFormData = z.infer<typeof itemSchema>;

