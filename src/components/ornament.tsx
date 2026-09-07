type OrnamentProps = {
  className?: string;
};

export function Knot({ className }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 80 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M8 12c0-6 8-6 12 0s8 6 12 0 8-6 12 0 8 6 12 0 8-6 12 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12" r="2" fill="currentColor" />
      <circle cx="72" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function ShamrockMark({ className }: OrnamentProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M16 28c0-3 1.2-5.2 3.4-7.2 2.8-2.6 6.6-3.2 6.6-7.3 0-3.2-2.5-5.5-5.6-5.5-1.6 0-3 .6-4.4 1.8C14.6 8.6 13.2 8 11.6 8 8.5 8 6 10.3 6 13.5c0 4.1 3.8 4.7 6.6 7.3C14.8 22.8 16 25 16 28Z"
      />
    </svg>
  );
}
