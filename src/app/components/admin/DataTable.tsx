import React, { useState, useMemo } from "react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchKeys?: string[];
}

export function DataTable({
  data,
  columns,
  title,
  loading = false,
  emptyMessage = "Nenhum dado encontrado",
  searchable = true,
  searchKeys,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    const keys = searchKeys || columns.map(c => c.key);
    return data.filter(row =>
      keys.some(k => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, columns, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = () => {
    const header = columns.map(c => c.label).join(",");
    const rows = sorted.map(row =>
      columns.map(c => {
        const v = row[c.key];
        if (v === null || v === undefined) return "";
        if (typeof v === "object") return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "dados"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
          <p className="text-sm text-slate-500">{sorted.length} registro{sorted.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {searchable && (
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
            />
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            ⬇ CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full mr-2" />
            Carregando...
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16 text-slate-400">{emptyMessage}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap ${
                      col.sortable !== false ? "cursor-pointer hover:text-slate-900 select-none" : ""
                    }`}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1 text-indigo-500">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-slate-700 whitespace-nowrap max-w-xs truncate">
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] === null || row[col.key] === undefined
                        ? <span className="text-slate-300">—</span>
                        : typeof row[col.key] === "object"
                        ? <span className="font-mono text-xs text-slate-400">[JSON]</span>
                        : String(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
