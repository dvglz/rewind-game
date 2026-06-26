import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ setUser: vi.fn() }),
}));

vi.mock('../hooks/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({ containerRef: { current: null } }),
}));

test('wordmark navigates home via onBack', () => {
  const onBack = vi.fn();

  render(
    <AuthScreen
      onBack={onBack}
      onSuccess={() => {}}
      returnTo={null}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'REWIND' }));

  expect(onBack).toHaveBeenCalledTimes(1);
});

test('shows the ClutchPoints iOS app link when requested', () => {
  render(
    <AuthScreen
      onBack={() => {}}
      onSuccess={() => {}}
      returnTo="results"
      showAppDownloadLink
    />
  );

  const link = screen.getByRole('link', { name: 'Download ClutchPoints for iOS' });

  expect(screen.getByText(/Want to play in the app/i)).toBeTruthy();
  expect(link.getAttribute('href')).toBe('https://apps.apple.com/us/app/clutchpoints-nba-nfl-mlb/id1044413150');
});
