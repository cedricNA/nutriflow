import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CaloriesProgress } from '../CaloriesProgress';
import type { DailySummary } from '@/api/nutriflow';

describe('CaloriesProgress', () => {
  const createMockSummary = (
    consumed: number = 0,
    goal: number = 2000
  ): DailySummary => ({
    calories_consumed: consumed,
    calories_goal: goal,
  });

  it('renders correctly with basic data', () => {
    const summary = createMockSummary(369, 2039);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    expect(screen.getByText('369 / 2039 cal')).toBeInTheDocument();
    expect(screen.getByText('Calories consommées')).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    const summary = createMockSummary(369, 2039);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    // 369 / 2039 * 100 = 18%
    expect(screen.getByText(/18% de l'objectif/)).toBeInTheDocument();
    expect(screen.getByText(/En bonne voie/)).toBeInTheDocument();
  });

  it('shows good status for consumption below 100%', () => {
    const summary = createMockSummary(800, 2000);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    expect(screen.getByText(/40% de l'objectif/)).toBeInTheDocument();
    expect(screen.getByText(/En bonne voie/)).toBeInTheDocument();
  });

  it('shows warning status for consumption at 100-110%', () => {
    const summary = createMockSummary(2050, 2000);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    expect(screen.getByText(/102% de l'objectif/)).toBeInTheDocument();
    expect(screen.getByText(/Objectif atteint/)).toBeInTheDocument();
  });

  it('shows danger status for consumption above 110%', () => {
    const summary = createMockSummary(2300, 2000);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    expect(screen.getByText(/115% de l'objectif/)).toBeInTheDocument();
    expect(screen.getByText(/Objectif dépassé/)).toBeInTheDocument();
  });

  it('handles zero target gracefully', () => {
    const summary = createMockSummary(500, 0);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    expect(screen.getByText('500 / – cal')).toBeInTheDocument();
    expect(screen.getByText('Objectif calorique non défini')).toBeInTheDocument();
  });

  it('handles negative values gracefully', () => {
    const summary: DailySummary = {
      calories_consumed: -100,
      calories_goal: 2000,
    };
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    // Should normalize negative to 0
    expect(screen.getByText('0 / 2000 cal')).toBeInTheDocument();
    expect(screen.getByText(/0% de l'objectif/)).toBeInTheDocument();
  });

  it('handles undefined values gracefully', () => {
    const summary: DailySummary = {};
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    expect(screen.getByText('0 / – cal')).toBeInTheDocument();
    expect(screen.getByText('Objectif calorique non défini')).toBeInTheDocument();
  });

  it('caps progress bar at 100% even for overconsumption', () => {
    const summary = createMockSummary(3000, 2000);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    // Progress bar should show max 100% but text shows actual percentage
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(/150% de l'objectif/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const summary = createMockSummary(369, 2039);
    
    render(<CaloriesProgress dailySummary={summary} />);
    
    const card = screen.getByLabelText('Progression des calories quotidiennes');
    expect(card).toBeInTheDocument();
    
    const progressBar = screen.getByLabelText('18% de l\'objectif calorique atteint');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const summary = createMockSummary(369, 2039);
    
    render(<CaloriesProgress dailySummary={summary} className="custom-class" />);
    
    const card = screen.getByLabelText('Progression des calories quotidiennes');
    expect(card).toHaveClass('custom-class');
  });

  it('applies correct status colors', () => {
    const goodSummary = createMockSummary(800, 2000);
    const { rerender } = render(<CaloriesProgress dailySummary={goodSummary} />);
    
    let card = screen.getByLabelText('Progression des calories quotidiennes');
    expect(card).toHaveClass('border-success/20', 'from-green-50');
    
    const warningSummary = createMockSummary(2050, 2000);
    rerender(<CaloriesProgress dailySummary={warningSummary} />);
    
    card = screen.getByLabelText('Progression des calories quotidiennes');
    expect(card).toHaveClass('border-warning/20', 'from-orange-50');
    
    const dangerSummary = createMockSummary(2300, 2000);
    rerender(<CaloriesProgress dailySummary={dangerSummary} />);
    
    card = screen.getByLabelText('Progression des calories quotidiennes');
    expect(card).toHaveClass('border-destructive/20', 'from-red-50');
  });
});