import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorThemeName =
  | "emerald" // Teal + Cyan + Amber
  | "azure" // Blue + Indigo + Cyan
  | "violet" // Violet + Pink + Orange
  | "rose" // Rose + Coral + Amber
  | "orange" // Orange + Amber + Red
  | "forest" // Forest + Teal + Sky
  | "indigo" // Indigo + Violet + Cyan
  | "slate" // Slate + Teal + Blue
  | "midnight" // Midnight + Indigo + Cyan
  | "sunset" // Sunset + Orange + Gold
  | "sakura" // Sakura + Magenta + Violet
  | "mint"; // Mint + Lime + Sky

interface ColorTheme {
  name: ColorThemeName;
  label: string;
  primary: { light: string; dark: string };
  secondary: { light: string; dark: string };
  accent: { light: string; dark: string };
  gradient: string;
}

export const COLOR_THEMES: Record<ColorThemeName, ColorTheme> = {
  emerald: {
    name: "emerald",
    label: "Teal + Cyan + Amber",
    primary: { light: "174 84% 32%", dark: "174 72% 40%" },
    secondary: { light: "160 20% 94%", dark: "166 30% 14%" },
    accent: { light: "45 93% 47%", dark: "45 93% 47%" },
    gradient: "from-emerald-500 to-cyan-600",
  },
  azure: {
    name: "azure",
    label: "Blue + Indigo + Cyan",
    primary: { light: "217 91% 60%", dark: "217 91% 70%" },
    secondary: { light: "238 83% 80%", dark: "238 83% 20%" },
    accent: { light: "186 100% 69%", dark: "186 100% 69%" },
    gradient: "from-blue-500 to-indigo-600",
  },
  violet: {
    name: "violet",
    label: "Violet + Pink + Orange",
    primary: { light: "280 85% 50%", dark: "280 85% 60%" },
    secondary: { light: "330 81% 90%", dark: "330 81% 15%" },
    accent: { light: "30 100% 50%", dark: "30 100% 50%" },
    gradient: "from-violet-500 to-pink-600",
  },
  rose: {
    name: "rose",
    label: "Rose + Coral + Amber",
    primary: { light: "345 100% 65%", dark: "345 100% 70%" },
    secondary: { light: "15 100% 90%", dark: "15 100% 15%" },
    accent: { light: "45 93% 47%", dark: "45 93% 47%" },
    gradient: "from-rose-500 to-orange-600",
  },
  orange: {
    name: "orange",
    label: "Orange + Amber + Red",
    primary: { light: "25 95% 53%", dark: "25 95% 60%" },
    secondary: { light: "39 100% 95%", dark: "39 100% 12%" },
    accent: { light: "0 100% 50%", dark: "0 100% 50%" },
    gradient: "from-orange-500 to-amber-600",
  },
  forest: {
    name: "forest",
    label: "Forest + Teal + Sky",
    primary: { light: "140 55% 30%", dark: "140 55% 40%" },
    secondary: { light: "174 100% 90%", dark: "174 100% 15%" },
    accent: { light: "198 100% 50%", dark: "198 100% 50%" },
    gradient: "from-green-700 to-teal-600",
  },
  indigo: {
    name: "indigo",
    label: "Indigo + Violet + Cyan",
    primary: { light: "226 100% 50%", dark: "226 100% 60%" },
    secondary: { light: "280 85% 90%", dark: "280 85% 20%" },
    accent: { light: "186 100% 69%", dark: "186 100% 69%" },
    gradient: "from-indigo-500 to-violet-600",
  },
  slate: {
    name: "slate",
    label: "Slate + Teal + Blue",
    primary: { light: "215 28% 17%", dark: "215 28% 45%" },
    secondary: { light: "174 100% 90%", dark: "174 100% 15%" },
    accent: { light: "217 91% 60%", dark: "217 91% 60%" },
    gradient: "from-slate-600 to-teal-500",
  },
  midnight: {
    name: "midnight",
    label: "Midnight + Indigo + Cyan",
    primary: { light: "222 84% 5%", dark: "222 84% 40%" },
    secondary: { light: "226 100% 90%", dark: "226 100% 15%" },
    accent: { light: "186 100% 69%", dark: "186 100% 69%" },
    gradient: "from-slate-900 to-indigo-600",
  },
  sunset: {
    name: "sunset",
    label: "Sunset + Orange + Gold",
    primary: { light: "355 100% 55%", dark: "355 100% 65%" },
    secondary: { light: "30 100% 95%", dark: "30 100% 15%" },
    accent: { light: "44 100% 50%", dark: "44 100% 50%" },
    gradient: "from-red-500 to-orange-600",
  },
  sakura: {
    name: "sakura",
    label: "Sakura + Magenta + Violet",
    primary: { light: "332 100% 70%", dark: "332 100% 75%" },
    secondary: { light: "300 100% 90%", dark: "300 100% 15%" },
    accent: { light: "280 85% 50%", dark: "280 85% 50%" },
    gradient: "from-pink-400 to-magenta-600",
  },
  mint: {
    name: "mint",
    label: "Mint + Lime + Sky",
    primary: { light: "163 94% 50%", dark: "163 94% 60%" },
    secondary: { light: "84 100% 90%", dark: "84 100% 15%" },
    accent: { light: "198 100% 50%", dark: "198 100% 50%" },
    gradient: "from-mint-500 to-cyan-600",
  },
};

interface ColorThemeContextState {
  colorTheme: ColorThemeName;
  setColorTheme: (theme: ColorThemeName) => void;
  currentTheme: ColorTheme;
}

const ColorThemeContext = createContext<ColorThemeContextState | undefined>(undefined);

export function ColorThemeProvider({
  children,
  defaultTheme = "emerald",
  storageKey = "medsuite-color-theme",
}: {
  children: ReactNode;
  defaultTheme?: ColorThemeName;
  storageKey?: string;
}) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeName>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as ColorThemeName) || defaultTheme;
  });

  const currentTheme = COLOR_THEMES[colorTheme];

  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");

    // Update CSS variables based on current theme
    const theme = COLOR_THEMES[colorTheme];
    const primaryValue = isDark ? theme.primary.dark : theme.primary.light;
    const secondaryValue = isDark ? theme.secondary.dark : theme.secondary.light;
    const accentValue = isDark ? theme.accent.dark : theme.accent.light;

    root.style.setProperty("--primary", primaryValue);
    root.style.setProperty("--secondary", secondaryValue);
    root.style.setProperty("--accent", accentValue);
  }, [colorTheme]);

  // Update CSS variables when dark mode changes
  useEffect(() => {
    const handleDarkModeChange = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains("dark");
      const theme = COLOR_THEMES[colorTheme];
      const primaryValue = isDark ? theme.primary.dark : theme.primary.light;
      const secondaryValue = isDark ? theme.secondary.dark : theme.secondary.light;
      const accentValue = isDark ? theme.accent.dark : theme.accent.light;

      root.style.setProperty("--primary", primaryValue);
      root.style.setProperty("--secondary", secondaryValue);
      root.style.setProperty("--accent", accentValue);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          handleDarkModeChange();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [colorTheme]);

  const setColorTheme = (t: ColorThemeName) => {
    localStorage.setItem(storageKey, t);
    setColorThemeState(t);
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, currentTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
}
