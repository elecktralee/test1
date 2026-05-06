import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { adminApi } from "../../utils/api";
import IGTResultsScreen from "../study/IGTResultsScreen";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SummaryRow {
  participant_id: string;
  created_at: string;
  total_trials: number;
  final_balance: number;
  count_advantageous: number;
  count_disadvantageous: number;
  net_total: number;
  net1: number; net2: number; net3: number; net4: number; net5: number;
  igt_group: number;
}

interface TrialRow {
  trial_number: number;
  deck_chosen: "A" | "B" | "C" | "D";
  gain: number;
  loss: number;
  net_gain: number;
  running_total: number;
  response_time_ms: number;
  advantageous?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const netColor = (v: number) =>
  v > 0 ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-slate-400";

function NetChip({ v }: { v: number }) {
  return (
    <span
      className={`text-xs font-black px-2 py-0.5 rounded-full ${
        v > 0
          ? "bg-emerald-100 text-emerald-700"
          : v < 0
          ? "bg-red-100 text-red-600"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {v > 0 ? `+${v}` : v}
    </span>
  );
}

// Map raw trial rows from server → add `advantageous` flag derived from deck
function normaliseTrial(t: TrialRow): TrialRow {
  return {
    ...t,
    advantageous: t.deck_chosen === "C" || t.deck_chosen === "D",
  };
}

// Build a TSV with all participants' trials combined
function buildAllTSV(allTrials: { participantId: string; userLabel: string; trials: TrialRow[] }[]): string {
  const BLOCK = 20;
  const header = [
    "usuario", "participant_id", "bloco", "tentativa", "tentativa_global",
    "baralho", "TR_ms", "ganho", "taxa", "liquido", "saldo", "vantajoso",
  ].join("\t");
  const rows: string[] = [];
  for (const { participantId, userLabel, trials } of allTrials) {
    for (const t of trials) {
      const block = Math.ceil(t.trial_number / BLOCK);
      const within = ((t.trial_number - 1) % BLOCK) + 1;
      rows.push([
        userLabel, participantId, block, within, t.trial_number,
        t.deck_chosen, t.response_time_ms,
        t.gain, t.loss, t.net_gain, t.running_total,
        (t.deck_chosen === "C" || t.deck_chosen === "D") ? 1 : 0,
      ].join("\t"));
    }
  }
  return [header, ...rows].join("\n");
}

// ── ParticipantCard ────────────────────────────────────────────────────────────
function ParticipantCard({
  row,
  userLabel,
  onView,
}: {
  row: SummaryRow;
  userLabel: string;
  onView: () => void;
}) {
  const igtScore = row.net_total;
  const balanceGain = row.final_balance - 2000;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
      {/* Row 1: label + date + button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg">
              {userLabel}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                igtScore > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : igtScore < 0
                  ? "bg-red-100 text-red-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              Escore IGT: {igtScore > 0 ? `+${igtScore}` : igtScore}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {fmtDate(row.created_at)} · Grupo {(row.igt_group ?? 0) + 1} · {row.total_trials} tentativas
          </p>
        </div>
        <button
          onClick={onView}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          📊 Ver Output
        </button>
      </div>

      {/* Row 2: key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-1">Saldo Final</p>
          <p className={`font-black text-sm ${row.final_balance >= 2000 ? "text-emerald-600" : "text-red-500"}`}>
            {fmtBRL(row.final_balance)}
          </p>
          <p className={`text-[10px] font-semibold ${balanceGain >= 0 ? "text-emerald-500" : "text-red-400"}`}>
            {balanceGain >= 0 ? `+R$${balanceGain}` : `-R$${Math.abs(balanceGain)}`}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-1">Vantajosos</p>
          <p className="font-black text-sm text-emerald-600">{row.count_advantageous}</p>
          <p className="text-[10px] text-slate-400">{Math.round(row.count_advantageous / row.total_trials * 100)}%</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-1">Desvantajosos</p>
          <p className="font-black text-sm text-red-500">{row.count_disadvantageous}</p>
          <p className="text-[10px] text-slate-400">{Math.round(row.count_disadvantageous / row.total_trials * 100)}%</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-1">NET Total</p>
          <p className={`font-black text-sm ${netColor(igtScore)}`}>
            {igtScore > 0 ? `+${igtScore}` : igtScore}
          </p>
          <p className="text-[10px] text-slate-400">(C+D)−(A+B)</p>
        </div>
      </div>

      {/* Row 3: block scores */}
      <div>
        <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-2">
          Escore por Bloco (×20)
        </p>
        <div className="flex gap-2 flex-wrap">
          {[row.net1, row.net2, row.net3, row.net4, row.net5].map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-slate-400 text-[9px] font-semibold">B{i + 1}</span>
              <NetChip v={v} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── IGTAdminPage ───────────────────────────────────────────────────────────────
export default function IGTAdminPage() {
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail view state
  const [selected, setSelected] = useState<SummaryRow | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [trials, setTrials] = useState<TrialRow[]>([]);
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [trialError, setTrialError] = useState("");

  // Export all state
  const [exportingAll, setExportingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.igtSummary() as SummaryRow[];
      // Sort by date desc for display (most recent first)
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSummaries(data);
    } catch (e: any) {
      setError("Erro ao carregar resumos: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build sequential user labels based on chronological (ASC) order of entry
  const userLabelMap = useMemo<Record<string, string>>(() => {
    const sorted = [...summaries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const map: Record<string, string> = {};
    sorted.forEach((row, i) => {
      map[row.participant_id] = `Usuário ${i + 1}`;
    });
    return map;
  }, [summaries]);

  const handleView = async (row: SummaryRow) => {
    setSelected(row);
    setSelectedLabel(userLabelMap[row.participant_id] ?? "—");
    setTrials([]);
    setTrialError("");
    setLoadingTrials(true);
    try {
      const raw = await adminApi.igtTrials(row.participant_id) as TrialRow[];
      const sorted = raw
        .map(normaliseTrial)
        .sort((a, b) => a.trial_number - b.trial_number);
      setTrials(sorted);
    } catch (e: any) {
      setTrialError("Erro ao carregar tentativas: " + e.message);
    } finally {
      setLoadingTrials(false);
    }
  };

  const handleBack = () => {
    setSelected(null);
    setTrials([]);
    setTrialError("");
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const allData: { participantId: string; userLabel: string; trials: TrialRow[] }[] = [];
      for (const s of summaries) {
        const raw = await adminApi.igtTrials(s.participant_id) as TrialRow[];
        const sorted = raw.sort((a, b) => a.trial_number - b.trial_number);
        allData.push({
          participantId: s.participant_id,
          userLabel: userLabelMap[s.participant_id] ?? s.participant_id,
          trials: sorted,
        });
      }
      const tsv = buildAllTSV(allData);
      const blob = new Blob([tsv], { type: "text/tab-separated-values" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IGT_all_${Date.now()}.tsv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Erro ao exportar: " + e.message);
    } finally {
      setExportingAll(false);
    }
  };

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <AdminLayout>
        {/* Back header */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
          >
            ← Voltar à Lista
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg">
              {selectedLabel}
            </span>
            <span className="text-slate-400 text-xs">{fmtDate(selected.created_at)}</span>
          </div>
        </div>

        {loadingTrials ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Carregando tentativas…</p>
          </div>
        ) : trialError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-sm">
            {trialError}
          </div>
        ) : (
          <IGTResultsScreen
            trials={trials}
            finalBalance={selected.final_balance}
            group={selected.igt_group ?? 0}
            onComplete={handleBack}
            completeLabel="← Voltar à Lista"
          />
        )}
      </AdminLayout>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">IGT — Visualizador de Dados</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Output completo por participante · mesma interface do teste
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              🔄 Atualizar
            </button>
            {summaries.length > 0 && (
              <button
                onClick={handleExportAll}
                disabled={exportingAll}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {exportingAll ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exportando…
                  </>
                ) : (
                  <>💾 Exportar Todos (TSV)</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Carregando participantes…</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-3">🃏</span>
            <p className="text-slate-500 font-medium">
              Nenhum participante completou o IGT ainda.
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Os dados aparecerão aqui após a conclusão do teste.
            </p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap text-sm">
              <span className="font-bold text-indigo-800">
                {summaries.length} participante{summaries.length !== 1 ? "s" : ""} com IGT completo
              </span>
              <span className="text-indigo-600">
                Escore médio:{" "}
                <strong>
                  {(() => {
                    const avg = summaries.reduce((s, r) => s + r.net_total, 0) / summaries.length;
                    return avg > 0 ? `+${avg.toFixed(1)}` : avg.toFixed(1);
                  })()}
                </strong>
              </span>
              <span className="text-indigo-600">
                Saldo médio final:{" "}
                <strong>
                  {fmtBRL(summaries.reduce((s, r) => s + r.final_balance, 0) / summaries.length)}
                </strong>
              </span>
            </div>

            {/* Participant cards */}
            <div className="grid grid-cols-1 gap-4">
              {summaries.map((row) => (
                <ParticipantCard
                  key={row.participant_id}
                  row={row}
                  userLabel={userLabelMap[row.participant_id] ?? "—"}
                  onView={() => handleView(row)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}