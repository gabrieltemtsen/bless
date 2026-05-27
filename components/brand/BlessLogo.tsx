import type { SVGProps } from 'react';

/**
 * The "Bless" mark: an abstract bloom — a CRC coin sprouting a chain of petals.
 */
export function BlessLogo({
  width = 28,
  height = 28,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bless"
      role="img"
      {...props}
    >
      <defs>
        <radialGradient id="bless-petal" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFD8A8" />
          <stop offset="60%" stopColor="#F4A07A" />
          <stop offset="100%" stopColor="#DF6552" />
        </radialGradient>
        <linearGradient id="bless-core" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5246C7" />
          <stop offset="100%" stopColor="#38318B" />
        </linearGradient>
      </defs>
      {/* Outer bloom — six petals */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="9"
          rx="5.5"
          ry="8.5"
          fill="url(#bless-petal)"
          opacity="0.92"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      {/* Inner CRC-style core */}
      <circle cx="20" cy="20" r="6.2" fill="url(#bless-core)" />
      <path
        d="M22.7 17.6c-.7-.6-1.7-1-2.7-1-2.3 0-4.1 1.8-4.1 4s1.8 4 4.1 4c1 0 2-.4 2.7-1"
        stroke="#FFD8A8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
