import { useEffect, useState } from "react";
import { api } from "@/lib/api";

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

function loadShopEnabled(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!inflight) {
    inflight = api.settings
      .get()
      .then((data) => !!data?.shop_enabled)
      .catch(() => false)
      .then((enabled) => {
        cached = enabled;
        inflight = null;
        return enabled;
      });
  }
  return inflight;
}

/** Shared shop toggle from settings — avoids duplicate fetches in sidebar + mobile nav. */
export function useShopEnabled() {
  const [shopEnabled, setShopEnabled] = useState(cached ?? false);

  useEffect(() => {
    let cancelled = false;
    loadShopEnabled().then((enabled) => {
      if (!cancelled) setShopEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return shopEnabled;
}
