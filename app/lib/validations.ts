import { z } from "zod";

export const ItemStatusEnum = z.enum(["STOPPED", "IN_WAREHOUSE", "RELEASED", "REGION"]);

export const itemSchema = z.object({
  shtrikhkodi: z.string().min(1, "შტრიხ კოდი სავალდებულოა"),
  gamomcemeli: z.string().min(1, "გამომგზავნი სავალდებულოა"),
  mimgebi: z.string().min(1, "მიმღები სავალდებულოა"),
  telefoni: z.string().min(1, "ტელეფონი სავალდებულოა"),
  tsona: z.string().min(1, "წონა (kg) სავალდებულოა"),
  kalaki: z.string().min(1, "ქალაქი სავალდებულოა"),
  sakGadakhda: z.string().default(""),
  tarighi: z.string().optional(),
  status: ItemStatusEnum.default("IN_WAREHOUSE"),
});

export type ItemFormData = z.infer<typeof itemSchema>;

