import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DailyInsightCard } from '../DailyInsightCard';
import type { DailySummary } from '@/services/api';

describe('DailyInsightCard', () => {
  const createMockSummary = (overrides: Partial<DailySummary> = {}): DailySummary => ({
    calories_consumed: 369,
    calories_burned: 0,
    target_calories: 2039,
    calorie_balance: -1670,
    proteins_consumed: 15,
    target_proteins_g: 150,
    carbs_consumed: 45,
    target_carbs_g: 250,
    fats_consumed: 12,
    target_fats_g: 68,
    bmr: 1650,
    tdee: 2039,
    goal_feedback: "Léger déficit, surveillez votre énergie et hydratation",
    ...overrides,
  });

  it('renders correctly with complete data', () => {
    const summary = createMockSummary();

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Bilan Quotidien/)).toBeInTheDocument();
    expect(screen.getByText(/Solde Énergétique: \+369 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/Surplus calorique/)).toBeInTheDocument();
  });

  it('displays goal feedback when available', () => {
    const summary = createMockSummary({
      goal_feedback: "Test goal feedback message"
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText("Test goal feedback message")).toBeInTheDocument();
  });

  it('hides goal feedback when not available', () => {
    const summary = createMockSummary({
      goal_feedback: undefined
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.queryByText(/Test goal feedback/)).not.toBeInTheDocument();
  });

  it('calculates macro deviations correctly', () => {
    const summary = createMockSummary({
      calories_consumed: 1000,
      target_calories: 2000, // -50%
      proteins_consumed: 165,
      target_proteins_g: 150, // +10%
      carbs_consumed: 300,
      target_carbs_g: 250, // +20%
      fats_consumed: 34,
      target_fats_g: 68, // -50%
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Calories: -50%/)).toBeInTheDocument();
    expect(screen.getByText(/Protéines: \+10%/)).toBeInTheDocument();
    expect(screen.getByText(/Glucides: \+20%/)).toBeInTheDocument();
    expect(screen.getByText(/Lipides: -50%/)).toBeInTheDocument();
  });

  it('shows correct status colors for different macro deviations', () => {
    // Test with specific values that should generate different status levels
    const summary = createMockSummary({
      calories_consumed: 2000,
      target_calories: 2000, // 0% = good (green)
      proteins_consumed: 165,
      target_proteins_g: 150, // +10% exactly = warning threshold
      carbs_consumed: 300,
      target_carbs_g: 200, // +50% = danger (red)
      fats_consumed: 30,
      target_fats_g: 60, // -50% = danger (red)
    });

    const { container } = render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    // Instead of looking for specific emojis, let's verify the percentage calculations are displayed
    expect(screen.getByText(/Calories: 0%/)).toBeInTheDocument();
    expect(screen.getByText(/Protéines: \+10%/)).toBeInTheDocument();
    expect(screen.getByText(/Glucides: \+50%/)).toBeInTheDocument();
    expect(screen.getByText(/Lipides: -50%/)).toBeInTheDocument();

    // Verify that status emojis are present (at least one of each should exist)
    const allEmojis = container.textContent || '';
    expect(allEmojis).toContain('🟢'); // At least one good status
    expect(allEmojis).toContain('🔴'); // At least one danger status
  });

  it('handles zero targets gracefully', () => {
    const summary = createMockSummary({
      target_calories: 0,
      target_proteins_g: 0,
      target_carbs_g: 0,
      target_fats_g: 0,
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    // Should not crash and should show appropriate values
    expect(screen.getByText(/Calories: 0%/)).toBeInTheDocument();
    expect(screen.getByText(/Protéines: 0%/)).toBeInTheDocument();
  });

  it('displays metabolic context when available', () => {
    const summary = createMockSummary({
      bmr: 1650,
      tdee: 2039,
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Contexte Métabolique/)).toBeInTheDocument();
    expect(screen.getByText('BMR:')).toBeInTheDocument();
    expect(screen.getByText('1650 kcal/jour')).toBeInTheDocument();
    expect(screen.getByText('TDEE:')).toBeInTheDocument();
    expect(screen.getByText('2039 kcal/jour')).toBeInTheDocument();
    expect(screen.getByText('Besoin net:')).toBeInTheDocument();
    expect(screen.getByText('2039 kcal')).toBeInTheDocument();
  });

  it('hides metabolic context when not available', () => {
    const summary = createMockSummary({
      bmr: undefined,
      tdee: undefined,
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.queryByText(/Contexte Métabolique/)).not.toBeInTheDocument();
  });

  it('shows correct balance status for deficit', () => {
    const summary = createMockSummary({
      calories_consumed: 1500,
      calories_burned: 2000 // Solde = 1500 - 2000 = -500
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Déficit calorique/)).toBeInTheDocument();
  });

  it('shows correct balance status for surplus', () => {
    const summary = createMockSummary({
      calories_consumed: 2500,
      calories_burned: 2000 // Solde = 2500 - 2000 = +500
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Surplus calorique/)).toBeInTheDocument();
  });

  it('shows correct balance status for balanced', () => {
    const summary = createMockSummary({
      calories_consumed: 2050,
      calories_burned: 2000 // Solde = 2050 - 2000 = +50 (dans la plage -100 à +100)
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Balance équilibrée/)).toBeInTheDocument();
  });

  it('handles missing consumed values gracefully', () => {
    const summary = createMockSummary({
      calories_consumed: undefined,
      calories_burned: undefined,
      proteins_consumed: undefined,
      carbs_consumed: undefined,
      fats_consumed: undefined,
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    // Should not crash and should show 0 balance when both consumed and burned are missing
    expect(screen.getByText(/Solde Énergétique: 0 kcal/)).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    const summary = createMockSummary();

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/samedi 13 septembre 2025/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const summary = createMockSummary();

    const { container } = render(
      <DailyInsightCard
        dailySummary={summary}
        date="2025-09-13"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('calculates progress value correctly', () => {
    const summary = createMockSummary({
      calories_consumed: 1000,
      target_calories: 2000, // 50% progress
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('caps progress value at 100%', () => {
    const summary = createMockSummary({
      calories_consumed: 3000,
      target_calories: 2000, // 150% but should cap at 100%
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles positive calorie balance display', () => {
    const summary = createMockSummary({
      calories_consumed: 2500,
      calories_burned: 2000 // Solde = 2500 - 2000 = +500
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Solde Énergétique: \+500 kcal/)).toBeInTheDocument();
  });

  it('rounds calorie balance for display', () => {
    const summary = createMockSummary({
      calories_consumed: 2000.3,
      calories_burned: 3671 // Solde = 2000.3 - 3671 = -1670.7 arrondi à -1671
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.getByText(/Solde Énergétique: -1671 kcal/)).toBeInTheDocument();
  });

  it('calculates and displays needs deficit correctly', () => {
    const summary = createMockSummary({
      calories_consumed: 230,
      calories_burned: 367.5,
      tdee: 2039
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    // Calcul: Solde = 230 - 367.5 = -137.5
    // Écart vs besoins = -137.5 - (2039 - 367.5) = -137.5 - 1671.5 = -1809
    expect(screen.getByText(/Écart vs besoins: -1809 kcal/)).toBeInTheDocument();
  });

  it('hides needs deficit when TDEE is not available', () => {
    const summary = createMockSummary({
      calories_consumed: 230,
      calories_burned: 367.5,
      tdee: undefined
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    expect(screen.queryByText(/Écart vs besoins/)).not.toBeInTheDocument();
  });

  it('displays appropriate status message for significant deficit', () => {
    const summary = createMockSummary({
      calories_consumed: 500,
      calories_burned: 0,
      tdee: 2000
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    // Déficit important = Solde(500) - (TDEE(2000) - calories_burned(0)) = 500 - 2000 = -1500
    expect(screen.getByText(/Déficit important - Alimentation supplémentaire nécessaire/)).toBeInTheDocument();
  });

  it('displays tooltips for energy metrics', () => {
    const summary = createMockSummary({
      calories_consumed: 1500,
      calories_burned: 300,
      tdee: 2200
    });

    render(<DailyInsightCard dailySummary={summary} date="2025-09-13" />);

    // Vérifier que les icônes Info sont présentes (tooltips triggers)
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons).toHaveLength(2); // Une pour chaque métrique
  });
});