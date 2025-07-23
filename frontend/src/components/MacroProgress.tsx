import { Progress } from "@/components/ui/progress";

interface MacroProgressProps {
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

export const MacroProgress = ({ protein, carbs, fat }: MacroProgressProps) => {
  const getMacroPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const macros = [
    {
      name: "Protéines",
      current: protein.current,
      target: protein.target,
      color: "bg-nutrition-protein",
      percentage: getMacroPercentage(protein.current, protein.target)
    },
    {
      name: "Glucides", 
      current: carbs.current,
      target: carbs.target,
      color: "bg-nutrition-carbs",
      percentage: getMacroPercentage(carbs.current, carbs.target)
    },
    {
      name: "Lipides",
      current: fat.current, 
      target: fat.target,
      color: "bg-nutrition-fat",
      percentage: getMacroPercentage(fat.current, fat.target)
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Macronutriments</h3>
      {macros.map((macro) => (
        <div key={macro.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">{macro.name}</span>
            <span className="text-sm text-muted-foreground">
              {macro.current}g / {macro.target}g
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={macro.percentage} 
              className="h-2"
            />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${macro.color}`}
              style={{ width: `${macro.percentage}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {macro.percentage.toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
};