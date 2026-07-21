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

  it('omits the day-computed date line when a period label is active without a subLabel', () => {
    render(
      <DateSelector dayOffset={2} baseDate="2026-07-21" label="2 weeks ago" onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByText('2 weeks ago')).toBeInTheDocument();
    // The day-computed date for offset 2 from 2026-07-21 would be "Jul 19, 2026" — it must NOT render in period mode.
    expect(screen.queryByText(/Jul 19/)).not.toBeInTheDocument();
  });
});
