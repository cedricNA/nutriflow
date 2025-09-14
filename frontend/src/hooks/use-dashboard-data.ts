import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getDailySummary, type UserProfile, type DailySummary } from '@/api/nutriflow';

export interface DashboardData {
  profile?: UserProfile;
  summary: DailySummary;
  remainingCalories: number;
  targetCalories: number;
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {

      const profile = await getUserProfile();

      const summary = await getDailySummary();

      // Utiliser target_calories si disponible, sinon calories_goal pour compatibilité
      const target = summary.target_calories ?? summary.calories_goal ?? 0;

      // Calculer remaining = target - consumed + burned
      // IMPORTANT: remaining ≠ -calorie_balance quand calories_burned > 0
      const remaining = target - (summary.calories_consumed ?? 0) + (summary.calories_burned ?? 0);

      // Créer un summary unifié avec les champs goal_* pour compatibilité Dashboard
      const unifiedSummary = {
        ...summary,
        calories_goal: summary.target_calories ?? summary.calories_goal ?? 0,
        proteins_goal: summary.target_proteins_g ?? summary.proteins_goal ?? 0,
        carbs_goal: summary.target_carbs_g ?? summary.carbs_goal ?? 0,
        fats_goal: summary.target_fats_g ?? summary.fats_goal ?? 0,
      };

      return { profile, summary: unifiedSummary, remainingCalories: remaining, targetCalories: target };
    },
    staleTime: 1000 * 60,
  });
}
