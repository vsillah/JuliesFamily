import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VanguardThemeMode } from "@/hooks/useVanguardTheme";

const options = [
  { mode: "light", label: "Light", icon: Sun, testId: "vanguard-theme-light" },
  { mode: "dark", label: "Dark", icon: Moon, testId: "vanguard-theme-dark" },
  { mode: "system", label: "System", icon: Monitor, testId: "vanguard-theme-system" },
] as const;

export default function VanguardThemeControl({
  mode,
  onChange,
  navSolid = false,
}: {
  mode: VanguardThemeMode;
  onChange: (mode: VanguardThemeMode) => void;
  navSolid?: boolean;
}) {
  const activeOption = options.find((option) => option.mode === mode) ?? options[2];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Color theme: ${activeOption.label}`}
          title={`Color theme: ${activeOption.label}`}
          className={`h-9 w-9 rounded-full ${navSolid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/15 hover:text-white"}`}
          data-testid="vanguard-theme-control"
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="kinflo-palette-surface w-44">
        <DropdownMenuLabel>Color theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => onChange(value as VanguardThemeMode)}>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuRadioItem key={option.mode} value={option.mode} data-testid={option.testId}>
                <Icon className="h-4 w-4" />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
