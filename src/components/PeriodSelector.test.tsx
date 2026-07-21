import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodSelector } from './PeriodSelector';

describe('PeriodSelector', () => {
  it('renders every period as a tab', () => {
    render(<PeriodSelector value="daily" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Daily' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Monthly' })).toBeInTheDocument();
  });

  it('marks the active period selected', () => {
    render(<PeriodSelector value="weekly" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Weekly' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Daily' })).toHaveAttribute('aria-selected', 'false');
  });

  it('fires onChange with the clicked period', () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="daily" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Monthly' }));
    expect(onChange).toHaveBeenCalledWith('monthly');
  });
});
