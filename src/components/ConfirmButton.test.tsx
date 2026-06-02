import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ConfirmButton } from './ConfirmButton';

test('renders the lock button directly without an extra layout wrapper', () => {
  render(<ConfirmButton onConfirm={() => {}} />);

  const button = screen.getByRole('button', { name: /lock/i });

  expect(button.parentElement?.tagName).toBe('DIV');
  expect(button.parentElement?.childElementCount).toBe(1);
});
