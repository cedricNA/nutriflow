import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Historique from '../Historique';
import type { DailySummary } from '@/services/api';

// Mock des hooks et dépendances
vi.mock('@/hooks/use-daily-summary', () => ({
  useDailySummary: vi.fn(() => ({
    data: {
      calories_consumed: 1500,
      target_calories: 2200,
      calorie_balance: -700,
      proteins_consumed: 80,
      target_proteins_g: 110,
      carbs_consumed: 180,
      target_carbs_g: 250,
      fats_consumed: 50,
      target_fats_g: 75,
      bmr: 1650,
      tdee: 2200,
      goal_feedback: "Bon déficit pour une perte de poids saine",
    } as DailySummary
  }))
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: [] }))
  };
});

vi.mock('@/components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>
}));

vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav">Bottom Nav</div>
}));

describe('Historique Page Integration', () => {
  const createQueryClient = () => new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  it('renders Historique page with DailyInsightCard integration', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Historique />
      </QueryClientProvider>
    );

    // Vérifier que la page se rend
    expect(screen.getByText('Historique quotidien')).toBeInTheDocument();

    // Vérifier que le DailyInsightCard est rendu avec les bonnes données
    expect(screen.getByText(/Bilan Quotidien/)).toBeInTheDocument();
    expect(screen.getByText(/Balance Calorique: -700 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/Déficit calorique/)).toBeInTheDocument();

    // Vérifier les écarts macros
    expect(screen.getByText(/Calories: -32%/)).toBeInTheDocument();
    expect(screen.getByText(/Protéines: -27%/)).toBeInTheDocument();
    expect(screen.getByText(/Glucides: -28%/)).toBeInTheDocument();
    expect(screen.getByText(/Lipides: -33%/)).toBeInTheDocument();

    // Vérifier le contexte métabolique
    expect(screen.getByText(/Contexte Métabolique/)).toBeInTheDocument();
    expect(screen.getByText('BMR:')).toBeInTheDocument();
    expect(screen.getByText('1650 kcal/jour')).toBeInTheDocument();
    expect(screen.getByText('TDEE:')).toBeInTheDocument();
    expect(screen.getByText('2200 kcal/jour')).toBeInTheDocument();

    // Vérifier le goal feedback
    expect(screen.getByText('Bon déficit pour une perte de poids saine')).toBeInTheDocument();
  });

  it('handles missing summary data gracefully', async () => {
    const queryClient = createQueryClient();

    // Import le hook pour pouvoir le mocker
    const { useDailySummary } = await import('@/hooks/use-daily-summary');

    // Mock sans données summary
    vi.mocked(useDailySummary).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Historique />
      </QueryClientProvider>
    );

    // Vérifier que la page se rend toujours
    expect(screen.getByText('Historique quotidien')).toBeInTheDocument();

    // Le DailyInsightCard ne devrait pas être rendu
    expect(screen.queryByText(/Bilan Quotidien/)).not.toBeInTheDocument();
  });
});