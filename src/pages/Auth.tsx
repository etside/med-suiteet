import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      await api.auth.login(loginEmail, loginPassword);
      await refresh();
      toast.success("Logged in successfully!");
      navigate("/");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword) { toast.error("Please fill all fields"); return; }
    if (signupPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.auth.signup(signupName, signupEmail, signupPassword);
      toast.success("Account created! Awaiting admin approval before login.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">eT</div>
          <CardTitle className="text-2xl">Medsuite-eT</CardTitle>
          <CardDescription>MySQL-backed pharmacy SaaS — Bangladesh</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@pharmacy.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSignup} disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Button 
        variant="outline" 
        size="sm" 
        className="fixed bottom-6 right-6"
        onClick={() => setShowFeatures(true)}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Features
      </Button>

      <Dialog open={showFeatures} onOpenChange={setShowFeatures}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Medsuite-eT Features</DialogTitle>
            <DialogDescription>Complete pharmacy management system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm">💊 Inventory Management</h3>
                <p className="text-sm text-muted-foreground">Track medicines, batch numbers, expiry dates & stock levels</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">🛒 POS System</h3>
                <p className="text-sm text-muted-foreground">Point-of-sale interface for quick transactions</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">📊 Analytics & Reports</h3>
                <p className="text-sm text-muted-foreground">Sales reports, revenue tracking, expiry alerts</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">👥 Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">Admin, Staff, and Customer roles with permissions</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">📱 Mobile Ready</h3>
                <p className="text-sm text-muted-foreground">PWA support for offline access & mobile use</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">🔐 Secure Backend</h3>
                <p className="text-sm text-muted-foreground">MySQL database with JWT authentication</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">📦 QR & Barcode Support</h3>
                <p className="text-sm text-muted-foreground">Generate and scan product barcodes</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">🌐 Multi-Language</h3>
                <p className="text-sm text-muted-foreground">English & Bengali interface</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
