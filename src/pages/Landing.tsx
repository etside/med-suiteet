import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Zap, BarChart3, ShieldCheck, Users, Clock, Smartphone, Moon, Sun, Pill, TrendingUp, Lock, Languages } from "lucide-react";
import { LanguageToggleLanding } from "@/components/LanguageToggleLanding";
import { useLanguage } from "@/contexts/LanguageContext";

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
      icon: Pill,
      title: "Complete Inventory",
      description: "Track medications, expiry dates, stock levels, and batch numbers with real-time updates",
    },
    {
      icon: Zap,
      title: "Smart POS System",
      description: "Fast checkout with barcode scanning, multiple payment methods, and instant receipts",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Sales trends, revenue reports, top products, customer insights, and profitability analysis",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Compliant",
      description: "Enterprise-grade encryption, biometric auth, audit trails, and HIPAA-ready compliance",
    },
    {
      icon: Users,
      title: "Multi-user Management",
      description: "Role-based access control, staff permissions, performance tracking, and attendance logs",
    },
    {
      icon: Smartphone,
      title: "Mobile PWA",
      description: "Works offline on phones/tablets, syncs automatically, installable like native app",
    },
    {
      icon: Languages,
      title: "Bilingual Support",
      description: "Full support for English and Bangla with local currency and date formats",
    },
    {
      icon: TrendingUp,
      title: "Business Intelligence",
      description: "Predictive inventory, demand forecasting, profit margin analysis, and growth metrics",
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
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
              <span className="font-bold text-lg">Medsuite-eT</span>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button className="text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                সকল ফিচার
              </button>
              <button className="text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                মূল্য নির্ধারণ
              </button>
              <button className="text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                কেন Medsuite-eT
              </button>
              <button className="text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                যোগাযোগ
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDark(!isDark)}
                className="gap-1 px-2"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <LanguageToggleLanding />
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="hidden sm:inline-flex"
              >
                লগইন
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-1 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">শুরু করুন</span>
                <span className="sm:hidden">শুরু</span>
                <ArrowRight className="h-4 w-4" />
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
                  Simplified for Bangladesh
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Medsuite-eT is a complete pharmacy management platform trusted by 500+ pharmacies. Manage inventory, POS, analytics, and staff—all in one place. PWA-based, works offline, bilingual support.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  View Live Demo →
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-12 mt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">500+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active Pharmacies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">50K+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Daily Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">৳10M+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sales Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">99.9%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Uptime SLA</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-8 mt-4">
                <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                  ✓ English & Bangla
                </Badge>
                <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                  ✓ Works Offline
                </Badge>
                <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                  ✓ Mobile PWA
                </Badge>
                <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                  ✓ Enterprise Security
                </Badge>
              </div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-sm text-slate-600 dark:text-slate-400 pt-8"
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
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

        {/* Why Medsuite-eT Section */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Why Medsuite-eT?</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Built specifically for Bangladesh pharmacies with features you actually need
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Languages className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Bilingual Support</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Complete English and Bangla interface. Switch anytime. All reports in both languages.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Offline First PWA</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Works without internet. Installs like native app. Auto-syncs when online.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Bank-Grade Security</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      AES-256 encryption, biometric auth, audit trails, role-based access control.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Smart Analytics</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Real-time sales trends, inventory forecasting, profit analysis, customer insights.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Multi-User Management</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Role-based access, staff performance tracking, attendance, and notifications.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Complete Inventory</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Track batches, expiry dates, suppliers, stock levels, and auto-reorder alerts.
                    </p>
                  </div>
                </div>
              </motion.div>
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

        {/* Theme & Customization Section */}
        <section className="py-24 bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900/50 dark:to-emerald-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Beautiful Themes Built-in</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Personalize your pharmacy dashboard with multiple color themes or create your brand colors
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <motion.div variants={itemVariants} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4">8+ Pre-built Color Themes</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Choose from carefully designed color combinations that work perfectly in light and dark modes. Each theme includes complementary primary, secondary, and accent colors optimized for pharmacy workflows.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">Teal + Cyan + Amber</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">Blue + Indigo + Cyan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">Violet + Pink + Orange</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">Rose + Coral + Amber</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold mb-3">Custom Branding</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Set default theme for all staff, but allow each person to choose their preference. Perfect for consistency or personal comfort.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-emerald-500/30 hover:border-emerald-500 cursor-pointer transition-all">
                  <div className="h-12 mb-2 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-lg" />
                  <div className="text-xs font-medium">Emerald</div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-blue-500/30 hover:border-blue-500 cursor-pointer transition-all">
                  <div className="h-12 mb-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg" />
                  <div className="text-xs font-medium">Azure</div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-violet-500/30 hover:border-violet-500 cursor-pointer transition-all">
                  <div className="h-12 mb-2 bg-gradient-to-r from-violet-500 to-pink-600 rounded-lg" />
                  <div className="text-xs font-medium">Violet</div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-rose-500/30 hover:border-rose-500 cursor-pointer transition-all">
                  <div className="h-12 mb-2 bg-gradient-to-r from-rose-500 to-orange-600 rounded-lg" />
                  <div className="text-xs font-medium">Rose</div>
                </div>
              </motion.div>
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
