import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DailyInsightCard } from '../DailyInsightCard';
import type { DailySummary } from '@/services/api';

describe('DailyInsightCard - Real Data Integration', () => {
  it('displays real data from corrected API (2025-09-13)', () => {
    // Données réelles de l'API corrigée pour le 13/09/2025
    const realSummary: DailySummary = {
      calories_consumed: 230,
      proteins_consumed: 32.37,
      carbs_consumed: 14.09,
      fats_consumed: 3.71,
      calories_burned: 0,
      bmr: 1698.75,
      tdee: 2038.5,
      calorie_balance: -1808.5,
      goal_feedback: "Léger déficit - surveillez votre énergie et hydratation",
      target_calories: 2038.5,
      target_proteins_g: 120,
      target_carbs_g: 262,
      target_fats_g: 57,
    };

    render(<DailyInsightCard dailySummary={realSummary} date="2025-09-13" />);

    // Vérifier le titre et la date
    expect(screen.getByText(/Bilan Quotidien - samedi 13 septembre 2025/)).toBeInTheDocument();

    // Vérifier la balance calorique
    expect(screen.getByText(/Balance Calorique: -1808 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/Déficit calorique/)).toBeInTheDocument();

    // Vérifier le goal feedback
    expect(screen.getByText("Léger déficit - surveillez votre énergie et hydratation")).toBeInTheDocument();

    // Vérifier les écarts par rapport aux objectifs (calculés par le composant)
    // calories: 230 vs 2038.5 = -89% (arrondi à -89%)
    // proteins: 32.37 vs 120 = -73% (arrondi à -73%)
    // carbs: 14.09 vs 262 = -95% (arrondi à -95%)
    // fats: 3.71 vs 57 = -93% (arrondi à -93%)
    expect(screen.getByText(/Calories: -89%/)).toBeInTheDocument();
    expect(screen.getByText(/Protéines: -73%/)).toBeInTheDocument();
    expect(screen.getByText(/Glucides: -95%/)).toBeInTheDocument();
    expect(screen.getByText(/Lipides: -93%/)).toBeInTheDocument();

    // Tous ces écarts sont > 25% donc doivent être en rouge (danger)
    const dangerEmojis = screen.getAllByText('🔴');
    expect(dangerEmojis).toHaveLength(4); // 4 macros en danger

    // Vérifier le contexte métabolique
    expect(screen.getByText(/Contexte Métabolique/)).toBeInTheDocument();
    expect(screen.getByText('BMR:')).toBeInTheDocument();
    expect(screen.getByText('1699 kcal/jour')).toBeInTheDocument(); // arrondi de 1698.75
    expect(screen.getByText('TDEE:')).toBeInTheDocument();
    expect(screen.getByText('2039 kcal/jour')).toBeInTheDocument(); // arrondi de 2038.5
    expect(screen.getByText('Besoin net:')).toBeInTheDocument();
    expect(screen.getByText('2039 kcal')).toBeInTheDocument(); // target_calories arrondi
  });

  it('calculates correct progress bar value', () => {
    const realSummary: DailySummary = {
      calories_consumed: 230,
      target_calories: 2038.5,
      calorie_balance: -1808.5,
      bmr: 1698.75,
      tdee: 2038.5,
      goal_feedback: "Léger déficit - surveillez votre énergie et hydratation",
    };

    render(<DailyInsightCard dailySummary={realSummary} date="2025-09-13" />);

    // Progress value devrait être 230/2038.5 * 100 = 11.3% (arrondi)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', expect.stringMatching(/^11\./)); // commence par 11.
  });
});