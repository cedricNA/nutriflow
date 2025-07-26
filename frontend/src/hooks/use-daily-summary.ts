import { useQuery } from "@tanstack/react-query";
import { fetchDailySummary, type DailySummary } from "@/services/api";
import { format } from "date-fns";

export function useDailySummary(date?: string, enabled = true) {
  const finalDate = date ?? format(new Date(), "yyyy-MM-dd");
  return useQuery<DailySummary>({
    queryKey: ["daily-summary", finalDate],
    queryFn: () => fetchDailySummary(finalDate),
    enabled,
    staleTime: 1000 * 60,
  });
}
