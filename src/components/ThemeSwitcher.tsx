import { useColorTheme, COLOR_THEMES } from "./ColorThemeProvider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.values(COLOR_THEMES).map((theme) => (
          <DropdownMenuCheckboxItem
            key={theme.name}
            checked={colorTheme === theme.name}
            onCheckedChange={() => setColorTheme(theme.name)}
            className="flex items-center gap-2"
          >
            <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${theme.gradient}`} />
            <span className="text-xs">{theme.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
