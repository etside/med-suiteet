import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, Clock, Users, BarChart3, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Onboarding from "@/components/Onboarding";

const COLORS = ["hsl(174, 84%, 32%)", "hsl(199, 89%, 48%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)"];

const Dashboard = () => {
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [topProducts, setTopProducts] = useState<{ name: string; value: number }[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [weeklySales, setWeeklySales] = useState<{ day: string; sales: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.dashboard();
        setProductCount(stats.product_count);
        setLowStockCount(stats.low_stock);
        setPendingOrders(stats.pending_orders);
        setExpiringCount(stats.expiring_soon);
        setTodaySales(stats.today_sales);
        setMonthlyRevenue(stats.monthly_revenue);
        setTopProducts((stats.top_stock || []).map((p) => ({ name: p.name, value: p.stock })));

        const today = new Date();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const byDay: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          byDay[days[d.getDay()]] = 0;
        }
        (stats.week_sales || []).forEach((s) => {
          const day = days[new Date(s.created_at).getDay()];
          byDay[day] = (byDay[day] || 0) + Number(s.total);
        });
        setWeeklySales(Object.entries(byDay).map(([day, sales]) => ({ day, sales })));
      } catch {
        /* ignore */
      }
    };
    if (isStaff) fetchStats();
  }, [isStaff]);

  // Check if user is new and should see onboarding
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (!onboardingCompleted && isStaff) {
      setShowOnboarding(true);
    }
  }, [isStaff]);

  if (!isStaff) {
    return (
      <div className="space-y-6 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Welcome to Medsuite-eT</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse our online shop or track your orders.</p>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/shop")}>
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Online Shop</p>
                <p className="text-xs text-muted-foreground">Browse & order medicines</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/track-order")}>
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Track Orders</p>
                <p className="text-xs text-muted-foreground">View your order status</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const kpiData = [
    { title: "Today's Sales", value: "৳" + todaySales.toLocaleString(), icon: DollarSign, color: "text-emerald-600", path: "/admin/sales" },
    { title: "Total Products", value: String(productCount), icon: Package, color: "text-blue-600", path: "/admin/inventory" },
    { title: "Pending Orders", value: String(pendingOrders), icon: ShoppingCart, color: "text-amber-600", path: "/admin/orders" },
    { title: "Low Stock Alerts", value: String(lowStockCount), icon: AlertTriangle, color: "text-destructive", path: "/admin/inventory" },
    { title: "Monthly Revenue", value: "৳" + monthlyRevenue.toLocaleString(), icon: TrendingUp, color: "text-primary", path: "/admin/reports" },
    { title: "Expiring Soon", value: String(expiringCount), icon: Clock, color: "text-amber-500", path: "/admin/inventory" },
  ];

  const quickActions = [
    { title: "Customer Ledger", icon: Users, path: "/admin/customers" },
    { title: "Inventory", icon: Package, path: "/admin/inventory" },
    { title: "Orders", icon: ShoppingCart, path: "/admin/orders" },
    { title: "Sales", icon: BarChart3, path: "/admin/sales" },
    { title: "Reports", icon: FileText, path: "/admin/reports" },
    { title: "Users", icon: Settings, path: "/admin/users" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Welcome to Medsuite-eT Pharmacy Management</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant="outline"
            className="h-auto flex flex-col items-center gap-2 p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-[10px] sm:text-xs text-center leading-tight">{action.title}</span>
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {kpiData.map((kpi) => (
          <Card 
            key={kpi.title}
            className="cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => navigate(kpi.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground leading-tight">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${kpi.color}`} />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-base sm:text-2xl font-bold truncate">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Weekly Sales</CardTitle>
            <CardDescription className="text-xs">POS revenue trend this week (৳)</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {weeklySales.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No sales data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(174, 84%, 32%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Top Products by Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No products yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={topProducts} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                    {topProducts.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default Dashboard;
