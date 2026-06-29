import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="niat-loadbar-fill absolute inset-y-0 left-0 w-2/5 rounded-full bg-blue-600" />
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
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Gauge size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight text-gray-900">NIAT SPI</span>
      </div>
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
