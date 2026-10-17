"use client";

import { createContext, useContext, useEffect } from "react";
import { translate, type Lang, type MessageKey } from "../lib/i18n";

const LanguageContext = createContext<Lang>("ka");

export function LanguageProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang === "ru" ? "ru" : "ka";
    document.title = translate(lang, "appTitle");
  }, [lang]);

  return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

export function useT() {
  const lang = useLang();
  return (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function LanguageSwitch({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm font-medium">
      <button
        type="button"
        onClick={() => onChange("ka")}
        className={lang === "ka" ? "bg-blue-600 px-2.5 py-1.5 text-white" : "bg-white px-2.5 py-1.5 text-gray-700 hover:bg-gray-50"}
      >
        ქართული
      </button>
      <button
        type="button"
        onClick={() => onChange("ru")}
        className={lang === "ru" ? "bg-blue-600 px-2.5 py-1.5 text-white" : "bg-white px-2.5 py-1.5 text-gray-700 hover:bg-gray-50"}
      >
        Русский
      </button>
    </div>
  );
}
