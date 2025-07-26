import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "calories" | "protein" | "carbs" | "fat";
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

export const DashboardCard = ({
  title,
  value,
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

  return (
    <Card className={`shadow-soft hover:shadow-medium transition-all duration-300 ${getVariantClasses()}`}>
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
            {subtitle && <Skeleton className="h-4 w-24" />}
          </div>
        ) : (
          <>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold text-foreground">{value}</div>
              {trend !== "neutral" && (
                <span className={`text-xs ${trend === "up" ? "text-success" : "text-warning"}`}>
                  {getTrendIcon()}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};