import { z } from "zod";
import { translate, type Lang } from "./i18n";
import { ITEM_STATUSES } from "./statuses";

export const ItemStatusEnum = z.enum(ITEM_STATUSES);

export function createItemSchema(lang: Lang = "ka") {
  return z.object({
    shtrikhkodi: z.string().min(1, translate(lang, "errBarcode")),
    gamomcemeli: z.string().min(1, translate(lang, "errSender")),
    mimgebi: z.string().min(1, translate(lang, "errReceiver")),
    telefoni: z.string().min(1, translate(lang, "errPhone")),
    tsona: z.string().min(1, translate(lang, "errWeight")),
    kalaki: z.string().min(1, translate(lang, "errCity")),
    sakGadakhda: z.string().default(""),
    tarighi: z.string().optional(),
    status: ItemStatusEnum.default("IN_WAREHOUSE"),
  });
}

export const itemSchema = createItemSchema("ka");

export type ItemFormData = z.infer<typeof itemSchema>;

