import { describe, it, expect, vi } from 'vitest';

describe('Data Consistency Between Pages', () => {
  it('should calculate remaining calories consistently with calorie_balance', () => {
    // Données réelles de l'API
    const apiData = {
      calories_consumed: 230,
      target_calories: 2038.5,
      calories_burned: 367.5,
      calorie_balance: -1441.0,
    };

    // Calculs séparés pour bien comprendre
    const remaining = apiData.target_calories - apiData.calories_consumed + apiData.calories_burned;
    const calorie_balance = apiData.calories_consumed - apiData.target_calories + apiData.calories_burned;

    // Vérification : calorie_balance = consumed - target + burned
    expect(calorie_balance).toBe(apiData.calorie_balance);

    // Vérification : remaining = target - consumed + burned
    expect(remaining).toBe(2176.0); // 2038.5 - 230 + 367.5

    // IMPORTANT: remaining ≠ -calorie_balance quand il y a des calories brûlées !
    // remaining = 2176, -calorie_balance = 1441
    // La différence = 2 × calories_burned = 735
    expect(remaining + apiData.calorie_balance).toBe(2 * apiData.calories_burned);
  });

  it('should handle field mapping between target_* and *_goal', () => {
    const apiData = {
      target_calories: 2038.5,
      target_proteins_g: 120,
      target_carbs_g: 262,
      target_fats_g: 57,
    };

    // Mapping Dashboard (logique corrigée)
    const unifiedSummary = {
      ...apiData,
      calories_goal: apiData.target_calories,
      proteins_goal: apiData.target_proteins_g,
      carbs_goal: apiData.target_carbs_g,
      fats_goal: apiData.target_fats_g,
    };

    expect(unifiedSummary.calories_goal).toBe(2038.5);
    expect(unifiedSummary.proteins_goal).toBe(120);
    expect(unifiedSummary.carbs_goal).toBe(262);
    expect(unifiedSummary.fats_goal).toBe(57);
  });

  it('should handle edge cases for missing data', () => {
    const apiData = {
      calories_consumed: 230,
      // target_calories missing
      calories_burned: 367.5,
      // calorie_balance missing
    };

    // Calcul avec valeurs par défaut
    const target = 0; // default when missing
    const remaining = target - apiData.calories_consumed + apiData.calories_burned;

    expect(remaining).toBe(137.5); // 0 - 230 + 367.5
  });
});