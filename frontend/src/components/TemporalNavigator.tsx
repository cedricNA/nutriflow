import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

interface TemporalNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TemporalNavigator({ selectedDate, onDateChange }: TemporalNavigatorProps) {
  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousDay}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Badge variant="outline" className="px-4 py-2">
        {format(selectedDate, "PPP", { locale: fr })}
      </Badge>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNextDay}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={goToToday}
      >
        <Home className="mr-1 h-4 w-4" />
        Aujourd'hui
      </Button>
    </div>
  );
}