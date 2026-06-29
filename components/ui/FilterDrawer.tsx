"use client";

import { useEffect, useState } from "react";
import { X, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption { value: string; label: string; count?: number }
export interface FilterGroup {
  key: string;
  label: string;
  mode: "multi" | "single"; // multi = checkboxes, single = radio
  options: FilterOption[];
}
export type FilterValue = Record<string, string[]>;

export function countActive(value: FilterValue): number {
  return Object.values(value).reduce((n, arr) => n + (arr?.length ? 1 : 0), 0);
}

export default function FilterDrawer({
  open, onClose, groups, value, onApply, title = "Filters",
}: {
  open: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  value: FilterValue;
  onApply: (v: FilterValue) => void;
  title?: string;
}) {
  const [draft, setDraft] = useState<FilterValue>(value);

  // Re-sync the working copy each time the drawer opens.
  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  if (!open) return null;

  function toggle(group: FilterGroup, optValue: string) {
    setDraft((d) => {
      const cur = d[group.key] ?? [];
      if (group.mode === "single") {
        return { ...d, [group.key]: cur[0] === optValue ? [] : [optValue] };
      }
      return {
        ...d,
        [group.key]: cur.includes(optValue) ? cur.filter((v) => v !== optValue) : [...cur, optValue],
      };
    });
  }

  const activeInDraft = countActive(draft);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{activeInDraft ? `${activeInDraft} active` : "No filters applied"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-6">
          {groups.length === 0 && <p className="text-sm text-gray-400">No filters available for your scope.</p>}
          {groups.map((g) => {
            const sel = draft[g.key] ?? [];
            return (
              <div key={g.key}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2.5">{g.label}</p>
                <div className="space-y-1.5">
                  {g.options.map((o) => {
                    const on = sel.includes(o.value);
                    return (
                      <button key={o.value} type="button" onClick={() => toggle(g, o.value)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors text-left",
                          on ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300",
                        )}>
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className={cn(
                            "w-4 h-4 rounded flex items-center justify-center shrink-0 border",
                            g.mode === "single" && "rounded-full",
                            on ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300",
                          )}>
                            {on && <Check size={11} strokeWidth={3} />}
                          </span>
                          <span className={cn("truncate", on ? "text-blue-900 font-medium" : "text-gray-700")}>{o.label}</span>
                        </span>
                        {o.count !== undefined && <span className="text-xs text-gray-400 shrink-0">{o.count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3.5 flex items-center gap-2">
          <button onClick={() => setDraft({})}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
            <RotateCcw size={14} /> Clear all
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => { onApply(draft); onClose(); }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Apply filters</button>
        </div>
      </div>
      <style jsx>{`
        .animate-in { animation: slidein .18s ease-out; }
        @keyframes slidein { from { transform: translateX(16px); opacity: .6 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
