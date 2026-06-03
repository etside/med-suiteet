import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type NotificationRow } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { containerVariants, itemVariants } from "@/components/PageTransition";

const Notifications = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "warning": return "border-l-amber-500";
      case "error": return "border-l-destructive";
      case "success": return "border-l-emerald-500";
      default: return "border-l-primary";
    }
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            {t("nav_notifications")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("notifications_subtitle")}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            {t("notifications_mark_all")}
          </Button>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {unread > 0 ? `${unread} ${t("notifications_unread")}` : t("notifications_all_caught")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">{t("notifications_empty")}</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border border-border bg-card/80 border-l-4 p-4 transition-all duration-200 ${typeColor(n.type)} ${!n.read ? "bg-primary/5" : "opacity-80"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.read && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                        {t("notifications_new")}
                      </span>
                    )}
                  </div>
                  {n.message && <p className="text-sm text-muted-foreground mt-1">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Notifications;
