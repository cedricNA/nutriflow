export type UserProfile = {
  poids_kg: number;
  taille_cm: number;
  age: number;
  sexe: 'male'|'female'|'homme'|'femme';
  goal?: 'perte'|'maintien'|'prise'|string;
  tdee_base?: number;
  tdee?: number;
};

export type DailySummary = {
  calories_consumed?: number;
  calories_burned?: number;
  proteins_consumed?: number;
  carbs_consumed?: number;
  fats_consumed?: number;
  bmr?: number;
  tdee?: number;
  calorie_balance?: number;
  goal_feedback?: string;
  calories_total?: number;
  sport_total?: number;
  num_meals?: number;
  num_activities?: number;
  has_data?: boolean;
  target_calories?: number;
  target_proteins_g?: number;
  target_carbs_g?: number;
  target_fats_g?: number;
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
