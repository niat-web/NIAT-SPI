"use client";

import { Search, SlidersHorizontal, Loader2, X } from "lucide-react";

export interface ActiveChip { key: string; label: string; onRemove: () => void }

export default function FilterBar({
  search, onSearch, placeholder = "Search…", onOpenFilters, activeCount, loading, chips,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  onOpenFilters: () => void;
  activeCount: number;
  loading?: boolean;
  chips?: ActiveChip[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder}
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 animate-spin" />}
        </div>
        <button onClick={onOpenFilters}
          className="relative inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50">
          <SlidersHorizontal size={16} /> Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-bold px-1">{activeCount}</span>
          )}
        </button>
      </div>

      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium pl-2.5 pr-1.5 py-1">
              {c.label}
              <button onClick={c.onRemove} className="rounded-full hover:bg-blue-100 p-0.5"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
