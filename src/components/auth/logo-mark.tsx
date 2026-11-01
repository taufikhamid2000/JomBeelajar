/**
 * JomBeelajar mark: an open book (learning) with a spark rising from the
 * spine (progress). Deep green tile, white pages, amber spark. Keep the
 * geometry in sync with src/app/icon.svg.
 */
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#0f766e" />
      <path
        d="M16 12.5c-2-1.6-4.6-2.2-7.5-2v11.2c2.9-.2 5.5.4 7.5 2 2-1.6 4.6-2.2 7.5-2V10.5c-2.9-.2-5.5.4-7.5 2Z"
        fill="#ffffff"
      />
      <path d="M16 12.5v11.2" stroke="#0f766e" strokeWidth="1.4" />
      <path
        d="M16 3.8l1.3 2.9 2.9 1.3-2.9 1.3L16 12.2l-1.3-2.9L11.8 8l2.9-1.3L16 3.8Z"
        fill="#fcd34d"
      />
    </svg>
  );
}
