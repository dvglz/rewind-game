import type { SVGProps } from 'react';

export function RewindGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M11 6 4 12l7 6V6Z" fill="currentColor" />
      <path d="M20 6 13 12l7 6V6Z" fill="currentColor" />
    </svg>
  );
}
