import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Zap, BarChart3, ShieldCheck, Users, Clock, Smartphone, Moon, Sun } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const features = [
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get your pharmacy online in minutes with our intuitive interface",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track sales, inventory, and revenue with detailed dashboards",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with biometric authentication",
    },
    {
      icon: Users,
      title: "Multi-user Roles",
      description: "Manage staff with customizable permissions",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock customer support via WhatsApp",
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Works seamlessly on phones, tablets, and desktops",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "৳4,999",
      period: "/month",
      description: "Perfect for small pharmacies",
      features: ["Inventory Management", "POS System", "Basic Reports", "Mobile App"],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "৳9,999",
      period: "/month",
      description: "For growing pharmacies",
      features: [
        "Everything in Starter",
        "Advanced Analytics",
        "Multi-location Support",
        "Staff Management",
        "Priority Support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large chains",
      features: [
        "Everything in Professional",
        "Custom Integrations",
        "Dedicated Account Manager",
        "White-label Option",
        "24/7 Phone Support",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
              <span className="font-bold text-lg">Medsuite-eT</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-200 dark:bg-emerald-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-200 dark:bg-cyan-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <Badge className="mx-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                🚀 Trusted by 500+ pharmacies across Bangladesh
              </Badge>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                Pharmacy Management{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Complete POS, inventory, and analytics solution for modern pharmacies. PWA-based, works offline.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-sm text-slate-600 dark:text-slate-400"
              >
                ↓ Scroll to explore features
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Everything you need to manage your pharmacy efficiently
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="h-full hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Choose the plan that fits your pharmacy size
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {pricingPlans.map((plan, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card
                    className={`h-full flex flex-col ${
                      plan.highlighted
                        ? "ring-2 ring-emerald-500 dark:ring-emerald-400 scale-105 md:scale-110"
                        : ""
                    }`}
                  >
                    <CardHeader>
                      {plan.highlighted && (
                        <Badge className="w-fit bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                          Most Popular
                        </Badge>
                      )}
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full mt-6"
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold">Ready to Transform Your Pharmacy?</h2>
              <p className="text-xl text-emerald-50">
                Join hundreds of pharmacies using Medsuite-eT to streamline operations
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="group"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-12 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 dark:text-slate-400">
            <p>© 2026 Medsuite-eT — All rights reserved. Made with 💙 by engineersTech</p>
          </div>
        </footer>
      </div>

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

export default Landing;
