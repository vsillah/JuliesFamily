import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VanguardThemeMode } from "@/hooks/useVanguardTheme";

const options = [
  { mode: "light", label: "Light", icon: Sun, testId: "vanguard-theme-light" },
  { mode: "dark", label: "Dark", icon: Moon, testId: "vanguard-theme-dark" },
  { mode: "system", label: "System", icon: Monitor, testId: "vanguard-theme-system" },
] as const;

export default function VanguardThemeControl({
  mode,
  onChange,
}: {
  mode: VanguardThemeMode;
  onChange: (mode: VanguardThemeMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex w-fit items-center rounded-lg border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90"
      data-testid="vanguard-theme-control"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = mode === option.mode;
        return (
          <Button
            key={option.mode}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={active}
            aria-label={`Use ${option.label.toLowerCase()} theme`}
            title={`${option.label} theme`}
            className={`h-8 gap-1.5 px-2.5 text-xs ${active ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`}
            onClick={() => onChange(option.mode)}
            data-testid={option.testId}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
