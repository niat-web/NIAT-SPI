import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const pctColor = (pct: number) =>
  pct >= 80 ? "#22c55e" : pct >= 65 ? "#f59e0b" : "#ef4444";

export const pctTextClass = (pct: number) =>
  pct >= 80 ? "text-[#16a34a]" : pct >= 65 ? "text-[#d97706]" : "text-[#dc2626]";

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}
