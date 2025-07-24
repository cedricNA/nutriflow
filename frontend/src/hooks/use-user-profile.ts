import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile, type UserProfile } from "@/services/api";

export function useUserProfile(enabled = true) {
  return useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}
