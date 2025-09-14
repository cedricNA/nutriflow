import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Lightbulb,
  Activity,
  Target
} from "lucide-react";
import type { DailySummary } from "@/services/api";

/**
 * Représente l'écart d'un macronutriment par rapport à son objectif
 */
interface MacroDeviation {
  /** Valeur consommée du macronutriment */
  value: number;
  /** Pourcentage d'écart par rapport à l'objectif (positif = surplus, négatif = déficit) */
  percentage: number;
  /** Statut qualifiant l'écart : good (<10%), warning (10-25%), danger (>25%) */
  status: 'good' | 'warning' | 'danger';
}

/**
 * Données calculées pour l'affichage du bilan quotidien enrichi
 */
interface DailyInsightData {
  /** Balance calorique : calories_consumed - calories_burned */
  calorieBalance: number;
  /** Statut de la balance : deficit (<-100), surplus (>100), balanced (-100 à 100) */
  balanceStatus: 'deficit' | 'surplus' | 'balanced';
  /** Feedback personnalisé du système basé sur les objectifs utilisateur */
  goalFeedback?: string;
  /** Écarts calculés pour chaque macronutriment par rapport aux objectifs */
  macroDeviations: {
    calories: MacroDeviation;
    proteins: MacroDeviation;
    carbs: MacroDeviation;
    fats: MacroDeviation;
  };
  /** Contexte métabolique pour éducation utilisateur */
  metabolicContext: {
    /** Métabolisme de base (kcal/jour) */
    bmr?: number;
    /** Dépense énergétique totale quotidienne (kcal/jour) */
    tdee?: number;
    /** Besoin énergétique net après activités */
    netNeed?: number;
  };
}

/**
 * Props du composant DailyInsightCard
 */
interface DailyInsightCardProps {
  /** Données complètes de résumé quotidien depuis l'API daily-summary */
  dailySummary: DailySummary;
  /** Date au format YYYY-MM-DD pour affichage formaté en français */
  date: string;
  /** Classes CSS additionnelles optionnelles pour le Card wrapper */
  className?: string;
}

/**
 * Calcule l'écart en pourcentage et détermine le statut
 */
function calculateDeviation(consumed: number, target: number): MacroDeviation {
  if (target === 0) {
    return { value: consumed, percentage: 0, status: 'warning' };
  }

  const percentage = ((consumed - target) / target) * 100;
  const absPercentage = Math.abs(percentage);

  let status: 'good' | 'warning' | 'danger' = 'good';
  if (absPercentage > 25) {
    status = 'danger';
  } else if (absPercentage > 10) {
    status = 'warning';
  }

  return {
    value: consumed,
    percentage: Math.round(percentage),
    status
  };
}

/**
 * Détermine le statut de la balance calorique
 */
function getBalanceStatus(balance: number): 'deficit' | 'surplus' | 'balanced' {
  if (balance < -100) return 'deficit';
  if (balance > 100) return 'surplus';
  return 'balanced';
}

/**
 * Obtient l'icône appropriée pour le statut de balance
 */
function getBalanceIcon(status: 'deficit' | 'surplus' | 'balanced') {
  switch (status) {
    case 'deficit':
      return <TrendingDown className="h-5 w-5 text-blue-500" />;
    case 'surplus':
      return <TrendingUp className="h-5 w-5 text-orange-500" />;
    case 'balanced':
      return <Minus className="h-5 w-5 text-green-500" />;
  }
}

/**
 * Obtient la couleur du badge selon le statut
 */
function getBadgeVariant(status: 'good' | 'warning' | 'danger') {
  switch (status) {
    case 'good':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'danger':
      return 'destructive';
  }
}

/**
 * Obtient l'emoji approprié selon le statut
 */
function getStatusEmoji(status: 'good' | 'warning' | 'danger') {
  switch (status) {
    case 'good':
      return '🟢';
    case 'warning':
      return '🟠';
    case 'danger':
      return '🔴';
  }
}

/**
 * Composant de bilan quotidien enrichi pour l'historique nutritionnel.
 *
 * Affiche un bilan complet du jour avec :
 * - Balance calorique principale avec visualisation
 * - Goal feedback du système pour guidance comportementale
 * - Écarts par rapport aux objectifs macronutriments en pourcentage
 * - Statut global (déficit/surplus/équilibré) avec codes couleur
 * - Contexte métabolique (BMR, TDEE) pour éducation utilisateur
 *
 * Formules scientifiques :
 * - Balance calorique : calories_consumed - calories_burned
 * - Écarts macros : ((consommé - objectif) / objectif) * 100
 * - Seuils statuts : <10% = bon, 10-25% = attention, >25% = danger
 * - Seuils balance : <-100 = déficit, >100 = surplus, entre = équilibré
 *
 * @param dailySummary - Données complètes de résumé quotidien depuis l'API
 * @param date - Date au format YYYY-MM-DD pour affichage formaté
 * @param className - Classes CSS additionnelles optionnelles
 */
export function DailyInsightCard({ dailySummary, date, className }: DailyInsightCardProps) {
  const insightData = useMemo((): DailyInsightData => {
    const calorieBalance = dailySummary.calorie_balance ?? 0;
    const balanceStatus = getBalanceStatus(calorieBalance);

    return {
      calorieBalance,
      balanceStatus,
      goalFeedback: dailySummary.goal_feedback,
      macroDeviations: {
        calories: calculateDeviation(
          dailySummary.calories_consumed ?? 0,
          dailySummary.target_calories ?? 0
        ),
        proteins: calculateDeviation(
          dailySummary.proteins_consumed ?? 0,
          dailySummary.target_proteins_g ?? 0
        ),
        carbs: calculateDeviation(
          dailySummary.carbs_consumed ?? 0,
          dailySummary.target_carbs_g ?? 0
        ),
        fats: calculateDeviation(
          dailySummary.fats_consumed ?? 0,
          dailySummary.target_fats_g ?? 0
        ),
      },
      metabolicContext: {
        bmr: dailySummary.bmr,
        tdee: dailySummary.tdee,
        netNeed: dailySummary.target_calories,
      },
    };
  }, [dailySummary]);

  const formattedDate = format(new Date(date), "EEEE d MMMM yyyy", { locale: fr });

  // Calcul de la progression pour la barre visuelle (basé sur le ratio consumed/target)
  const progressValue = dailySummary.target_calories
    ? Math.min(((dailySummary.calories_consumed ?? 0) / dailySummary.target_calories) * 100, 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Bilan Quotidien - {formattedDate}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Calorique Principale */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {getBalanceIcon(insightData.balanceStatus)}
            <span className="text-lg font-semibold">
              Balance Calorique: {insightData.calorieBalance > 0 ? '+' : ''}{Math.round(insightData.calorieBalance)} kcal
            </span>
          </div>
          <Progress value={progressValue} className="h-3" />
          <div className="text-sm text-muted-foreground text-center">
            {insightData.balanceStatus === 'deficit' && 'Déficit calorique'}
            {insightData.balanceStatus === 'surplus' && 'Surplus calorique'}
            {insightData.balanceStatus === 'balanced' && 'Balance équilibrée'}
          </div>
        </div>

        {/* Goal Feedback */}
        {insightData.goalFeedback && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {insightData.goalFeedback}
            </AlertDescription>
          </Alert>
        )}

        {/* Écarts par rapport aux Objectifs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="font-semibold">Écarts Objectifs:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Badge variant={getBadgeVariant(insightData.macroDeviations.calories.status)} className="justify-between">
              <span>Calories: {insightData.macroDeviations.calories.percentage > 0 ? '+' : ''}{insightData.macroDeviations.calories.percentage}%</span>
              <span>{getStatusEmoji(insightData.macroDeviations.calories.status)}</span>
            </Badge>
            <Badge variant={getBadgeVariant(insightData.macroDeviations.proteins.status)} className="justify-between">
              <span>Protéines: {insightData.macroDeviations.proteins.percentage > 0 ? '+' : ''}{insightData.macroDeviations.proteins.percentage}%</span>
              <span>{getStatusEmoji(insightData.macroDeviations.proteins.status)}</span>
            </Badge>
            <Badge variant={getBadgeVariant(insightData.macroDeviations.carbs.status)} className="justify-between">
              <span>Glucides: {insightData.macroDeviations.carbs.percentage > 0 ? '+' : ''}{insightData.macroDeviations.carbs.percentage}%</span>
              <span>{getStatusEmoji(insightData.macroDeviations.carbs.status)}</span>
            </Badge>
            <Badge variant={getBadgeVariant(insightData.macroDeviations.fats.status)} className="justify-between">
              <span>Lipides: {insightData.macroDeviations.fats.percentage > 0 ? '+' : ''}{insightData.macroDeviations.fats.percentage}%</span>
              <span>{getStatusEmoji(insightData.macroDeviations.fats.status)}</span>
            </Badge>
          </div>
        </div>

        {/* Contexte Métabolique */}
        {(insightData.metabolicContext.bmr || insightData.metabolicContext.tdee) && (
          <div className="space-y-2 pt-2 border-t">
            <div className="font-semibold text-sm text-muted-foreground">⚡ Contexte Métabolique:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {insightData.metabolicContext.bmr && (
                <div>
                  <span className="text-muted-foreground">BMR:</span> {Math.round(insightData.metabolicContext.bmr)} kcal/jour
                </div>
              )}
              {insightData.metabolicContext.tdee && (
                <div>
                  <span className="text-muted-foreground">TDEE:</span> {Math.round(insightData.metabolicContext.tdee)} kcal/jour
                </div>
              )}
              {insightData.metabolicContext.netNeed && (
                <div>
                  <span className="text-muted-foreground">Besoin net:</span> {Math.round(insightData.metabolicContext.netNeed)} kcal
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}