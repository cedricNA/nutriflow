import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: number;
  goal?: number;
  unit?: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "calories" | "protein" | "carbs" | "fat";
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

export const DashboardCard = ({
  title,
  value,
  goal,
  unit,
  subtitle,
  icon,
  variant = "default",
  trend = "neutral",
  loading = false,
}: DashboardCardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "calories":
        return "border-nutrition-calories/20 bg-gradient-to-br from-orange-50 to-orange-100/50";
      case "protein":
        return "border-nutrition-protein/20 bg-gradient-to-br from-purple-50 to-purple-100/50";
      case "carbs":
        return "border-nutrition-carbs/20 bg-gradient-to-br from-yellow-50 to-yellow-100/50";
      case "fat":
        return "border-nutrition-fat/20 bg-gradient-to-br from-pink-50 to-pink-100/50";
      default:
        return "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10";
    }
  };

  const getTrendIcon = () => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "";
  };

  const progress = goal ? Math.min((value / goal) * 100, 100) : undefined;

  return (
    <Card
      aria-label={title}
      className={`shadow-soft hover:shadow-medium transition-all duration-300 ${getVariantClasses()}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            {goal !== undefined && <Skeleton className="h-4 w-full" />}
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold text-foreground">
                {goal !== undefined
                  ? `${Math.round(value)} / ${Math.round(goal)} ${unit ?? ""}`
                  : `${Math.round(value)} ${unit ?? ""}`}
              </div>
              {trend !== "neutral" && (
                <span className={`text-xs ${trend === "up" ? "text-success" : "text-warning"}`}>
                  {getTrendIcon()}
                </span>
              )}
            </div>
            {progress !== undefined && (
              <Progress value={progress} className="h-2" />
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};