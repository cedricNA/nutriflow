export type UserProfile = {
  poids_kg: number;
  taille_cm: number;
  age: number;
  sexe: 'male'|'female'|'homme'|'femme';
  goal?: 'perte'|'maintien'|'prise'|string;
  tdee_base?: number;
  tdee?: number;
};

/**
 * Interface DailySummary - Structure standardisée pour les résumés quotidiens
 * IMPORTANT: Cette interface doit matcher exactement la table daily_summary
 */
export type DailySummary = {
  // === Colonnes de consommation (données réelles) ===
  calories_consumed: number;    // Calories consommées via repas (kcal)
  proteins_consumed: number;    // Protéines consommées (g)
  carbs_consumed: number;       // Glucides consommés (g)
  fats_consumed: number;        // Lipides consommés (g)
  
  // === Colonnes d'objectifs (calculés) ===
  calories_goal: number;        // Objectif calorique quotidien (kcal)
  proteins_goal: number;        // Objectif protéines (g)
  carbs_goal: number;           // Objectif glucides (g)
  fats_goal: number;            // Objectif lipides (g)
  
  // === Colonnes de calcul ===
  calories_burned?: number;     // Calories brûlées via exercices (kcal)
  bmr?: number;                 // Métabolisme de base (kcal)
  tdee?: number;                // TDEE total (kcal)
  calorie_balance?: number;     // Balance calorique nette
  
  // === Colonnes de totaux (pour historique) ===
  calories_total?: number;      // calories_consumed + calories_burned
  sport_total?: number;         // Durée totale exercices (minutes)
  
  // === Colonnes de tracking ===
  num_meals?: number;           // Nombre de repas
  num_activities?: number;      // Nombre d'activités
  has_data?: boolean;           // Indicateur de présence de données
  
  // === Colonnes targets (nouvelles) ===
  target_calories?: number;     // Target alternatif calories
  target_proteins_g?: number;   // Target alternatif protéines
  target_carbs_g?: number;      // Target alternatif glucides
  target_fats_g?: number;       // Target alternatif lipides
  
  // === Meta-données ===
  goal_feedback?: string;       // Message de conseil personnalisé
  last_updated?: string;        // Timestamp dernière mise à jour
  created_at?: string;          // Timestamp de création
};

const API = (path: string) => `/api${path}`;

export async function getUserProfile(): Promise<UserProfile | undefined> {
  const res = await fetch(API('/user/profile'));
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error('Failed to load user profile');
  return res.json();
}

export async function getDailySummary(date?: string): Promise<DailySummary> {
  const url = date ? API(`/daily-summary?date_str=${date}`) : API('/daily-summary');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load daily summary');
  return res.json();
}
