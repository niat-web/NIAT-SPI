"use client";

import { useEffect, useState } from "react";
import { Database, Table2, ChevronRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Dataset { id: string; location: string }
interface Tbl { id: string; type: string; rows?: string }
interface Preview { fields: string[]; rows: (string | null)[][]; totalRows: string }

export default function BigQueryExplorer() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dsLoading, setDsLoading] = useState(true);
  const [dsErr, setDsErr] = useState<string | null>(null);

  const [dataset, setDataset] = useState<string | null>(null);
  const [tables, setTables] = useState<Tbl[]>([]);
  const [tblLoading, setTblLoading] = useState(false);

  const [table, setTable] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pvLoading, setPvLoading] = useState(false);
  const [pvErr, setPvErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bigquery/datasets")
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error || "Failed"); return r.json(); })
      .then(setDatasets).catch((e) => setDsErr(e.message)).finally(() => setDsLoading(false));
  }, []);

  function openDataset(id: string) {
    setDataset(id); setTable(null); setPreview(null); setTables([]); setTblLoading(true);
    fetch(`/api/bigquery/tables?dataset=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : [])).then(setTables).finally(() => setTblLoading(false));
  }

  function openTable(id: string) {
    if (!dataset) return;
    setTable(id); setPreview(null); setPvErr(null); setPvLoading(true);
    fetch(`/api/bigquery/preview?dataset=${encodeURIComponent(dataset)}&table=${encodeURIComponent(id)}&limit=50`)
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error || "Failed"); return r.json(); })
      .then(setPreview).catch((e) => setPvErr(e.message)).finally(() => setPvLoading(false));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_260px_1fr] gap-4">
      {/* Datasets */}
      <Panel title="Datasets" icon={<Database size={14} />}>
        {dsLoading ? <ListSkeleton />
          : dsErr ? <ErrBox text={dsErr} />
          : datasets.map((d) => (
            <Row key={d.id} active={dataset === d.id} onClick={() => openDataset(d.id)}
              label={d.id} sub={d.location} />
          ))}
        {!dsLoading && !dsErr && datasets.length === 0 && <Empty text="No datasets accessible." />}
      </Panel>

      {/* Tables */}
      <Panel title="Tables" icon={<Table2 size={14} />}>
        {!dataset ? <Empty text="Select a dataset." />
          : tblLoading ? <ListSkeleton />
          : tables.map((t) => (
            <Row key={t.id} active={table === t.id} onClick={() => openTable(t.id)}
              label={t.id} sub={t.rows ? `${Number(t.rows).toLocaleString()} rows` : t.type} />
          ))}
        {dataset && !tblLoading && tables.length === 0 && <Empty text="No tables." />}
      </Panel>

      {/* Preview */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[300px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {table ? <>{dataset}.<span className="text-blue-600">{table}</span></> : "Table preview"}
          </p>
          {table && (
            <button onClick={() => openTable(table)} className="text-gray-400 hover:text-blue-600" title="Reload">
              <RefreshCw size={14} />
            </button>
          )}
        </div>
        <div className="p-2">
          {!table ? <Empty text="Select a table to preview its rows." big />
            : pvLoading ? <div className="p-3 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
            : pvErr ? <ErrBox text={pvErr} />
            : preview && (
              <>
                <div className="overflow-auto scrollbar-thin max-h-[60vh] rounded-lg border border-gray-100">
                  <table className="text-xs whitespace-nowrap">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold text-gray-400 border-b border-gray-100">#</th>
                        {preview.fields.map((f) => (
                          <th key={f} className="px-3 py-2 text-left font-semibold text-gray-500 border-b border-gray-100">{f}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-300 border-b border-gray-50">{ri + 1}</td>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-1.5 text-gray-700 border-b border-gray-50 max-w-[260px] truncate" title={cell ?? ""}>
                              {cell ?? <span className="text-gray-300">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-400 px-2 pt-2">
                  Showing {preview.rows.length} of {Number(preview.totalRows).toLocaleString()} rows · preview is free (no query cost)
                </p>
              </>
            )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 text-gray-400 text-[11px] font-semibold uppercase tracking-widest">
        {icon} {title}
      </div>
      <div className="p-1.5 max-h-[60vh] overflow-y-auto scrollbar-thin">{children}</div>
    </div>
  );
}
function Row({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button onClick={onClick}
      className={cn("w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
        active ? "bg-blue-50 text-blue-800" : "hover:bg-gray-50 text-gray-700")}>
      <span className="min-w-0">
        <span className="block text-sm font-medium truncate">{label}</span>
        {sub && <span className="block text-[11px] text-gray-400 truncate">{sub}</span>}
      </span>
      <ChevronRight size={14} className={cn("shrink-0", active ? "text-blue-500" : "text-gray-300")} />
    </button>
  );
}
function ListSkeleton() { return <div className="space-y-1.5 p-1">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}</div>; }
function Empty({ text, big }: { text: string; big?: boolean }) { return <div className={cn("text-sm text-gray-400 flex items-center justify-center", big ? "h-64" : "py-6 px-3 text-center")}>{text}</div>; }
function ErrBox({ text }: { text: string }) {
  return <div className="m-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{text}</div>;
}
