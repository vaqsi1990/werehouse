"use client";

export type Country = "FRANCE" | "RUSSIA";

interface CountrySelectProps {
  onSelect: (country: Country) => void;
}

function FranceFlag() {
  return (
    <div className="flex h-14 w-20 overflow-hidden rounded-md border border-gray-200 shadow-sm" aria-hidden="true">
      <div className="flex-1 bg-[#002395]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#ED2939]" />
    </div>
  );
}

function RussiaFlag() {
  return (
    <div className="flex h-14 w-20 flex-col overflow-hidden rounded-md border border-gray-200 shadow-sm" aria-hidden="true">
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#0039A6]" />
      <div className="flex-1 bg-[#D52B1E]" />
    </div>
  );
}

export default function CountrySelect({ onSelect }: CountrySelectProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-3xl">
       
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("RUSSIA")}
            className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-10 shadow-sm transition-colors hover:border-blue-600 hover:shadow-md"
          >
            <RussiaFlag />
           
            <span className="text-sm text-gray-500">Russia</span>
          </button>
          <button
            type="button"
            onClick={() => onSelect("FRANCE")}
            className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-10 shadow-sm transition-colors hover:border-blue-600 hover:shadow-md"
          >
            <FranceFlag />
           
            <span className="text-sm text-gray-500">France</span>
          </button>
        </div>
      </div>
    </div>
  );
}
