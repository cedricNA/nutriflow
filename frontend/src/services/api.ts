export interface Totals {
  total_calories: number;
  total_proteins_g: number;
  total_carbs_g: number;
  total_fats_g: number;
}

export interface NutritionixFood {
  aliment: string;
  quantite: string;
  poids_g: number;
  calories: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
}

export interface NutritionixResponse {
  foods: NutritionixFood[];
  totals: Totals;
}

export interface UnitMapping {
  [fr: string]: string;
}

export async function fetchUnits(): Promise<UnitMapping> {
  const res = await fetch('http://localhost:8000/api/units');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as UnitMapping;
}

export async function analyzeIngredients(input: string, mealType: string): Promise<NutritionixResponse> {
  console.log('Données envoyées :', { query: input, type: mealType });
  const res = await fetch('http://localhost:8000/api/ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: input, type: mealType })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  const data = (await res.json()) as NutritionixResponse;
  console.log('Réponse reçue :', data);
  return data;
}

export interface MealItem {
  id?: string;
  meal_id?: string;
  nom_aliment: string;
  quantite: number;
  unite: string;
  calories?: number;
  proteines_g?: number;
  glucides_g?: number;
  lipides_g?: number;
  marque?: string;
  barcode?: string;
  source?: string;
}

export interface Meal {
  id: string;
  type: string;
  ingredients: MealItem[];
}

export async function fetchMeals(date: string): Promise<Meal[]> {
  const res = await fetch(`http://localhost:8000/api/meals?date=${date}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as Meal[];
}

export async function updateMeal(mealId: string, changes: unknown): Promise<Meal> {
  const res = await fetch(`http://localhost:8000/api/meals/${mealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as Meal;
}

export async function deleteMeal(mealId: string): Promise<void> {
  const res = await fetch(`http://localhost:8000/api/meals/${mealId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
}

export async function deleteMealItem(itemId: string): Promise<void> {
  const res = await fetch(`http://localhost:8000/api/meal-items/${itemId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
}

export interface ExerciseResult {
  name: string;
  duration_min: number;
  calories: number;
  met?: number;
}

export async function analyzeExercise(
  query: string,
  preview = false
): Promise<ExerciseResult[]> {
  const url = `http://localhost:8000/api/exercise${preview ? '?preview=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      weight_kg: 70,
      height_cm: 170,
      age: 30,
      gender: 'male'
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as ExerciseResult[];
}

export interface Activity {
  id: string;
  description: string;
  duree_min: number;
  calories_brulees: number;
  intensite?: string;
}

export async function fetchActivities(date: string): Promise<Activity[]> {
  const res = await fetch(`http://localhost:8000/api/activities?date=${date}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as Activity[];
}

export async function updateActivity(
  activityId: string,
  changes: Partial<Activity>
): Promise<Activity> {
  const res = await fetch(`http://localhost:8000/api/activities/${activityId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as Activity;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const res = await fetch(`http://localhost:8000/api/activities/${activityId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
}

export interface DailySummary {
  date: string;
  calories_apportees: number;
  calories_brulees: number;
  tdee: number;
  balance_calorique: number;
  conseil: string;
}

export async function fetchDailySummary(date: string): Promise<DailySummary> {
  const res = await fetch(`http://localhost:8000/api/daily-summary?date=${date}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as DailySummary;
}

export async function fetchSports(): Promise<string[]> {
  const res = await fetch('http://localhost:8000/api/sports');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as string[];
}
