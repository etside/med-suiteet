import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function WebAuthnSetup() {
  const { isAdmin, isSuperAdmin } = useAuth();

  if (!isAdmin && !isSuperAdmin) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" /> Biometric Authentication
        </CardTitle>
        <CardDescription>
          Fingerprint / Face ID login for Admin & Super Admin accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          Not available with MySQL backend
        </div>
      </CardContent>
    </Card>
  );
}
