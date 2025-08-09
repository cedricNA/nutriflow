import { Progress } from "@/components/ui/progress";

interface MacroProgressProps {
  protein: { current: number; target?: number };
  carbs: { current: number; target?: number };
  fat: { current: number; target?: number };
}

export const MacroProgress = ({ protein, carbs, fat }: MacroProgressProps) => {
  const getMacroPercentage = (current: number, target?: number) => {
    if (!target) return 0;
    return (current / target) * 100;
  };

  const getBarColor = (percentage: number, baseColor: string) => {
    if (percentage > 120) return "bg-red-500";
    if (percentage >= 100) return "bg-green-500";
    if (percentage < 50) return "bg-orange-500";
    return baseColor;
  };

  const macros = [
    {
      name: "Protéines",
      current: protein.current,
      target: protein.target,
      color: "bg-nutrition-protein",
      percentage: getMacroPercentage(protein.current, protein.target),
    },
    {
      name: "Glucides",
      current: carbs.current,
      target: carbs.target,
      color: "bg-nutrition-carbs",
      percentage: getMacroPercentage(carbs.current, carbs.target),
    },
    {
      name: "Lipides",
      current: fat.current,
      target: fat.target,
      color: "bg-nutrition-fat",
      percentage: getMacroPercentage(fat.current, fat.target),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Macronutriments</h3>
      {macros.map((macro) => {
        const percentage = macro.percentage;
        const barColor = getBarColor(percentage, macro.color);
        const width = Math.min(percentage, 100);
        return (
          <div key={macro.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{macro.name}</span>
              <span className="text-sm text-muted-foreground">
                {macro.target
                  ? `${macro.current.toFixed(1)} / ${macro.target} g`
                  : `${macro.current.toFixed(1)} g`}
              </span>
            </div>
            {macro.target && (
              <>
                <div className="relative">
                  <Progress value={width} className="h-2" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {percentage.toFixed(0)}%
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};