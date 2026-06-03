import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type AppRole, type AppUser } from "@/lib/api";

export type SignInMethod = "password" | "pin" | "biometric";

interface SignInOptions {
  method?: SignInMethod;
  credential?: unknown;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  roles: AppRole[];
  isStaff: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  approvalStatus: string;
  signIn: (email: string, secret: string, options?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [approvalStatus, setApprovalStatus] = useState("approved");

  const refresh = async () => {
    try {
      const { data } = await api.auth.me();
      setUser(data.user);
      setRoles(data.roles as AppRole[]);
      setApprovalStatus(data.approval_status || "approved");
    } catch {
      setUser(null);
      setRoles([]);
      setApprovalStatus("approved");
      await api.auth.logout();
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const signIn = async (
    email: string,
    secret: string,
    options?: SignInOptions
  ) => {
    const method = options?.method ?? "password";

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (method === "pin") {
        await api.auth.loginWithPIN(normalizedEmail, secret);
      } else if (method === "biometric") {
        if (!options?.credential) {
          throw new Error("Biometric credential required");
        }
        const data = await api.auth.loginWithBiometric(normalizedEmail, options.credential);
        setUser(data.user);
        setRoles(data.roles as AppRole[]);
        setApprovalStatus(data.approval_status || "approved");
        return;
      } else {
        const data = await api.auth.login(normalizedEmail, secret);
        setUser(data.user);
        setRoles(data.roles as AppRole[]);
        setApprovalStatus(data.approval_status || "approved");
        return;
      }
    } catch (err) {
      throw err instanceof ApiError ? err : new Error("Login failed");
    }

    await refresh();
  };

  const signOut = async () => {
    await api.auth.logout();
    setUser(null);
    setRoles([]);
    setApprovalStatus("approved");
  };

  const isStaff = Array.isArray(roles) && (roles.includes("staff") || roles.includes("admin") || roles.includes("super_admin"));
  const isAdmin = Array.isArray(roles) && (roles.includes("admin") || roles.includes("super_admin"));
  const isSuperAdmin = Array.isArray(roles) && roles.includes("super_admin");

  return (
    <AuthContext.Provider value={{ user, loading, roles, isStaff, isAdmin, isSuperAdmin, approvalStatus, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
