import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailySummary } from '@/api/nutriflow';

interface CaloriesProgressData {
  consumed: number;
  target: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
}

interface CaloriesProgressProps {
  dailySummary: DailySummary;
  className?: string;
}

const CaloriesProgress: React.FC<CaloriesProgressProps> = React.memo(({ 
  dailySummary, 
  className 
}) => {
  const computeCaloriesData = (summary: DailySummary): CaloriesProgressData => {
    const rawConsumed = summary.calories_consumed ?? 0;
    const consumed = Math.max(0, Math.round(rawConsumed)); // Normalize negative to 0
    const target = Math.round(summary.calories_goal ?? 0);
    
    if (target === 0) {
      return {
        consumed,
        target,
        percentage: 0,
        status: 'good'
      };
    }
    
    const percentage = Math.round((consumed / target) * 100);
    
    let status: 'good' | 'warning' | 'danger' = 'good';
    if (percentage > 110) {
      status = 'danger';
    } else if (percentage >= 100) {
      status = 'warning';
    }
    
    return {
      consumed,
      target,
      percentage,
      status
    };
  };

  const data = computeCaloriesData(dailySummary);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'danger':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  const getCardStyles = (status: string) => {
    switch (status) {
      case 'good':
        return 'border-success/20 bg-gradient-to-br from-green-50 to-green-100/50';
      case 'warning':
        return 'border-warning/20 bg-gradient-to-br from-orange-50 to-orange-100/50';
      case 'danger':
        return 'border-destructive/20 bg-gradient-to-br from-red-50 to-red-100/50';
      default:
        return 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10';
    }
  };

  const displayPercentage = Math.min(data.percentage, 100);

  return (
    <Card
      className={cn(
        'shadow-soft hover:shadow-medium transition-all duration-300',
        getCardStyles(data.status),
        className
      )}
      aria-label="Progression des calories quotidiennes"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Calories consommées
        </CardTitle>
        <Flame className="h-4 w-4 text-nutrition-calories" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-foreground">
              {data.target > 0 
                ? `${data.consumed} / ${data.target} cal`
                : `${data.consumed} / – cal`
              }
            </div>
          </div>
          {data.target > 0 && (
            <>
              <Progress
                value={displayPercentage}
                className="h-3 w-full"
                indicatorClassName={getStatusColor(data.status)}
                aria-label={`${data.percentage}% de l'objectif calorique atteint`}
              />
              <p className="text-xs text-muted-foreground">
                {data.percentage}% de l'objectif ({data.status === 'good' ? 'En bonne voie' : 
                  data.status === 'warning' ? 'Objectif atteint' : 'Objectif dépassé'})
              </p>
            </>
          )}
          {data.target === 0 && (
            <p className="text-xs text-muted-foreground">
              Objectif calorique non défini
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

CaloriesProgress.displayName = 'CaloriesProgress';

export { CaloriesProgress };