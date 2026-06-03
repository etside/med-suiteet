import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { en } from "@/i18n/en";
import { bn } from "@/i18n/bn";

type Lang = "en" | "bn";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Translations = typeof en;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof Translations) => string;
}

const translations: Record<Lang, Translations> = { en, bn: bn as unknown as Translations };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("medsuite-lang") as Lang) || "en"
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("medsuite-lang", l);
  }, []);

  const t = useCallback(
    (key: keyof Translations) => translations[lang][key] || translations.en[key] || key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
