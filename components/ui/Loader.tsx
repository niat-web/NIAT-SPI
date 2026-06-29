import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

/**
 * Indeterminate loading bar — a blue highlight sweeps across the track twice
 * per second (the `niat-loadbar-fill` keyframe in globals.css runs at 0.5s).
 */
export function LoadingBar({ className }: { className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className={cn("relative h-1.5 w-40 overflow-hidden rounded-full bg-gray-200", className)}
    >
      <div className="niat-loadbar-fill absolute inset-y-0 left-0 w-2/5 rounded-full bg-[#F25C05]" />
    </div>
  );
}

/**
 * Branded full-page loader: NIAT SPI logo + wordmark, with the loading bar
 * underneath. Centered in whatever box it's placed in.
 */
export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[60vh] w-full flex-col items-center justify-center gap-5", className)}>
      <Logo size={44} className="[&_p]:text-lg" />
      <LoadingBar />
    </div>
  );
}

/**
 * Compact centered loader for inside a table / card body while its rows load.
 */
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full items-center justify-center py-12", className)}>
      <LoadingBar />
    </div>
  );
}
