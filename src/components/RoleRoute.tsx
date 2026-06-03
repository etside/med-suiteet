import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLoading } from "@/components/AuthLoading";

type RoleRouteProps = {
  children: React.ReactNode;
  require: "staff" | "admin";
};

export function RoleRoute({ children, require }: RoleRouteProps) {
  const { loading, isStaff, isAdmin } = useAuth();

  if (loading) return <AuthLoading />;

  const allowed = require === "admin" ? isAdmin : isStaff;
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
