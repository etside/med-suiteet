/**
 * Medsuite-eT — MySQL API client (PHP backend)
 */

const API_BASE = import.meta.env.VITE_API_URL || "/.netlify/functions/api";
const TOKEN_KEY = "medsuite_et_token";

export type AppRole = "admin" | "staff" | "customer" | "super_admin";

export interface AppUser {
  id: string;
  email: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  action: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
    auth?: boolean;
    formData?: FormData;
  } = {}
): Promise<T> {
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set("action", action);
  if (options.query) {
    Object.entries(options.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), {
    method: options.method || "GET",
    headers,
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json.error || res.statusText || "Request failed", res.status);
  }
  return json as T;
}

export const api = {
  health: () => request<{ status: string }>("health"),

  auth: {
    login: async (email: string, password: string) => {
      const res = await request<{
        data: {
          token: string;
          user: AppUser;
          roles: AppRole[];
          approval_status: string;
        };
      }>("login", { method: "POST", body: { email, password } });
      setToken(res.data.token);
      return res.data;
    },
    signup: (full_name: string, email: string, password: string) =>
      request<{ data: { message: string } }>("signup", {
        method: "POST",
        body: { full_name, email, password },
      }),
    me: () =>
      request<{
        data: {
          user: AppUser;
          roles: AppRole[];
          profile: Record<string, unknown>;
          approval_status: string;
        };
      }>("user"),
    updatePassword: (password: string) =>
      request("auth_password", { method: "POST", body: { password } }),
    logout: () => {
      setToken(null);
      return Promise.resolve();
    },
  },

  products: {
    list: (query?: { category?: string; search?: string }) =>
      request<{ data: Record<string, unknown>[] }>("products", { query: query as Record<string, string> }).then(
        (r) => r.data
      ),
    get: (id: string) => request<{ data: Record<string, unknown> }>("product", { query: { id } }).then((r) => r.data),
    create: (payload: Record<string, unknown>) =>
      request("products", { method: "POST", body: payload }),
    update: (id: string, payload: Record<string, unknown>) =>
      request("product", { method: "PUT", query: { id }, body: payload }),
    delete: (id: string) => request("product", { method: "DELETE", query: { id } }),
  },

  orders: {
    list: (query?: { status?: string; user_id?: string }) =>
      request<{ data: Record<string, unknown>[] }>("orders", { query: query as Record<string, string> }).then(
        (r) => r.data
      ),
    create: (payload: Record<string, unknown>) =>
      request<{ data: Record<string, unknown> }>("orders", { method: "POST", body: payload }).then((r) => r.data),
    update: (payload: { id: string; status?: string; payment_status?: string }) =>
      request("orders", { method: "PUT", body: payload }),
    items: (orderId: string) =>
      request<{ data: Record<string, unknown>[] }>("order_items", { query: { order_id: orderId } }).then((r) => r.data),
    track: (orderNumber: string) =>
      request<{ data: Record<string, unknown> }>("track", { query: { order_number: orderNumber } }).then((r) => r.data),
  },

  sales: {
    list: (since?: string) =>
      request<{ data: { total: number; created_at: string }[] }>("sales", {
        query: since ? { since } : undefined,
      }).then((r) => r.data),
    create: (payload: Record<string, unknown>) => request("sales", { method: "POST", body: payload }),
  },

  settings: {
    get: () => request<{ data: Record<string, unknown> | null }>("settings").then((r) => r.data),
    update: (payload: Record<string, unknown>) => request("settings", { method: "PUT", body: payload }),
    create: (payload: Record<string, unknown>) =>
      request<{ data: { id: string } }>("settings", { method: "POST", body: payload }).then((r) => r.data),
  },

  profiles: {
    list: () => request<{ data: Record<string, unknown>[] }>("profiles").then((r) => r.data),
    self: () => request<{ data: Record<string, unknown> }>("profiles", { query: { self: "1" } }).then((r) => r.data),
    update: (payload: Record<string, unknown>) => request("profiles", { method: "PUT", body: payload }),
  },

  userRoles: {
    list: () => request<{ data: { user_id: string; role: string }[] }>("user_roles").then((r) => r.data),
    set: (user_id: string, role: string) => request("user_roles", { method: "PUT", body: { user_id, role } }),
    removeUser: (user_id: string) => request("user_roles", { method: "DELETE", query: { user_id } }),
  },

  suppliers: {
    list: () => request<{ data: Record<string, unknown>[] }>("suppliers").then((r) => r.data),
    create: (payload: Record<string, unknown>) => request("suppliers", { method: "POST", body: payload }),
  },

  purchaseOrders: {
    list: () => request<{ data: Record<string, unknown>[] }>("purchase_orders").then((r) => r.data),
    create: (payload: Record<string, unknown>) => request("purchase_orders", { method: "POST", body: payload }),
    updateStatus: (id: string, status: string) =>
      request("purchase_orders", { method: "PUT", body: { id, status } }),
  },

  notifications: {
    list: () =>
      request<{ data: Record<string, unknown>[] }>("notifications").then((r) => r.data as NotificationRow[]),
    markAllRead: () => request("notifications", { method: "PUT" }),
  },

  dashboard: () => request<{ data: DashboardStats }>("dashboard").then((r) => r.data),

  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ data: { url: string } }>("upload", { method: "POST", formData: fd }).then((r) => r.data.url);
  },
};

export interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  product_count: number;
  low_stock: number;
  pending_orders: number;
  expiring_soon: number;
  user_count: number;
  supplier_count: number;
  pending_approvals: number;
  today_sales: number;
  monthly_revenue: number;
  top_stock: { name: string; stock: number }[];
  week_sales: { total: number; created_at: string }[];
}

export { ApiError };
