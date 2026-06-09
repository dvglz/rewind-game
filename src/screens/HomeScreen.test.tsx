import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { HomeScreen } from './HomeScreen';

test('renders the home screen core actions without the theme switcher', () => {
  render(
    <HomeScreen
      onPlay={() => {}}
      hasInProgressGame={false}
      hasCompletedGame={false}
      onViewResults={() => {}}
      showDebugTools={false}
      onGroups={() => {}}
    />
  );

  expect(screen.getByRole('button', { name: 'Start' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Menu' })).not.toBeNull();
  expect(screen.queryByRole('button', { name: 'Debug' })).toBeNull();
  expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull();
});

test('shows only see results when todays game is already completed', () => {
  render(
    <HomeScreen
      onPlay={() => {}}
      hasInProgressGame={false}
      hasCompletedGame={true}
      onViewResults={() => {}}
      showDebugTools={false}
      onGroups={() => {}}
    />
  );

  expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  expect(screen.getByRole('button', { name: 'See Results' })).not.toBeNull();
});
