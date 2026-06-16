import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toast } from './Toast';
import { ToastRegion, TOAST_REGION_ID } from './ToastRegion';

describe('Toast + ToastRegion', () => {
  it('portals multiple toasts into the single region so they stack', () => {
    render(
      <>
        <ToastRegion />
        <Toast message="You're signed in" />
        <Toast message="Showing your score from earlier today" />
      </>,
    );

    expect(screen.getByText("You're signed in")).not.toBeNull();
    expect(screen.getByText('Showing your score from earlier today')).not.toBeNull();

    const region = document.getElementById(TOAST_REGION_ID)!;
    expect(region.childElementCount).toBe(2);
  });

  it('renders inline when no region is mounted (fallback)', () => {
    render(<Toast message="standalone" />);
    expect(screen.getByText('standalone')).not.toBeNull();
  });
});
