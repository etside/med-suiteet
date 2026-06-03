import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "medsuite_browser_notify";

export function NotificationPreferences() {
  const { t } = useLanguage();
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window);
    setBrowserEnabled(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleBrowser = async (on: boolean) => {
    if (!supported) return;
    if (on) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error(t("notifications_browser_denied"));
        return;
      }
      localStorage.setItem(STORAGE_KEY, "1");
      setBrowserEnabled(true);
      toast.success(t("notifications_browser_enabled"));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setBrowserEnabled(false);
      toast.message(t("notifications_browser_disabled"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          {browserEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
          {t("notifications_prefs_title")}
        </CardTitle>
        <CardDescription className="text-xs">{t("notifications_prefs_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="browser-notify" className="text-sm flex-1">
            {t("notifications_browser_toggle")}
          </Label>
          <Switch
            id="browser-notify"
            checked={browserEnabled}
            onCheckedChange={toggleBrowser}
            disabled={!supported}
          />
        </div>
        {!supported && (
          <p className="text-xs text-muted-foreground">{t("notifications_browser_unsupported")}</p>
        )}
        <p className="text-xs text-muted-foreground">{t("notifications_in_app_note")}</p>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link to="/notifications">{t("notifications_view_all")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
