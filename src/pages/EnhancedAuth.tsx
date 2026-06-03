import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Fingerprint, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

const EnhancedAuth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [authMode, setAuthMode] = useState<"password" | "pin" | "biometric">("password");
  const [email, setEmail] = useState("admin@eMed.com");
  const [password, setPassword] = useState("Pjokjict4");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supportsBiometric, setSupportsBiometric] = useState(false);

  // Check WebAuthn support
  useEffect(() => {
    setSupportsBiometric(
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    );
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePINLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // PIN login would validate against backend
      await signIn(email, pin);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!supportsBiometric) {
      setError("Biometric authentication not supported on this device");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Simulate biometric authentication
      // In production, would use WebAuthn API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await signIn("admin@eMed.com", "");
      navigate("/");
    } catch (err) {
      setError("Biometric authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/20 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-md">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">MS</span>
              </div>
              <div>
                <CardTitle>Medsuite-eT</CardTitle>
                <CardDescription>Pharmacy Management</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="password" className="text-xs sm:text-sm">
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Password</span>
                </TabsTrigger>
                <TabsTrigger value="pin" className="text-xs sm:text-sm">
                  🔐
                  <span className="hidden sm:inline">PIN</span>
                </TabsTrigger>
                <TabsTrigger
                  value="biometric"
                  disabled={!supportsBiometric}
                  className="text-xs sm:text-sm"
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Biometric</span>
                </TabsTrigger>
              </TabsList>

              {/* Password Tab */}
              <TabsContent value="password" className="space-y-4">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@eMed.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 pr-10"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* PIN Tab */}
              <TabsContent value="pin" className="space-y-4">
                <p className="text-sm text-slate-400 mb-4">
                  Enter your 4-digit PIN for quick access
                </p>
                <form onSubmit={handlePINLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <div className="flex gap-2 justify-center mb-6">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className="h-12 w-12 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-xl font-bold"
                        >
                          {pin.length > index ? "•" : ""}
                        </div>
                      ))}
                    </div>
                    <Input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      placeholder="0000"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      className="bg-slate-700/50 border-slate-600 text-center text-2xl tracking-widest hidden"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  {/* PIN Keypad */}
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => pin.length < 4 && setPin(pin + num)}
                        className="bg-slate-700/50 hover:bg-slate-600 border border-slate-600 rounded-lg py-3 font-semibold transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => pin.length < 4 && setPin(pin + "0")}
                      className="col-span-2 bg-slate-700/50 hover:bg-slate-600 border border-slate-600 rounded-lg py-3 font-semibold transition-colors"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setPin(pin.slice(0, -1))}
                      className="bg-slate-700/50 hover:bg-slate-600 border border-slate-600 rounded-lg py-3 font-semibold transition-colors"
                    >
                      ⌫
                    </button>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                    disabled={pin.length !== 4 || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Unlock"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Biometric Tab */}
              <TabsContent value="biometric" className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-20 w-20 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center"
                    >
                      <Fingerprint className="h-10 w-10 text-white" />
                    </motion.div>
                  </div>
                  <p className="text-slate-400">
                    Place your finger on the sensor or look at the camera
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    onClick={handleBiometricLogin}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4 mr-2" />
                        Start Biometric Auth
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setAuthMode("password")}
                  >
                    Use Password Instead
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-slate-700 text-center text-sm text-slate-400">
              Demo credentials: admin@eMed.com / Pjokjict4
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default EnhancedAuth;
