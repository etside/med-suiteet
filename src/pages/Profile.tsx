import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Save, Mail, Phone, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WebAuthnSetup } from "@/components/WebAuthnSetup";
import { NotificationPreferences } from "@/components/NotificationPreferences";

const Profile = () => {
  const { user, roles, isAdmin, isSuperAdmin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.profiles.self().then((data) => {
      if (data) {
        setFullName(String(data.full_name || ""));
        setPhone(String(data.phone || ""));
        setAddress(String(data.address || ""));
      }
      setFetching(false);
    }).catch(() => setFetching(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.profiles.update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
    } catch (e: any) {
      setLoading(false);
      toast.error("Failed to save: " + (e.message || ""));
      return;
    }
    setLoading(false);
    toast.success("Profile updated successfully!");
  };

  if (fetching) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-lg space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> My Profile
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Update your personal information</p>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 sm:px-6">
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
            <p className="text-sm font-medium mt-1 break-all">{user?.email}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {roles.map(r => (
              <Badge key={r} variant={r === "super_admin" || r === "admin" ? "default" : "secondary"} className="text-xs">{r}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="flex items-center gap-1 text-xs sm:text-sm"><User className="h-3 w-3" /> Full Name</Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1 text-xs sm:text-sm"><Phone className="h-3 w-3" /> Phone</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880..." className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="flex items-center gap-1 text-xs sm:text-sm"><MapPin className="h-3 w-3" /> Address</Label>
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" className="h-9" />
          </div>
          <Button className="w-full gap-2" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <NotificationPreferences />

      {/* WebAuthn biometric setup - only for admin/super_admin */}
      {(isAdmin || isSuperAdmin) && <WebAuthnSetup />}
    </div>
  );
};
export default Profile;
