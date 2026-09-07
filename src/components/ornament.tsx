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
      <circle cx="16" cy="8.6" r="6.1" fill="currentColor" />
      <circle cx="9.2" cy="16.1" r="6.1" fill="currentColor" />
      <circle cx="22.8" cy="16.1" r="6.1" fill="currentColor" />
      <path
        fill="currentColor"
        d="M14.7 18.5h2.6v8.8c0 1.1-2.6 1.1-2.6 0Z"
      />
    </svg>
  );
}
