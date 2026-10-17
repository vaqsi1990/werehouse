export const ITEM_STATUSES = [
  "STOPPED",
  "IN_WAREHOUSE",
  "RELEASED",
  "REGION",
  "PENDING",
  "IN_TRANSIT",
  "FOR_HANDOVER",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type CountryCode = "FRANCE" | "RUSSIA";

export const RUSSIA_ONLY_STATUSES = ["PENDING", "IN_TRANSIT", "FOR_HANDOVER"] as const;

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
];

const FRANCE_OPTION_ORDER: ItemStatus[] = ["STOPPED", "IN_WAREHOUSE", "RELEASED", "REGION"];

export function sectionsForCountry(country?: string | null) {
  return country === "RUSSIA" ? RUSSIA_SECTIONS : FRANCE_SECTIONS;
}

export function optionsForCountry(country?: string | null) {
  const sections = sectionsForCountry(country);
  if (country === "RUSSIA") return sections;
  return FRANCE_OPTION_ORDER.map((status) => sections.find((section) => section.status === status)!);
}

export function statusForSection(sectionId: string | undefined, country?: string | null): ItemStatus {
  const match = sectionsForCountry(country).find((section) => section.sectionId === sectionId);
  if (match) return match.status;
  return country === "RUSSIA" ? "PENDING" : "IN_WAREHOUSE";
}

export function labelForStatus(status: string, country?: string | null) {
  const section = sectionsForCountry(country).find((item) => item.status === status);
  if (section) return section.optionLabel;
  const fallback = [...RUSSIA_SECTIONS, ...FRANCE_SECTIONS].find((item) => item.status === status);
  return fallback?.optionLabel ?? status;
}

export function sectionTitle(sectionId: string, country?: string | null) {
  return sectionsForCountry(country).find((section) => section.sectionId === sectionId)?.sectionLabel ?? "ინვენტარი";
}

export function canAddInSection(sectionId: string, country?: string | null) {
  return sectionsForCountry(country).some((section) => section.sectionId === sectionId && section.canAdd);
}
