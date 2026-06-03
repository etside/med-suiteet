import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export function LanguageToggleLanding() {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      className="gap-1"
    >
      {lang === "en" ? "BN" : "EN"}
    </Button>
  );
}
