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

export interface UserProfile {
  poids_kg: number;
  taille_cm: number;
  age: number;
  sexe: string;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch('http://localhost:8000/api/user/profile');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as UserProfile;
}

export interface UnitMapping {
  [fr: string]: string;
}

const GENDER_MAP: Record<string, 'male' | 'female'> = {
  male: 'male',
  homme: 'male',
  female: 'female',
  femme: 'female'
};

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
  preview = false,
  profile?: UserProfile
): Promise<ExerciseResult[]> {
  const url = `http://localhost:8000/api/exercise${preview ? '?preview=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      weight_kg: profile?.poids_kg ?? 70,
      height_cm: profile?.taille_cm ?? 170,
      age: profile?.age ?? 30,
      gender:
        GENDER_MAP[(profile?.sexe ?? 'male').toLowerCase()] ?? 'male'
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
  calories_consumed?: number;
  calories_goal?: number;
  proteins_consumed?: number;
  proteins_goal?: number;
  carbs_consumed?: number;
  carbs_goal?: number;
  fats_consumed?: number;
  fats_goal?: number;
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

export interface ProductSummary {
  barcode: string;
  name: string;
  image_url?: string;
  brand?: string;
  energy_kcal_per_100g?: number;
  proteins_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  nutriscore?: string;
}

export interface IngredientItem {
  id?: string
  text?: string
  [key: string]: any
}

export interface ProductDetails extends ProductSummary {
  quantity?: string
  serving_size?: string
  categories?: string
  labels_tags?: string
  additives_tags?: string
  allergens_tags?: string
  traces_tags?: string
  ingredients_text_fr?: string
  ingredients_list?: Array<string | IngredientItem>
  packaging?: string;
  countries?: string;
  manufacturing_places?: string;
  nutriscore_grade?: string;
  nutriscore_score?: number;
  ecoscore_grade?: string;
  ecoscore_score?: number;
  nova_group?: number;
  nova_groups_tags?: string;
  categories_tags?: string;
  image_front_url?: string;
  image_nutrition_url?: string;
  image_ingredients_url?: string;
  sugars_per_100g?: number;
  salt_per_100g?: number;
}

export async function fetchProductSummary(barcode: string): Promise<ProductSummary> {
  const res = await fetch('http://localhost:8000/api/barcode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode, quantity: 100 })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as ProductSummary;
}

export async function fetchProductDetails(barcode: string): Promise<ProductDetails> {
  const res = await fetch(`http://localhost:8000/api/products/${barcode}/details`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API ${res.status}: ${text}`);
  }
  return (await res.json()) as ProductDetails;
}
