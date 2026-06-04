import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { ThemeSwitch } from './ThemeSwitch';

test('renders system, light, and dark options', () => {
  render(<ThemeSwitch value="system" onChange={() => {}} />);

  expect(screen.getByRole('button', { name: 'system' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'light' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'dark' })).not.toBeNull();
});

test("clicking dark calls onChange with 'dark'", () => {
  const onChange = vi.fn();

  render(<ThemeSwitch value="system" onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: 'dark' }));

  expect(onChange).toHaveBeenCalledWith('dark');
});

test('selected option exposes aria-pressed=true', () => {
  render(<ThemeSwitch value="light" onChange={() => {}} />);

  const lightButton = screen.getByRole('button', { name: 'light' });
  const systemButton = screen.getByRole('button', { name: 'system' });
  const darkButton = screen.getByRole('button', { name: 'dark' });

  expect(lightButton.getAttribute('aria-pressed')).toBe('true');
  expect(systemButton.getAttribute('aria-pressed')).toBe('false');
  expect(darkButton.getAttribute('aria-pressed')).toBe('false');
});
