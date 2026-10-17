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
    "shtrix kodi",
    "shtrixkodi",
    "shtrikh kodi",
    "shtrihkodi",
    "shtrih kod",
    "shtrikhkod",
    "shtrixkod",
    "shtrihkod",
    "kodi",
    "code",
    "trek",
    "nomer posylki",
    "nomer posilki",
    "kod posylki",
  ],
  gamomcemeli: [
    "გამომგზავნი",
    "отправитель",
    "отправитель груза",
    "sender",
    "gamomcemeli",
    "gamomgzavni",
    "gamomzavni",
    "otpravitel",
    "otpravitel gruza",
  ],
  mimgebi: [
    "მიმღები",
    "სახელი",
    "получатель",
    "имя получателя",
    "фио",
    "имя",
    "receiver",
    "name",
    "mimgebi",
    "mimghebi",
    "saxeli",
    "sakheli",
    "poluchatel",
    "fio",
    "imya",
    "imia",
    "imja",
  ],
  telefoni: [
    "ტელეფონი",
    "ტელ",
    "телефон",
    "номер телефона",
    "мобильный",
    "тел",
    "phone",
    "telefoni",
    "telefon",
    "tel",
    "nomer telefona",
    "mobilny",
    "mobilnyy",
    "mobilnyi",
  ],
  tsona: ["წონა (kg)", "წონა", "вес (кг)", "вес (kg)", "вес кг", "вес", "weight", "tsona", "wona", "cona", "ves", "ves kg"],
  kalaki: ["ქალაქი", "город", "city", "kalaki", "qalaqi", "gorod"],
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
    "gadaxda",
    "gadakhda",
    "gadakda",
    "sakgadaxda",
    "sak gadaxda",
    "sak.gadaxda",
    "oplata",
    "k oplate",
    "summa",
    "stoimost",
  ],
  tarighi: ["თარიღი", "дата", "date", "tarighi", "tarigi", "data"],
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
    .replace(/['’`ʼ]/g, "")
    .replace(/[\s.\-_()（）/\\:：]+/g, "");
}

const CYRILLIC_DIGRAPHS: Array<[string, string]> = [
  ["shch", "щ"],
  ["sch", "щ"],
  ["yo", "ё"],
  ["zh", "ж"],
  ["kh", "х"],
  ["ts", "ц"],
  ["ch", "ч"],
  ["sh", "ш"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
];

const CYRILLIC_LETTERS: Record<string, string> = {
  a: "а",
  b: "б",
  c: "к",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "й",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "к",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "х",
  y: "ы",
  z: "з",
};

const GEO_LOWER: Record<string, string> = {
  a: "ა",
  b: "ბ",
  c: "ც",
  d: "დ",
  e: "ე",
  f: "ფ",
  g: "გ",
  h: "ჰ",
  i: "ი",
  j: "ჯ",
  k: "კ",
  l: "ლ",
  m: "მ",
  n: "ნ",
  o: "ო",
  p: "პ",
  q: "ქ",
  r: "რ",
  s: "ს",
  t: "თ",
  u: "უ",
  v: "ვ",
  w: "წ",
  x: "ხ",
  y: "ყ",
  z: "ზ",
};

const GEO_UPPER: Record<string, string> = {
  C: "ჩ",
  G: "ღ",
  J: "ჟ",
  R: "ღ",
  S: "შ",
  T: "ტ",
  W: "ჭ",
  Z: "ძ",
};

/** Russian words typed with Latin letters: shtrihkod, otpravitel. */
export function transliterateToCyrillic(value: string) {
  const input = value.toLowerCase().replace(/['’`ʼ]/g, "");
  let index = 0;
  let out = "";
  while (index < input.length) {
    const digraph = CYRILLIC_DIGRAPHS.find(([latin]) => input.startsWith(latin, index));
    if (digraph) {
      out += digraph[1];
      index += digraph[0].length;
      continue;
    }
    const char = input[index];
    out += CYRILLIC_LETTERS[char] ?? char;
    index += 1;
  }
  return out;
}

/** Georgian letters typed while the Latin keyboard was active: STrixkodi, tariRi. */
export function latinKeyboardToGeorgian(value: string) {
  let out = "";
  for (const char of value) {
    if (GEO_UPPER[char]) out += GEO_UPPER[char];
    else if (GEO_LOWER[char]) out += GEO_LOWER[char];
    else if (GEO_LOWER[char.toLowerCase()]) out += GEO_LOWER[char.toLowerCase()];
    else out += char;
  }
  return out;
}

function scoreNormalizedHeader(normalized: string, allowLetters: boolean) {
  if (!normalized) return null;
  if (allowLetters && BY_LETTER[normalized]) {
    return { field: BY_LETTER[normalized], score: 5000 };
  }

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
  return best;
}

export function matchExcelHeader(header: string): ExcelField | null {
  const forms = [
    { text: normalizeExcelHeader(header), allowLetters: true },
    { text: normalizeExcelHeader(transliterateToCyrillic(header)), allowLetters: false },
    { text: normalizeExcelHeader(latinKeyboardToGeorgian(header)), allowLetters: false },
  ];

  let best: { field: ExcelField; score: number } | null = null;
  for (const form of forms) {
    const found = scoreNormalizedHeader(form.text, form.allowLetters);
    if (found && found.score > (best?.score ?? 0)) best = found;
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
