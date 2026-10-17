export type ExcelField =
  | "shtrikhkodi"
  | "gamomcemeli"
  | "mimgebi"
  | "telefoni"
  | "tsona"
  | "kalaki"
  | "sakGadakhda"
  | "tarighi";

const ALIASES: Record<ExcelField, string[]> = {
  shtrikhkodi: [
    "შტრიხ კოდი",
    "შტრიხკოდი",
    "კოდი",
    "штрихкод",
    "штрих-код",
    "штрих код",
    "код посылки",
    "номер посылки",
    "трек-номер",
    "трек номер",
    "трек",
    "barcode",
    "product code",
    "productcode",
    "shtrikhkodi",
    "mtrikhkodi",
  ],
  gamomcemeli: ["გამომგზავნი", "отправитель", "отправитель груза", "sender", "gamomcemeli"],
  mimgebi: ["მიმღები", "სახელი", "получатель", "имя получателя", "фио", "имя", "receiver", "name", "mimgebi"],
  telefoni: [
    "ტელეფონი",
    "ტელ",
    "телефон",
    "номер телефона",
    "мобильный",
    "тел",
    "phone",
    "telefoni",
  ],
  tsona: ["წონა (kg)", "წონა", "вес (кг)", "вес (kg)", "вес кг", "вес", "weight", "tsona"],
  kalaki: ["ქალაქი", "город", "city", "kalaki"],
  sakGadakhda: [
    "საქ.გადახდა",
    "საქ გადახდა",
    "საქგადახდა",
    "გადახდა",
    "оплата в грузии",
    "к оплате",
    "оплата",
    "сумма",
    "стоимость",
    "payment",
    "sakgadakhda",
  ],
  tarighi: ["თარიღი", "дата", "date", "tarighi"],
};

const BY_LETTER: Record<string, ExcelField> = {
  a: "shtrikhkodi",
  a1: "shtrikhkodi",
  b: "gamomcemeli",
  b1: "gamomcemeli",
  c: "mimgebi",
  c1: "mimgebi",
  d: "telefoni",
  d1: "telefoni",
  e: "tsona",
  e1: "tsona",
  f: "kalaki",
  f1: "kalaki",
  g: "sakGadakhda",
  g1: "sakGadakhda",
  h: "tarighi",
  h1: "tarighi",
};

export function normalizeExcelHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\s.\-_()（）/\\:：]+/g, "");
}

export function matchExcelHeader(header: string): ExcelField | null {
  const normalized = normalizeExcelHeader(header);
  if (!normalized) return null;
  const letter = BY_LETTER[normalized];
  if (letter) return letter;

  let best: { field: ExcelField; score: number } | null = null;
  for (const field of Object.keys(ALIASES) as ExcelField[]) {
    for (const alias of ALIASES[field]) {
      const normalizedAlias = normalizeExcelHeader(alias);
      if (!normalizedAlias) continue;
      let score = 0;
      if (normalized === normalizedAlias) score = 1000 + normalizedAlias.length;
      else if (normalizedAlias.length >= 3 && normalized.includes(normalizedAlias)) score = normalizedAlias.length;
      else if (normalized.length >= 4 && normalizedAlias.includes(normalized)) score = normalized.length;
      if (score > (best?.score ?? 0)) best = { field, score };
    }
  }
  return best?.field ?? null;
}

const RUSSIAN_MONTHS: Array<[string, number]> = [
  ["январ", 1],
  ["феврал", 2],
  ["март", 3],
  ["апрел", 4],
  ["мая", 5],
  ["май", 5],
  ["июн", 6],
  ["июл", 7],
  ["август", 8],
  ["сентябр", 9],
  ["октябр", 10],
  ["ноябр", 11],
  ["декабр", 12],
];

/** "17 октября 2026" or "17 окт 2026 г." */
export function parseRussianWrittenDate(value: string) {
  const match = value.toLowerCase().replace(/ё/g, "е").match(/(\d{1,2})\s+([а-я]+)\s+(\d{4})/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const year = Number(match[3]);
  const month = RUSSIAN_MONTHS.find(([stem]) => match[2].startsWith(stem))?.[1];
  if (!month || day < 1 || day > 31 || year < 1900 || year >= 2100) return undefined;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function mapExcelRow(row: Record<string, unknown>) {
  const mapped: Partial<Record<ExcelField, unknown>> = {};
  for (const [header, value] of Object.entries(row)) {
    if (value === null || value === undefined || String(value).trim() === "") continue;
    const field = matchExcelHeader(header);
    if (!field || mapped[field] !== undefined) continue;
    mapped[field] = value;
  }
  return mapped;
}
