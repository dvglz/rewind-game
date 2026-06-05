import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { HomeScreen } from './HomeScreen';

test('renders the home screen core actions without the theme switcher', () => {
  render(<HomeScreen onPlay={() => {}} hasInProgressGame={false} />);

  expect(screen.getByRole('button', { name: 'Start' })).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Debug' })).not.toBeNull();
  expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull();
});
