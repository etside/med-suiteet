import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type AppRole, type AppUser } from "@/lib/api";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  roles: AppRole[];
  isStaff: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  approvalStatus: string;
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

  const signOut = async () => {
    await api.auth.logout();
    setUser(null);
    setRoles([]);
    setApprovalStatus("approved");
  };

  const isStaff = roles.includes("staff") || roles.includes("admin") || roles.includes("super_admin");
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");

  return (
    <AuthContext.Provider value={{ user, loading, roles, isStaff, isAdmin, isSuperAdmin, approvalStatus, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
