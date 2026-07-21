import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('uses theme tokens, not hardcoded colors, so it stays visible in light theme', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/PeriodSelector.module.css'), 'utf8');
    // Regression: hardcoded white (rgba(255,255,255,…) / #fff) rendered white text
    // on the light theme's white background — visible but tappable = invisible.
    expect(css).not.toMatch(/rgba\(\s*255\s*,\s*255\s*,\s*255/);
    expect(css).not.toMatch(/#fff\b/i);
    // Surfaces + text must derive from theme-aware tokens so they flip light/dark.
    expect(css).toMatch(/var\(--color-text\)/);
    expect(css).toMatch(/var\(--color-muted\)/);
  });
});
