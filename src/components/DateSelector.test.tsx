import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateSelector } from './DateSelector';

describe('DateSelector label override', () => {
  it('renders explicit label and subLabel when provided', () => {
    render(
      <DateSelector
        dayOffset={0}
        baseDate="2026-07-21"
        label="This Week"
        subLabel="Jul 14 – Jul 20"
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('Jul 14 – Jul 20')).toBeInTheDocument();
  });

  it('still shows Today when no override is given', () => {
    render(<DateSelector dayOffset={0} baseDate="2026-07-21" onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});
