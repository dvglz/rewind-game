import { render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { HomeScreen } from './HomeScreen';
import { AuthProvider } from '../context/AuthContext';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

test('renders the home screen core actions without the theme switcher', () => {
  render(
    <AuthProvider>
    <HomeScreen
      onPlay={() => {}}
      hasInProgressGame={false}
      hasCompletedGame={false}
      onViewResults={() => {}}
      onLeaderboard={() => {}}
      showDebugTools={false}
      onGroups={() => {}}
      onNavigateAuth={() => {}}
      onSignOut={() => {}}
      onHowTo={() => {}}
    />
    </AuthProvider>
  );

  expect(screen.getByRole('button', { name: 'Start' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Menu' })).not.toBeNull();
  expect(screen.queryByRole('button', { name: 'Debug' })).toBeNull();
  expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull();
});

test('shows only see results when todays game is already completed', () => {
  render(
    <AuthProvider>
    <HomeScreen
      onPlay={() => {}}
      hasInProgressGame={false}
      hasCompletedGame={true}
      onViewResults={() => {}}
      onLeaderboard={() => {}}
      showDebugTools={false}
      onGroups={() => {}}
      onNavigateAuth={() => {}}
      onSignOut={() => {}}
      onHowTo={() => {}}
    />
    </AuthProvider>
  );

  expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  expect(screen.getByRole('button', { name: 'See Results' })).not.toBeNull();
});

test('shows the active puzzle date instead of the local device date', () => {
  window.history.replaceState({}, '', '/?date=2026-06-15');

  render(
    <AuthProvider>
      <HomeScreen
        onPlay={() => {}}
        hasInProgressGame={false}
        hasCompletedGame={false}
        onViewResults={() => {}}
        onLeaderboard={() => {}}
        showDebugTools={false}
        onGroups={() => {}}
        onNavigateAuth={() => {}}
        onSignOut={() => {}}
        onHowTo={() => {}}
      />
    </AuthProvider>
  );

  expect(screen.getByText('Monday, June 15, 2026')).not.toBeNull();
});
