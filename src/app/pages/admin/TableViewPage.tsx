import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { DataTable } from "../../components/admin/DataTable";
import { adminApi } from "../../utils/api";
import { storage, STORAGE_KEYS } from "../../utils/storage";

type Dataset =
  | "participants"
  | "sociodemografico"
  | "css33"
  | "bai"
  | "gse"
  | "igt-summary"
  | "igt-trials";

interface TableViewPageProps {
  dataset: Dataset;
}

const CONFIGS: Record<Dataset, {
  title: string;
  fetchFn: () => Promise<any[]>;
  columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }[];
}> = {
  participants: {
    title: "Participantes",
    fetchFn: () => adminApi.participants(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "created_at", label: "Data", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "status", label: "Status", render: (v) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {v === "completed" ? "Concluído" : "Em progresso"}
        </span>
      )},
      { key: "duration_minutes", label: "Duração (min)", render: (v) => v != null ? `${Number(v).toFixed(1)} min` : "—" },
      { key: "device_type", label: "Dispositivo" },
      { key: "browser", label: "Navegador" },
      { key: "os", label: "SO" },
      { key: "country", label: "País" },
      { key: "state", label: "Estado" },
      { key: "city", label: "Cidade" },
      { key: "igt_group", label: "Grupo IGT" },
      { key: "session_start", label: "Início", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "session_end", label: "Fim", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
    ],
  },

  sociodemografico: {
    title: "Dados Sociodemográficos",
    fetchFn: () => adminApi.sociodemographic(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "created_at", label: "Data", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "age", label: "Idade" },
      { key: "gender", label: "Gênero" },
      { key: "education", label: "Escolaridade" },
      { key: "occupation", label: "Ocupação" },
      { key: "marital_status", label: "Estado Civil" },
      { key: "monthly_income", label: "Renda" },
      { key: "internet_hours", label: "Horas/dia Internet" },
      { key: "chronic_condition", label: "Condição Crônica" },
      { key: "psychiatric_diagnosis", label: "Diagnóstico Ansiedade" },
      { key: "medications", label: "Medicação" },
      { key: "health_search_frequency", label: "Freq. Busca Saúde" },
      { key: "healthcare_access", label: "Acesso à Saúde" },
    ],
  },

  css33: {
    title: "CSS-33 — Respostas",
    fetchFn: () => adminApi.css33(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "created_at", label: "Data", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "total_score", label: "Escore Total", render: (v) => <span className="font-bold text-indigo-700">{v}</span> },
      { key: "score_compulsion", label: "Compulsão" },
      { key: "score_distress", label: "Sofrimento" },
      { key: "score_excess", label: "Excessividade" },
      { key: "score_reassurance", label: "Reassurance" },
      { key: "score_distrust", label: "Desconfiança" },
      ...Array.from({ length: 33 }, (_, i) => ({
        key: `responses`,
        label: `Item ${i + 1}`,
        render: (_v: any, row: any) => row.responses?.[`item_${i + 1}`] ?? "—",
      })).map((col, i) => ({ ...col, key: `item_${i + 1}` })),
    ],
  },

  bai: {
    title: "BAI — Respostas",
    fetchFn: () => adminApi.bai(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "created_at", label: "Data", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      {
        key: "total_score", label: "Escore Total",
        render: (v) => {
          const score = Number(v);
          const level = score <= 10 ? "Mínimo" : score <= 19 ? "Leve" : score <= 30 ? "Moderado" : "Grave";
          const color = score <= 10 ? "bg-green-100 text-green-700" : score <= 19 ? "bg-yellow-100 text-yellow-700" : score <= 30 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700";
          return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{score} ({level})</span>;
        }
      },
      ...Array.from({ length: 21 }, (_, i) => ({
        key: `item_${i + 1}`,
        label: `Item ${i + 1}`,
        render: (_v: any, row: any) => row.responses?.[`item_${i + 1}`] ?? "—",
      })),
    ],
  },

  gse: {
    title: "GSE — Respostas",
    fetchFn: () => adminApi.gse(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "created_at", label: "Data", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "total_score", label: "Escore Total", render: (v) => <span className="font-bold text-emerald-700">{v}</span> },
      ...Array.from({ length: 10 }, (_, i) => ({
        key: `item_${i + 1}`,
        label: `Item ${i + 1}`,
        render: (_v: any, row: any) => row.responses?.[`item_${i + 1}`] ?? "—",
      })),
    ],
  },

  "igt-summary": {
    title: "IGT — Resumo",
    fetchFn: () => adminApi.igtSummary(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "created_at", label: "Data", render: (v) => v ? new Date(v).toLocaleString("pt-BR") : "—" },
      { key: "total_trials", label: "Tentativas" },
      {
        key: "final_balance", label: "Saldo Final",
        render: (v) => {
          const val = Number(v);
          return <span className={`font-bold ${val >= 2000 ? "text-green-600" : "text-red-600"}`}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)}
          </span>;
        }
      },
      { key: "count_advantageous", label: "N Vantaj. (C+D)" },
      { key: "count_disadvantageous", label: "N Desvantaj. (A+B)" },
      {
        key: "net_total", label: "NET Total",
        render: (v) => <span className={`font-bold ${Number(v) >= 0 ? "text-green-600" : "text-red-500"}`}>{Number(v) >= 0 ? "+" : ""}{v}</span>
      },
      { key: "net1", label: "NET 1–20", render: (v) => <span className={Number(v) >= 0 ? "text-green-600" : "text-red-500"}>{Number(v) >= 0 ? "+" : ""}{v}</span> },
      { key: "net2", label: "NET 21–40", render: (v) => <span className={Number(v) >= 0 ? "text-green-600" : "text-red-500"}>{Number(v) >= 0 ? "+" : ""}{v}</span> },
      { key: "net3", label: "NET 41–60", render: (v) => <span className={Number(v) >= 0 ? "text-green-600" : "text-red-500"}>{Number(v) >= 0 ? "+" : ""}{v}</span> },
      { key: "net4", label: "NET 61–80", render: (v) => <span className={Number(v) >= 0 ? "text-green-600" : "text-red-500"}>{Number(v) >= 0 ? "+" : ""}{v}</span> },
      { key: "net5", label: "NET 81–100", render: (v) => <span className={Number(v) >= 0 ? "text-green-600" : "text-red-500"}>{Number(v) >= 0 ? "+" : ""}{v}</span> },
    ],
  },

  "igt-trials": {
    title: "IGT — Tentativas Individuais",
    fetchFn: () => adminApi.igtTrials(),
    columns: [
      { key: "participant_id", label: "ID", render: (v) => <span className="font-mono text-xs">{String(v).slice(0, 8)}…</span> },
      { key: "trial_number", label: "Tentativa" },
      {
        key: "deck_chosen", label: "Baralho",
        render: (v) => {
          const colors: Record<string, string> = {
            A: "bg-blue-100 text-blue-700",
            B: "bg-blue-100 text-blue-700",
            C: "bg-emerald-100 text-emerald-700",
            D: "bg-emerald-100 text-emerald-700"
          };
          const type = (v === "A" || v === "B") ? "Desv." : "Vant.";
          return <span className={`px-2 py-0.5 rounded font-bold text-xs ${colors[v] || ""}`}>{v} ({type})</span>;
        }
      },
      { key: "gain", label: "Ganho", render: (v) => <span className="text-green-600 font-medium">+R${v}</span> },
      { key: "loss", label: "Perda", render: (v) => Number(v) > 0 ? <span className="text-red-500 font-medium">−R${v}</span> : <span className="text-slate-300">—</span> },
      { key: "net_gain", label: "Líquido", render: (v) => <span className={Number(v) >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{Number(v) >= 0 ? "+" : ""}R${v}</span> },
      { key: "running_total", label: "Saldo", render: (v) => <span className={Number(v) >= 2000 ? "text-green-600" : "text-red-500"}>R${v}</span> },
      { key: "response_time_ms", label: "TR (ms)" },
      { key: "advantageous", label: "Categoria", render: (v) => v ? <span className="text-emerald-600 text-xs font-medium">Vantajoso</span> : <span className="text-red-500 text-xs font-medium">Desvantajoso</span> },
    ],
  },
};

// Flatten CSS-33 responses into individual columns for the table
function flattenData(dataset: Dataset, data: any[]): any[] {
  if (dataset === "css33" || dataset === "bai" || dataset === "gse") {
    return data.map(row => {
      const flat: Record<string, any> = { ...row };
      if (row.responses && typeof row.responses === "object") {
        Object.entries(row.responses).forEach(([k, v]) => { flat[k] = v; });
      }
      return flat;
    });
  }
  return data;
}

export default function TableViewPage({ dataset }: TableViewPageProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const config = CONFIGS[dataset];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await config.fetchFn();
      setData(flattenData(dataset, raw));
    } catch (e: any) {
      setError("Erro ao carregar dados: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [dataset, config]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{config.title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">Base de dados do estudo</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            🔄 Atualizar
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
        )}

        <DataTable
          data={data}
          columns={config.columns}
          title={config.title}
          loading={loading}
          emptyMessage="Nenhum dado encontrado para esta base"
        />
      </div>
    </AdminLayout>
  );
}