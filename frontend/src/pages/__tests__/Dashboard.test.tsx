import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Index from '../Index';
import { vi } from 'vitest';
vi.mock('@/components/AppSidebar', () => ({ AppSidebar: () => <div /> }));
vi.mock('@/components/BottomNav', () => ({ BottomNav: () => <div /> }));

vi.mock('@/api/nutriflow', () => ({
  getUserProfile: vi.fn(async () => ({
    poids_kg: 70,
    taille_cm: 175,
    age: 30,
    sexe: 'male',
    goal: 'perte',
    tdee_base: 1600,
    tdee: 2200,
  })),
  getDailySummary: vi.fn(async () => ({
    date: '2024-01-01',
    calories_apportees: 500,
    calories_brulees: 0,
    tdee: 2200,
    balance_calorique: 0,
    conseil: 'ok',
    target_calories: 2000,
    target_proteins_g: 150,
    target_carbs_g: 180,
    target_fats_g: 70,
  })),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeAll(() => {
    window.matchMedia = window.matchMedia || function () {
      return {
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      } as any;
    };
  });

  it('affiche objectif, calories restantes et popover accessible', async () => {
    renderWithClient(<Index />);

    expect(await screen.findByText(/Objectif : Perte de poids/i)).toBeInTheDocument();
    expect(screen.getByText(/Il vous reste 1500 kcal/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /explications/i });
    btn.focus();
    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
    fireEvent.click(btn);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
