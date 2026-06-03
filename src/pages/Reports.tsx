import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";
import { api } from "@/lib/api";

const COLORS = ["hsl(174, 84%, 32%)", "hsl(199, 89%, 48%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)"];

const Reports = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const sales = await api.sales.list();
        const byDay: Record<string, number> = {};
        sales.forEach((s: any) => {
          const day = new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          byDay[day] = (byDay[day] || 0) + Number(s.total);
        });
        setSalesData(Object.entries(byDay).slice(0, 14).reverse().map(([date, revenue]) => ({ date, revenue })));
        setTotalRevenue(sales.reduce((sum: number, i: any) => sum + Number(i.total), 0));

        const byProduct: Record<string, number> = {};
        sales.forEach((s: any) => {
          let items = s.items;
          if (typeof items === "string") {
            try { items = JSON.parse(items); } catch { items = []; }
          }
          (items || []).forEach((i: any) => {
            const name = i.name || i.product_name;
            if (name) byProduct[name] = (byProduct[name] || 0) + Number(i.qty || i.quantity || 1);
          });
        });
        const orders = await api.orders.list();
        for (const order of orders.slice(0, 50)) {
          try {
            const items = await api.orders.items(String(order.id));
            items.forEach((i: any) => {
              byProduct[i.product_name] = (byProduct[i.product_name] || 0) + Number(i.quantity);
            });
          } catch { /* ignore */ }
        }
        setTopProducts(
          Object.entries(byProduct)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, units]) => ({ name, units }))
        );
        setTotalOrders(orders.length);

        const prods = await api.products.list();
        const byCat: Record<string, number> = {};
        (prods as any[]).forEach((p) => {
          byCat[p.category || "Other"] = (byCat[p.category || "Other"] || 0) + Number(p.stock);
        });
        setCategoryData(Object.entries(byCat).map(([name, value]) => ({ name, value })));
      } catch { /* ignore */ }
    };
    fetchReports();
  }, []);

  const exportCSV = () => {
    const rows = [["Date", "Revenue"], ...salesData.map((d) => [d.date, d.revenue])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sales-report.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Real-time sales analytics from your data</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total POS Revenue</p>
            <p className="text-2xl font-bold text-primary">৳{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Online Orders</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Products Tracked</p>
            <p className="text-2xl font-bold">{categoryData.reduce((s, c) => s + c.value, 0)} units</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Sales Trend</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Daily Sales Trend</CardTitle></CardHeader>
            <CardContent>
              {salesData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No sales data yet. Complete POS sales to see trends.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(174, 84%, 32%)" fill="hsl(174, 84%, 32%)" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No order data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="units" fill="hsl(174, 84%, 32%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Stock by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Reports;
