import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(3.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm font-medium text-white safe-area-pb md:bottom-0"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      You are offline. Changes will sync when connection returns.
    </div>
  );
}
