import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileNav } from "@/components/MobileNav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import Footer from "@/components/Footer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <img src="/logo.svg" alt="MedSuite" className="h-6 w-6 rounded object-contain sm:hidden" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground hidden sm:block">
                Med<span className="text-primary">Suite</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
          <Footer />
        </div>
      </div>
      <MobileNav />
    </SidebarProvider>
  );
}