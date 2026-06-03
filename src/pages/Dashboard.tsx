import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Clock,
  BarChart3, FileText, Settings, Users, QrCode, ClipboardList, Bell, User,
  Shield, BookUser, MessageCircle, Warehouse, Building2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Onboarding from "@/components/Onboarding";
import { containerVariants, itemVariants } from "@/components/PageTransition";

const WHATSAPP_HELP = "https://wa.me/8801873722228?text=Hi%2C%20I%20need%20help%20with%20MedSuite";

const NAV_TILES = [
  { titleKey: "nav_sales", icon: ShoppingCart, path: "/sales", color: "bg-emerald-500/15 text-emerald-500" },
  { titleKey: "nav_products", icon: Package, path: "/products", color: "bg-blue-500/15 text-blue-500" },
  { titleKey: "nav_manufacturers", icon: Building2, path: "/manufacturers", color: "bg-teal-500/15 text-teal-500" },
  { titleKey: "nav_inventory", icon: Warehouse, path: "/inventory", color: "bg-amber-500/15 text-amber-500" },
  { titleKey: "nav_purchases", icon: ClipboardList, path: "/purchases", color: "bg-violet-500/15 text-violet-500" },
  { titleKey: "nav_reports", icon: BarChart3, path: "/reports", color: "bg-pink-500/15 text-pink-500" },
  { titleKey: "nav_qr_scanner", icon: QrCode, path: "/qr-scanner", color: "bg-cyan-500/15 text-cyan-500" },
  { titleKey: "admin_orders", icon: ClipboardList, path: "/admin/orders", color: "bg-orange-500/15 text-orange-500" },
  { titleKey: "nav_notifications", icon: Bell, path: "/notifications", color: "bg-red-500/15 text-red-500" },
  { titleKey: "nav_profile", icon: User, path: "/profile", color: "bg-slate-500/15 text-slate-400" },
  { titleKey: "nav_user_mgmt", icon: Users, path: "/admin/users", color: "bg-blue-500/15 text-blue-400", adminOnly: true },
  { titleKey: "nav_admin", icon: Shield, path: "/admin", color: "bg-red-500/15 text-red-400", adminOnly: true },
  { titleKey: "nav_settings", icon: Settings, path: "/settings", color: "bg-primary/15 text-primary", adminOnly: true },
  { titleKey: "nav_customer_ledger", icon: BookUser, path: "/admin/customers", color: "bg-lime-500/15 text-lime-500", adminOnly: true },
] as const;

const Dashboard = () => {
  const { isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [topSelling, setTopSelling] = useState<{ name: string; qty: number }[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [weeklySales, setWeeklySales] = useState<{ day: string; sales: number }[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isStaff) {
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const stats = await api.dashboard();
        setProductCount(stats.product_count);
        setLowStockCount(stats.low_stock);
        setPendingOrders(stats.pending_orders);
        setExpiringCount(stats.expiring_soon);
        setTodaySales(stats.today_sales);
        setMonthlyRevenue(stats.monthly_revenue);
        setTopSelling(stats.top_selling || []);

        const labels: string[] = [];
        const byDay: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("en-US", { weekday: "short" });
          labels.push(key);
          byDay[key] = 0;
        }
        (stats.week_sales || []).forEach((s) => {
          const key = new Date(s.created_at).toLocaleDateString("en-US", { weekday: "short" });
          if (key in byDay) {
            byDay[key] = (byDay[key] || 0) + Number(s.total);
          }
        });
        setWeeklySales(labels.map((day) => ({ day, sales: byDay[day] ?? 0 })));
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (!onboardingCompleted && isStaff) {
      setShowOnboarding(true);
    }
  }, [isStaff]);

  const kpis = useMemo(
    () => [
      { title: t("dash_total_products"), value: String(productCount), icon: Package, color: "text-blue-500", path: "/inventory" },
      { title: t("dash_low_stock"), value: String(lowStockCount), icon: AlertTriangle, color: "text-amber-500", path: "/inventory" },
      { title: t("dash_today_sales"), value: "৳" + todaySales.toLocaleString(), icon: DollarSign, color: "text-emerald-500", path: "/sales" },
      { title: t("dash_monthly_revenue"), value: "৳" + monthlyRevenue.toLocaleString(), icon: TrendingUp, color: "text-violet-500", path: "/reports" },
      { title: t("dash_pending_orders"), value: String(pendingOrders), icon: ClipboardList, color: "text-amber-500", path: "/admin/orders" },
      { title: t("dash_expiring_soon"), value: String(expiringCount), icon: Clock, color: "text-destructive", path: "/inventory" },
    ],
    [t, productCount, lowStockCount, todaySales, monthlyRevenue, pendingOrders, expiringCount],
  );

  const visibleTiles = useMemo(
    () => NAV_TILES.filter((tile) => !("adminOnly" in tile && tile.adminOnly) || isAdmin),
    [isAdmin],
  );

  if (!isStaff) {
    return (
      <div className="space-y-6 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("dash_welcome_guest")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dash_guest_sub")}</p>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <Card className="card-interactive cursor-pointer" onClick={() => navigate("/shop")}>
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{t("nav_shop")}</p>
                <p className="text-xs text-muted-foreground">{t("shop_subtitle")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-interactive cursor-pointer" onClick={() => navigate("/track-order")}>
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{t("order_title")}</p>
                <p className="text-xs text-muted-foreground">{t("dash_track_sub")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5 sm:space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("dash_title")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("dash_welcome")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 transition-all duration-200 hover:border-primary/50" asChild>
          <a href={WHATSAPP_HELP} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            {t("whatsapp_support")}
          </a>
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visibleTiles.map((tile) => (
          <button
            key={tile.path}
            type="button"
            onClick={() => navigate(tile.path)}
            className="card-interactive flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 sm:p-4 text-center"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tile.color}`}>
              <tile.icon className="h-5 w-5" />
            </span>
            <span className="text-[10px] sm:text-xs font-medium leading-tight text-foreground">{t(tile.titleKey)}</span>
          </button>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-7 w-1/2" />
                </CardContent>
              </Card>
            ))
          : kpis.map((kpi) => (
              <Card
                key={kpi.title}
                className="card-interactive cursor-pointer"
                onClick={() => navigate(kpi.path)}
              >
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{kpi.title}</p>
                    <kpi.icon className={`h-4 w-4 shrink-0 ${kpi.color}`} />
                  </div>
                  <p className="text-lg sm:text-xl font-bold truncate">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">{t("dash_weekly_sales")}</CardTitle>
            <CardDescription className="text-xs">{t("dash_revenue_trend")}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {statsLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-[220px] w-full rounded-lg" />
              </div>
            ) : weeklySales.every((d) => d.sales === 0) ? (
              <p className="text-center text-muted-foreground py-12 text-sm">{t("dash_no_sales")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [`৳${v.toLocaleString()}`, t("dash_sales")]}
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">{t("dash_top_products")}</CardTitle>
            <CardDescription className="text-xs">{t("dash_most_sold")}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {statsLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : topSelling.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">{t("no_results")}</p>
            ) : (
              <ul className="space-y-2">
                {topSelling.map((item, i) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium">{item.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">{item.qty} {t("dash_units")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
    </motion.div>
  );
};

export default Dashboard;
