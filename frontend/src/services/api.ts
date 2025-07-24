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
