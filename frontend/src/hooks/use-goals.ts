import { useQuery } from "@tanstack/react-query";
import { fetchGoals, type Goals } from "@/services/api";

export function useGoals(enabled = true) {
  return useQuery<Goals>({
    queryKey: ["user-goals"],
    queryFn: fetchGoals,
    enabled,
    staleTime: 1000 * 60,
  });
}
