import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useNutritionRecommendations,
  type NutritionRecommendation,
  type WeeklyNutritionAnalysis,
} from "@/hooks/use-nutrition-recommendations";

interface NutritionRecommendationsProps {
  userId?: string;
  className?: string;
}

function RecommendationCard({ recommendation }: { recommendation: NutritionRecommendation }) {
  const isDeficit = recommendation.category.startsWith("deficit_");
  const priorityColor = {
    1: "destructive",
    2: "destructive",
    3: "secondary",
    4: "secondary",
  } as const;

  const Icon = isDeficit ? TrendingUp : TrendingDown;
  const iconColor = isDeficit ? "text-blue-500" : "text-orange-500";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5", iconColor)} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant={priorityColor[recommendation.priority as keyof typeof priorityColor]}
              className="text-xs"
            >
              Priorité {recommendation.priority}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground">
            {recommendation.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {recommendation.explanation}
          </p>
        </div>
      </div>

      {recommendation.food_suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Aliments suggérés :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {recommendation.food_suggestions.map((food, idx) => (
              <div key={idx} className="bg-muted rounded-md p-2 text-xs">
                <p className="font-medium text-foreground">{food.name}</p>
                <p className="text-muted-foreground">
                  {food.nutrient_value}{food.nutrient_unit} • {food.portion}
                </p>
                {food.calories_per_portion && (
                  <p className="text-muted-foreground">
                    {food.calories_per_portion} kcal
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisOverview({ analysis }: { analysis: WeeklyNutritionAnalysis }) {
  const confidenceBadgeVariant = {
    high: "default",
    medium: "secondary",
    low: "outline",
  } as const;

  const confidenceLabels = {
    high: "Analyse fiable",
    medium: "Analyse modérée",
    low: "Données insuffisantes",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          {Math.round(analysis.overall_score)}
        </p>
        <p className="text-xs text-muted-foreground">Score nutritionnel</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          {analysis.days_with_data}
        </p>
        <p className="text-xs text-muted-foreground">Jours analysés</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          {Math.round(analysis.avg_calories)}
        </p>
        <p className="text-xs text-muted-foreground">Calories/jour</p>
      </div>
      <div className="text-center">
        <Badge variant={confidenceBadgeVariant[analysis.confidence_level]} className="text-xs">
          {confidenceLabels[analysis.confidence_level]}
        </Badge>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-6 w-8 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NutritionRecommendations({
  userId,
  className
}: NutritionRecommendationsProps) {
  const { data: recommendations, isLoading, error } = useNutritionRecommendations({
    userId,
    days: 7,
    enabled: true,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Impossible de charger les recommandations nutritionnelles.
          {error instanceof Error && (
            <span className="block text-xs mt-1">
              {error.message}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!recommendations) {
    return null;
  }

  // Pas de recommandations si données insuffisantes
  if (!recommendations.analysis || recommendations.analysis.days_with_data < 1) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommandations Nutritionnelles
          </CardTitle>
          <CardDescription>
            Ajoutez des repas pour obtenir des suggestions personnalisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Aucune donnée nutritionnelle disponible.</p>
            <p className="text-sm mt-2">
              Ajoutez quelques repas pour recevoir des recommandations personnalisées
              basées sur vos habitudes alimentaires.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Recommandations Nutritionnelles
        </CardTitle>
        <CardDescription>
          Basées sur vos {recommendations.analysis.days_with_data} derniers jours • Suggestions informatives uniquement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AnalysisOverview analysis={recommendations.analysis} />

        {recommendations.recommendations.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">
              Suggestions d'amélioration ({recommendations.recommendations.length})
            </h4>
            {recommendations.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-sm font-medium text-foreground">
              Excellent ! Aucune amélioration prioritaire détectée.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Votre alimentation semble équilibrée sur la période analysée.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg border-l-4 border-yellow-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-600" />
            <div>
              <p className="font-medium">⚠️ Avertissement important</p>
              <p className="mt-1">
                {recommendations.disclaimer}
              </p>
              <p className="mt-2 text-xs">
                En cas de condition médicale, allergies ou régime spécifique,
                consultez votre médecin avant de suivre ces suggestions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
