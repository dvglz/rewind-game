import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders a status region with a default "Loading" accessible name', () => {
    render(<LoadingOverlay />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-label')).toBe('Loading');
  });

  it('uses a custom label as both visible text and accessible name', () => {
    render(<LoadingOverlay label="Joining group" />);
    expect(screen.getByRole('status', { name: 'Joining group' })).toBeTruthy();
    expect(screen.getByText('Joining group')).toBeTruthy();
  });
});
