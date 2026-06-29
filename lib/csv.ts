// Minimal client-side CSV export (FEAT-1). No dependencies.

type Cell = string | number | null | undefined;

function escapeCell(v: Cell): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote if it contains comma, quote, or newline; double up inner quotes.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build CSV text from a header row + data rows. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return lines.join("\r\n");
}

/** Build CSV from objects, picking the given keyed columns. */
export function objectsToCsv<T extends Record<string, Cell>>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
): string {
  return toCsv(
    columns.map((c) => c.label),
    rows.map((r) => columns.map((c) => r[c.key])),
  );
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  // Prepend BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
