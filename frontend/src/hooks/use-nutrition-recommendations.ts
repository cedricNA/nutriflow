import { useQuery, UseQueryResult } from "@tanstack/react-query";

export interface WeeklyNutritionAnalysis {
  user_id: string;
  analysis_period: [string, string];
  days_with_data: number;
  avg_calories: number;
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
  avg_fiber: number;
  avg_sodium: number;
  avg_sugar: number;
  deficiencies: string[];
  excesses: string[];
  overall_score: number;
  confidence_level: "high" | "medium" | "low";
}

export interface FoodSuggestion {
  name: string;
  nutrient_value: number;
  nutrient_unit: string;
  portion: string;
  portion_size: number;
  source: "nutritionix" | "openfoodfacts" | "static";
  calories_per_portion?: number;
  additional_nutrients: Record<string, number>;
}

export interface NutritionRecommendation {
  id: string;
  category: string;
  priority: number;
  message: string;
  explanation: string;
  food_suggestions: FoodSuggestion[];
  target_value?: number;
  current_value?: number;
  unit?: string;
}

export interface NutritionRecommendationsResponse {
  user_id: string;
  analysis: WeeklyNutritionAnalysis;
  recommendations: NutritionRecommendation[];
  generated_at: string;
  disclaimer: string;
}

async function fetchNutritionRecommendations(
  userId: string,
  days: number = 7
): Promise<NutritionRecommendationsResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const response = await fetch(
    `${baseUrl}/api/nutrition-recommendations?user_id=${userId}&days=${days}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

interface UseNutritionRecommendationsOptions {
  userId?: string;
  days?: number;
  enabled?: boolean;
}

export function useNutritionRecommendations(
  options: UseNutritionRecommendationsOptions = {}
): UseQueryResult<NutritionRecommendationsResponse, Error> {
  const {
    userId = "00000000-0000-0000-0000-000000000000", // Utilisateur test par défaut
    days = 7,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ["nutrition-recommendations", userId, days],
    queryFn: () => fetchNutritionRecommendations(userId, days),
    enabled,
    staleTime: 1000 * 60 * 60, // 1 heure de cache
    cacheTime: 1000 * 60 * 60 * 2, // 2 heures en cache
    retry: (failureCount, error) => {
      // Ne pas retry si l'erreur est une erreur de validation (4xx)
      if (error.message.includes("422") || error.message.includes("400")) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Évite les appels inutiles au focus
  });
}