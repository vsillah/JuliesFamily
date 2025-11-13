import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type DateRangePreset = {
  label: string;
  value: number; // days to subtract from today
};

const PRESETS: DateRangePreset[] = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

interface DateRangeFilterProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [tempRange, setTempRange] = useState<DateRange>(value || { from: undefined, to: undefined });
  const [isOpen, setIsOpen] = useState(false);

  // Sync tempRange with controlled value prop
  useEffect(() => {
    setTempRange(value || { from: undefined, to: undefined });
  }, [value]);

  const handlePresetSelect = (days: number) => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, days - 1));
    const newRange = { from, to };
    setTempRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetRange = { from: undefined, to: undefined };
    setTempRange(resetRange);
    onChange(resetRange);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(value || { from: undefined, to: undefined });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!value?.from) return "All time";
    if (!value.to) return format(value.from, "MMM dd, yyyy");
    return `${format(value.from, "MMM dd, yyyy")} - ${format(value.to, "MMM dd, yyyy")}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-testid="button-date-range-filter"
            className={cn(
              "justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets sidebar */}
            <div className="flex flex-col border-r p-2 gap-1 min-w-[120px]">
              <div className="text-sm font-medium px-2 py-1.5 text-muted-foreground">
                Presets
              </div>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                  className="justify-start"
                  data-testid={`button-preset-${preset.value}-days`}
                >
                  {preset.label}
                </Button>
              ))}
              <div className="border-t my-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="justify-start"
                data-testid="button-reset-date-range"
              >
                All time
              </Button>
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                selected={{ from: tempRange.from, to: tempRange.to }}
                onSelect={(range) => {
                  if (range) {
                    setTempRange({
                      from: range.from,
                      to: range.to,
                    });
                  }
                }}
                numberOfMonths={2}
                disabled={(date) => date > new Date()}
              />
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  data-testid="button-cancel-date-range"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!tempRange.from}
                  data-testid="button-apply-date-range"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
