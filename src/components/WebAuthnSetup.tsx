import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import { createPlatformCredential, isWebAuthnSupported } from "@/lib/webauthn";
import { toast } from "sonner";

export function WebAuthnSetup() {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(true);
  const supported = isWebAuthnSupported();

  const loadStatus = useCallback(async () => {
    if (!user?.email || !supported) return;
    try {
      const status = await api.auth.biometricStatus(user.email);
      setEnrolled(status.enrolled);
      setApiReady(true);
    } catch (e) {
      setApiReady(!(e instanceof ApiError && e.status === 503));
      setEnrolled(false);
    }
  }, [user?.email, supported]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (!isAdmin && !isSuperAdmin) return null;

  const handleEnroll = async () => {
    if (!supported) {
      toast.error("Use HTTPS or localhost with a device that supports fingerprint / Face ID");
      return;
    }
    setLoading(true);
    try {
      const options = await api.auth.webauthnRegisterOptions();
      const credential = await createPlatformCredential(options);
      await api.auth.enrollBiometric(credential);
      toast.success("Biometric login enabled for this account");
      setEnrolled(true);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Enrollment failed";
      toast.error(msg);
      console.error("[WebAuthn enroll]", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await api.auth.removeBiometric();
      toast.success("Biometric login removed");
      setEnrolled(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not remove biometric");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" /> Biometric Authentication
        </CardTitle>
        <CardDescription>
          Fingerprint / Face ID login for Admin & Super Admin accounts (MySQL + WebAuthn)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supported && (
          <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
            Biometric login requires a secure context (HTTPS or localhost) and a platform authenticator.
          </p>
        )}

        {supported && !apiReady && (
          <p className="text-sm text-amber-700 dark:text-amber-400 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            Database migration required. Run{" "}
            <code className="text-xs">public/api/migrations/add_biometric.sql</code> on your MySQL database.
          </p>
        )}

        {supported && apiReady && enrolled === true && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Biometric sign-in is active</p>
              <p className="text-xs text-muted-foreground">
                Use the Biometric tab on the login page with {user?.email}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={handleRemove}
                className="text-destructive hover:text-destructive"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remove biometric
              </Button>
            </div>
          </div>
        )}

        {supported && apiReady && enrolled === false && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Register this device&apos;s fingerprint or Face ID for faster admin login.
            </p>
            <Button type="button" onClick={handleEnroll} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering…
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Enable biometric login
                </>
              )}
            </Button>
          </div>
        )}

        {supported && apiReady && enrolled === null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking status…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
