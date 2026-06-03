import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  highlight?: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Medsuite-eT",
    description: "Your complete pharmacy management solution. Let's get you started!",
    icon: "👋",
  },
  {
    title: "Dashboard Overview",
    description: "Track key metrics like sales, inventory, and pending orders at a glance.",
    icon: "📊",
    highlight: "Dashboard",
  },
  {
    title: "Manage Inventory",
    description: "Add, edit, and track your medicine stock with our simple inventory system.",
    icon: "📦",
    highlight: "Inventory",
  },
  {
    title: "Point of Sale (POS)",
    description: "Process customer purchases quickly with our intuitive POS system.",
    icon: "💳",
    highlight: "Sales",
  },
  {
    title: "Generate Reports",
    description: "Get detailed analytics on your sales, revenue, and more.",
    icon: "📈",
    highlight: "Reports",
  },
  {
    title: "Manage Users",
    description: "Control staff access with role-based permissions.",
    icon: "👥",
    highlight: "Users",
  },
  {
    title: "Mobile Ready",
    description: "Access your pharmacy management system from any device, anywhere.",
    icon: "📱",
  },
  {
    title: "You're All Set!",
    description: "Start managing your pharmacy more efficiently. Happy selling!",
    icon: "🎉",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
    onComplete();
  };

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
    onComplete();
  };

  if (!showOnboarding) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-2xl"
        >
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{step.icon}</span>
                <h2 className="text-2xl font-bold">{step.title}</h2>
              </div>
              <button
                onClick={skipOnboarding}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                {step.description}
              </p>

              {step.highlight && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-6 p-4 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 rounded-lg text-center font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  💡 Navigate to: {step.highlight}
                </motion.div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2 mb-8">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-slate-500">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>

              {/* Step Indicators */}
              <div className="flex gap-2 mb-8 flex-wrap">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (index <= currentStep) {
                        setCurrentStep(index);
                      }
                    }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      index < currentStep
                        ? "bg-emerald-500 text-white"
                        : index === currentStep
                          ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
                className="text-slate-500 hover:text-slate-700"
              >
                Skip Tour
              </Button>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started
                    <Check className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Onboarding;
