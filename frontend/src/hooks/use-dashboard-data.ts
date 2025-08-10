import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getDailySummary, type UserProfile, type DailySummary } from '@/api/nutriflow';

export interface DashboardData {
  profile: UserProfile;
  summary: DailySummary;
  remainingCalories: number;
  targetCalories: number;
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const [profile, summary] = await Promise.all([
        getUserProfile(),
        getDailySummary(),
      ]);
      const target = summary.target_calories ?? summary.tdee ?? 0;
      const remaining = target - (summary.calories_apportees ?? 0);
      return { profile, summary, remainingCalories: remaining, targetCalories: target };
    },
    staleTime: 1000 * 60,
  });
}
