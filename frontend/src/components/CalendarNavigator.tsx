import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { cn } from "@/lib/utils";
import type { DailySummary } from "@/services/api";
import type { DayProps } from "react-day-picker";

interface CalendarNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

interface DayIndicatorProps {
  status: "excellent" | "partial" | "no-data";
}

function DayIndicator({ status }: DayIndicatorProps) {
  const colors = {
    excellent: "bg-green-500",
    partial: "bg-orange-400",
    "no-data": "bg-gray-300",
  };

  return (
    <div className={cn("w-1.5 h-1.5 rounded-full mx-auto mt-0.5", colors[status])} />
  );
}

// Calculate day status based on ±20% tolerance
function calculateDayStatus(summary: DailySummary | undefined): "excellent" | "partial" | "no-data" {
  // Check if we have any data
  if (!summary || summary.calories_consumed === 0) {
    return "no-data";
  }

  // Get goal values (API returns *_goal fields)
  const caloriesGoal = summary.calories_goal ?? summary.target_calories;
  const proteinsGoal = summary.proteins_goal ?? summary.target_proteins_g;
  const carbsGoal = summary.carbs_goal ?? summary.target_carbs_g;
  const fatsGoal = summary.fats_goal ?? summary.target_fats_g;

  // Check if all goals are defined
  if (!caloriesGoal || !proteinsGoal || !carbsGoal || !fatsGoal) {
    return "no-data";
  }

  // Check if all consumed values are defined
  if (!summary.calories_consumed || !summary.proteins_consumed || !summary.carbs_consumed || !summary.fats_consumed) {
    return "partial";
  }

  // Calculate ranges (±20%)
  const caloriesInRange =
    summary.calories_consumed >= caloriesGoal * 0.8 &&
    summary.calories_consumed <= caloriesGoal * 1.2;

  const proteinsInRange =
    summary.proteins_consumed >= proteinsGoal * 0.8 &&
    summary.proteins_consumed <= proteinsGoal * 1.2;

  const carbsInRange =
    summary.carbs_consumed >= carbsGoal * 0.8 &&
    summary.carbs_consumed <= carbsGoal * 1.2;

  const fatsInRange =
    summary.fats_consumed >= fatsGoal * 0.8 &&
    summary.fats_consumed <= fatsGoal * 1.2;

  // All in range = excellent
  if (caloriesInRange && proteinsInRange && carbsInRange && fatsInRange) {
    return "excellent";
  }

  // At least one out of range = partial
  return "partial";
}

export function CalendarNavigator({ selectedDate, onDateChange }: CalendarNavigatorProps) {
  const [open, setOpen] = useState(false);

  const goToToday = () => {
    onDateChange(new Date());
    setOpen(false);
  };

  // Custom Day component with data fetching and status indicators
  const CustomDay = (props: DayProps) => {
    const { date, ...rest } = props;
    const dateStr = format(date, "yyyy-MM-dd");

    // Fetch daily summary for this specific day
    const { data: summary } = useDailySummary(dateStr, true);
    const status = calculateDayStatus(summary);

    return (
      <button
        {...rest}
        type="button"
        onClick={() => {
          onDateChange(date);
          setOpen(false);
        }}
        className={cn(rest.className, "relative")}
      >
        <span>{format(date, "d")}</span>
        <DayIndicator status={status} />
      </button>
    );
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            <Badge variant="outline" className="px-2 py-1">
              {format(selectedDate, "PPP", { locale: fr })}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="center">
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date);
                  setOpen(false);
                }
              }}
              locale={fr}
              components={{
                Day: CustomDay,
              }}
            />
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Légende
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Objectifs atteints (±20%)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Partiellement atteints</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>Pas de données</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="secondary" size="sm" onClick={goToToday}>
        <Home className="mr-1 h-4 w-4" />
        Aujourd'hui
      </Button>
    </div>
  );
}
