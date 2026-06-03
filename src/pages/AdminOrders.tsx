import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Package, Truck, ClipboardCheck } from "lucide-react";

const AdminOrders = () => {
  const { t } = useLanguage();
  const { isStaff } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.orders.list(filter !== "all" ? { status: filter } : undefined);
      setOrders(data as any[]);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.orders.update({ id: orderId, status });
      toast.success("Order status updated");
      fetchOrders();
    } catch (e: any) {
      toast.error("Failed to update: " + (e.message || ""));
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      await api.orders.update({ id: orderId, payment_status: "verified" });
      toast.success("Payment verified!");
      fetchOrders();
    } catch (e: any) {
      toast.error("Failed: " + (e.message || ""));
    }
  };

  if (!isStaff) {
    return <div className="py-20 text-center text-muted-foreground">Access denied. Staff only.</div>;
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "confirmed": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "processing": return <Package className="h-3.5 w-3.5" />;
      case "delivered": return <Truck className="h-3.5 w-3.5" />;
      case "cancelled": return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case "pending": return "outline" as const;
      case "confirmed": return "default" as const;
      case "processing": return "secondary" as const;
      case "delivered": return "default" as const;
      case "cancelled": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {t("admin_orders")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("admin_orders_desc")}</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Orders ({orders.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View, verify payments, and update order statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">{t("loading")}</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No orders found</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Total (৳)</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>TrxID</TableHead>
                      <TableHead>Pay Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                        <TableCell className="text-sm">{order.customer_name}</TableCell>
                        <TableCell className="text-xs">{order.customer_phone}</TableCell>
                        <TableCell className="text-right font-medium">৳{Number(order.total).toFixed(2)}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{order.payment_method}</Badge></TableCell>
                        <TableCell className="font-mono text-xs max-w-[80px] truncate">{order.transaction_id || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === "verified" ? "default" : order.payment_status === "failed" ? "destructive" : "outline"} className="text-xs">
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(order.status)} className="gap-1 text-xs">
                            {statusIcon(order.status)} {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {order.payment_status !== "verified" && order.payment_method !== "cod" && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => verifyPayment(order.id)}>✓ Verify</Button>
                            )}
                            {order.status === "pending" && (
                              <Button size="sm" className="text-xs h-7" onClick={() => updateOrderStatus(order.id, "confirmed")}>Confirm</Button>
                            )}
                            {order.status === "confirmed" && (
                              <Button size="sm" className="text-xs h-7" onClick={() => updateOrderStatus(order.id, "processing")}>Process</Button>
                            )}
                            {order.status === "processing" && (
                              <Button size="sm" className="text-xs h-7" onClick={() => updateOrderStatus(order.id, "delivered")}>Deliver</Button>
                            )}
                            {order.status !== "cancelled" && order.status !== "delivered" && (
                              <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => updateOrderStatus(order.id, "cancelled")}>Cancel</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs font-bold text-foreground">{order.order_number}</p>
                        <p className="text-sm text-foreground">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      </div>
                      <p className="font-bold text-primary text-base">৳{Number(order.total).toFixed(0)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">{order.payment_method}</Badge>
                      <Badge variant={order.payment_status === "verified" ? "default" : "outline"} className="text-[10px]">{order.payment_status}</Badge>
                      <Badge variant={statusVariant(order.status)} className="gap-1 text-[10px]">{statusIcon(order.status)} {order.status}</Badge>
                    </div>
                    {order.transaction_id && <p className="text-[10px] font-mono text-muted-foreground">TrxID: {order.transaction_id}</p>}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {order.payment_status !== "verified" && order.payment_method !== "cod" && (
                        <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => verifyPayment(order.id)}>✓ Verify Pay</Button>
                      )}
                      {order.status === "pending" && <Button size="sm" className="text-[10px] h-7" onClick={() => updateOrderStatus(order.id, "confirmed")}>Confirm</Button>}
                      {order.status === "confirmed" && <Button size="sm" className="text-[10px] h-7" onClick={() => updateOrderStatus(order.id, "processing")}>Process</Button>}
                      {order.status === "processing" && <Button size="sm" className="text-[10px] h-7" onClick={() => updateOrderStatus(order.id, "delivered")}>Deliver</Button>}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <Button size="sm" variant="destructive" className="text-[10px] h-7" onClick={() => updateOrderStatus(order.id, "cancelled")}>Cancel</Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
