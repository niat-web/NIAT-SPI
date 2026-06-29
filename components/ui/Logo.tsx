import { cn } from "@/lib/utils";

/**
 * NIAT SPI brand mark.
 *
 * A rounded "badge" in the NIAT orange→amber gradient holding an abstract
 * performance motif: three ascending bars (the Skill Performance Index rising)
 * whose tops trace an upward arrow, with a subtle speedometer arc beneath —
 * tying "index", "performance" and "skill growth" into one mark.
 *
 * Use <LogoMark/> for just the badge, or <Logo/> for badge + wordmark.
 */

export function LogoMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Unique gradient id per render size keeps multiple instances valid.
  const gid = `niat-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="NIAT SPI"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8A1E" />
          <stop offset="1" stopColor="#F25C05" />
        </linearGradient>
      </defs>

      {/* Badge */}
      <rect width="48" height="48" rx="13" fill={`url(#${gid})`} />

      {/* Speedometer arc (the "index" gauge), subtle on the badge */}
      <path
        d="M11 31a13 13 0 0 1 26 0"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Three ascending bars — the SPI rising */}
      <rect x="14" y="27" width="5" height="7" rx="2.5" fill="#fff" />
      <rect x="21.5" y="22" width="5" height="12" rx="2.5" fill="#fff" />
      <rect x="29" y="16" width="5" height="18" rx="2.5" fill="#fff" />

      {/* Upward arrowhead capping the tallest bar — growth */}
      <path
        d="M31.5 16.5l5-5m0 0h-4.2m4.2 0v4.2"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  size = 36,
  showSub = false,
  className,
}: {
  size?: number;
  /** Show the "Skill Performance Index" subline under the wordmark. */
  showSub?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <div className="leading-none">
        <p className="font-extrabold tracking-tight text-gray-900">
          NIAT <span className="text-[#F25C05]">SPI</span>
        </p>
        {showSub && (
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            Skill Performance Index
          </p>
        )}
      </div>
    </div>
  );
}
