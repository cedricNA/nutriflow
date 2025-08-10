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
  calories_goal?: number;
  proteins_consumed?: number;
  proteins_goal?: number;
  carbs_consumed?: number;
  carbs_goal?: number;
  fats_consumed?: number;
  fats_goal?: number;
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
