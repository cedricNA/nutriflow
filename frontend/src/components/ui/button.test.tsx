import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { describe, it, expect } from 'vitest';

describe('Button', () => {
  it('affiche le texte fourni', () => {
    render(<Button>Cliquer</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Cliquer');
  });
});
