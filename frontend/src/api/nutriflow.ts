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
  date: string;
  calories_apportees: number;
  calories_brulees: number;
  tdee: number;
  balance_calorique: number;
  conseil: string;
  target_calories?: number;
  target_proteins_g?: number;
  target_carbs_g?: number;
  target_fats_g?: number;
};

const API = (path: string) => `/api${path}`;

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(API('/user/profile'));
  if (!res.ok) throw new Error('Failed to load user profile');
  return res.json();
}

export async function getDailySummary(date?: string): Promise<DailySummary> {
  const url = date ? API(`/daily-summary?date_str=${date}`) : API('/daily-summary');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load daily summary');
  return res.json();
}
