import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, ClipboardList,
  BarChart3, Settings, Shield, Users, QrCode, Sun, Moon, Store, Truck, LogOut, ClipboardCheck, BookUser, MessageCircle, User, FileText,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { api } from "@/lib/api";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const WHATSAPP_HELP = "https://wa.me/8801873722228?text=Hi%2C%20I%20need%20help%20with%20Medsuite-eT";

export function AppSidebar() {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const { isStaff, isAdmin, signOut, user } = useAuth();
  const [shopEnabled, setShopEnabled] = useState(false);

  useEffect(() => {
    api.settings.get().then((data) => {
      setShopEnabled(!!data?.shop_enabled);
    }).catch(() => setShopEnabled(false));
  }, []);

  const mainNav = isStaff ? [
    { title: t("nav_dashboard"), icon: LayoutDashboard, href: "/" },
    { title: t("nav_products"), icon: Package, href: "/products" },
    { title: t("nav_inventory"), icon: Warehouse, href: "/inventory" },
    { title: t("nav_sales"), icon: ShoppingCart, href: "/sales" },
    { title: t("nav_purchases"), icon: ClipboardList, href: "/purchases" },
    { title: t("nav_qr_scanner"), icon: QrCode, href: "/qr-scanner" },
    { title: t("nav_reports"), icon: BarChart3, href: "/reports" },
  ] : [];

  const customerNav = [
    ...(shopEnabled ? [{ title: t("nav_shop"), icon: Store, href: "/shop" }] : []),
    { title: t("order_title"), icon: Truck, href: "/track-order" },
  ];

  const adminNav = isStaff ? [
    { title: t("admin_orders"), icon: ClipboardCheck, href: "/admin/orders" },
    ...(isAdmin ? [
      { title: t("nav_user_mgmt"), icon: Users, href: "/admin/users" },
      { title: "Customer Ledger", icon: BookUser, href: "/admin/customers" },
      { title: "Content Manager", icon: FileText, href: "/admin/cms" },
      { title: t("nav_admin"), icon: Shield, href: "/admin" },
      { title: t("nav_settings"), icon: Settings, href: "/settings" },
    ] : []),
  ] : [];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Medsuite-eT" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground">{t("app_name")}</h1>
            <p className="text-[10px] text-muted-foreground">{t("app_tagline")}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {mainNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav_main_menu")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                      <Link to={item.href}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {customerNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav_customer")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customerNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                      <Link to={item.href}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("nav_administration")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                      <Link to={item.href}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
        {user && (
          <Link to="/profile" className="block px-2 py-1 text-xs text-muted-foreground truncate hover:text-foreground transition-colors">
            {user.email}
          </Link>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
          <Link to="/profile"><User className="h-4 w-4" /><span>My Profile</span></Link>
        </Button>
        <LanguageToggle />
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{resolvedTheme === "dark" ? t("light_mode") : t("dark_mode")}</span>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
          <a href={WHATSAPP_HELP} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </a>
        </Button>
        {user && (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive"
            onClick={signOut}>
            <LogOut className="h-4 w-4" />
            <span>{t("auth_logout")}</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
