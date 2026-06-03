import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
    >
      <span className="text-base">{lang === "en" ? "🇧🇩" : "🇬🇧"}</span>
      <span>{lang === "en" ? "বাংলা" : "English"}</span>
    </Button>
  );
}
