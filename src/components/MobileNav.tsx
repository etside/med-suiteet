import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, ShoppingCart, ClipboardCheck, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function MobileNav() {
  const location = useLocation();
  const { isStaff } = useAuth();
  const [shopEnabled, setShopEnabled] = useState(false);

  useEffect(() => {
    api.settings.get().then((data) => {
      setShopEnabled(!!data?.shop_enabled);
    }).catch(() => setShopEnabled(false));
  }, []);

  const staffItems = [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/sales", icon: ShoppingCart, label: "POS" },
    { href: "/admin/orders", icon: ClipboardCheck, label: "Orders" },
    ...(shopEnabled ? [{ href: "/shop", icon: Store, label: "Shop" }] : []),
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const customerItems = [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    ...(shopEnabled ? [{ href: "/shop", icon: Store, label: "Shop" }] : []),
    { href: "/track-order", icon: ClipboardCheck, label: "Orders" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const items = isStaff ? staffItems : customerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[3rem] relative transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
