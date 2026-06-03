import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

/** Wraps nested routes so each navigation gets a smooth page transition. */
export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>{outlet}</PageTransition>
    </AnimatePresence>
  );
}
