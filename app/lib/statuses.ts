import type { Lang } from "./i18n";

export const ITEM_STATUSES = [
  "STOPPED",
  "IN_WAREHOUSE",
  "RELEASED",
  "REGION",
  "PENDING",
  "IN_TRANSIT",
  "FOR_HANDOVER",
  "TO_RETURN",
  "SENT_BACK",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type CountryCode = "FRANCE" | "RUSSIA";

export const RUSSIA_ONLY_STATUSES = ["PENDING", "IN_TRANSIT", "FOR_HANDOVER", "TO_RETURN", "SENT_BACK"] as const;

export function isRussiaOnlyStatus(status: string) {
  return (RUSSIA_ONLY_STATUSES as readonly string[]).includes(status);
}

type StatusSection = {
  status: ItemStatus;
  sectionId: string;
  sectionLabel: string;
  optionLabel: string;
  canAdd: boolean;
};

const FRANCE_SECTIONS: StatusSection[] = [
  { status: "IN_WAREHOUSE", sectionId: "in-warehouse", sectionLabel: "საწყობში", optionLabel: "საწყობშია", canAdd: true },
  { status: "STOPPED", sectionId: "stopped", sectionLabel: "გაჩერებული", optionLabel: "გაჩერებული", canAdd: true },
  { status: "REGION", sectionId: "region", sectionLabel: "რეგიონი", optionLabel: "რეგიონი", canAdd: true },
  { status: "RELEASED", sectionId: "shipped", sectionLabel: "გაცემული", optionLabel: "გაცემულია", canAdd: false },
];

const RUSSIA_SECTIONS: StatusSection[] = [
  { status: "PENDING", sectionId: "pending", sectionLabel: "მოლოდინში", optionLabel: "მოლოდინში", canAdd: true },
  { status: "IN_TRANSIT", sectionId: "in-transit", sectionLabel: "გზაში", optionLabel: "გზაში", canAdd: true },
  { status: "STOPPED", sectionId: "stopped", sectionLabel: "საბაჟო-კონტროლის ზონაში", optionLabel: "საბაჟო-კონტროლის ზონაში", canAdd: true },
  { status: "IN_WAREHOUSE", sectionId: "in-warehouse", sectionLabel: "თბილისის საწყობში", optionLabel: "თბილისის საწყობში", canAdd: true },
  { status: "FOR_HANDOVER", sectionId: "for-handover", sectionLabel: "გატანილია საწყობიდან ჩასაბარებლად", optionLabel: "გატანილია საწყობიდან ჩასაბარებლად", canAdd: true },
  { status: "REGION", sectionId: "region", sectionLabel: "გაგზავნილია რეგიონში ჩასაბარებლად", optionLabel: "გაგზავნილია რეგიონში ჩასაბარებლად", canAdd: true },
  { status: "RELEASED", sectionId: "shipped", sectionLabel: "გაცემულია", optionLabel: "გაცემულია", canAdd: false },
  { status: "TO_RETURN", sectionId: "to-return", sectionLabel: "უკან დასაბრუნებელი ამანათები", optionLabel: "უკან დასაბრუნებელი ამანათები", canAdd: true },
  { status: "SENT_BACK", sectionId: "sent-back", sectionLabel: "უკან გაგზავნილი ამანათები", optionLabel: "უკან გაგზავნილი ამანათები", canAdd: true },
];

const FRANCE_OPTION_ORDER: ItemStatus[] = ["STOPPED", "IN_WAREHOUSE", "RELEASED", "REGION"];

const RUSSIA_LABELS_RU: Record<ItemStatus, string> = {
  PENDING: "Ожидание",
  IN_TRANSIT: "В пути",
  STOPPED: "В зоне таможенного контроля",
  IN_WAREHOUSE: "На складе в Тбилиси",
  FOR_HANDOVER: "Вывезено со склада для выдачи",
  REGION: "Отправлено в регион для выдачи",
  RELEASED: "Выдано",
  TO_RETURN: "Посылки к возврату",
  SENT_BACK: "Посылки отправлены обратно",
};

function withLang(sections: StatusSection[], country?: string | null, lang: Lang = "ka") {
  if (country !== "RUSSIA" || lang !== "ru") return sections;
  return sections.map((section) => {
    const label = RUSSIA_LABELS_RU[section.status];
    return { ...section, sectionLabel: label, optionLabel: label };
  });
}

export function sectionsForCountry(country?: string | null, lang: Lang = "ka") {
  const sections = country === "RUSSIA" ? RUSSIA_SECTIONS : FRANCE_SECTIONS;
  return withLang(sections, country, lang);
}

export function optionsForCountry(country?: string | null, lang: Lang = "ka") {
  const sections = sectionsForCountry(country, lang);
  if (country === "RUSSIA") return sections;
  return FRANCE_OPTION_ORDER.map((status) => sections.find((section) => section.status === status)!);
}

export function statusForSection(sectionId: string | undefined, country?: string | null): ItemStatus {
  const match = sectionsForCountry(country).find((section) => section.sectionId === sectionId);
  if (match) return match.status;
  return country === "RUSSIA" ? "PENDING" : "IN_WAREHOUSE";
}

export function labelForStatus(status: string, country?: string | null, lang: Lang = "ka") {
  const section = sectionsForCountry(country, lang).find((item) => item.status === status);
  if (section) return section.optionLabel;
  const fallback = [...RUSSIA_SECTIONS, ...FRANCE_SECTIONS].find((item) => item.status === status);
  if (country === "RUSSIA" && lang === "ru" && fallback) return RUSSIA_LABELS_RU[fallback.status];
  return fallback?.optionLabel ?? status;
}

export function sectionTitle(sectionId: string, country?: string | null, lang: Lang = "ka") {
  return sectionsForCountry(country, lang).find((section) => section.sectionId === sectionId)?.sectionLabel ?? (lang === "ru" ? "Инвентарь" : "ინვენტარი");
}

export function canAddInSection(sectionId: string, country?: string | null) {
  return sectionsForCountry(country).some((section) => section.sectionId === sectionId && section.canAdd);
}
