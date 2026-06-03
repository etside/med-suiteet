import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowRight } from "lucide-react";
import { api, type ManufacturerRow } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { containerVariants, itemVariants } from "@/components/PageTransition";

const CARD_COLORS = [
  "from-blue-500 to-blue-600",
  "from-teal-500 to-teal-600",
  "from-violet-500 to-violet-600",
  "from-orange-500 to-orange-600",
  "from-emerald-500 to-emerald-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
];

function initials(name: string) {
  const parts = name.replace(/_/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function displayName(key: string, t: (k: string) => string) {
  const catKey = `cat_${key}`;
  const translated = t(catKey);
  if (translated !== catKey) return translated;
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const Manufacturers = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ManufacturerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.manufacturers()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          {t("nav_manufacturers")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t("manufacturers_subtitle")}</p>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">{t("no_results")}</p>
      ) : (
        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row, i) => (
            <motion.article
              key={row.name}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="card-interactive overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className={`bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} flex h-24 items-center justify-center`}>
                <span className="text-3xl font-bold text-white/95">{initials(row.name)}</span>
              </div>
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-foreground leading-tight">{displayName(row.name, t)}</h2>
                <p className="text-xs text-muted-foreground">
                  {row.medicines} {t("manufacturers_medicines")}
                </p>
                <p className="text-xs text-rose-500/90">
                  {row.prescriptions} {t("manufacturers_prescriptions")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.divisions} {t("manufacturers_divisions")}
                </p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(row.name)}`)}
                >
                  {t("manufacturers_browse")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Manufacturers;
