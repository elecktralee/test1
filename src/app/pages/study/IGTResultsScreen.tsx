import React, { useRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { IGT_INITIAL_BALANCE, type DeckId } from "../../data/igt-config";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface IGTTrial {
  trial_number: number;
  deck_chosen: DeckId;
  gain: number;
  loss: number;
  net_gain: number;
  running_total: number;
  response_time_ms: number;
  advantageous: boolean;
}

interface Props {
  trials: IGTTrial[];
  finalBalance: number;
  group: number;
  onComplete?: () => void;
  completeLabel?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BLOCK_SIZE = 20;
const BLOCKS = 5;

const DECK_COLOR: Record<DeckId, string> = {
  A: "#fca5a5",
  B: "#a5b4fc",
  C: "#6ee7b7",
  D: "#d8b4fe",
};

const DECK_BG: Record<DeckId, string> = {
  A: "rgba(252,165,165,0.12)",
  B: "rgba(165,180,252,0.12)",
  C: "rgba(110,231,183,0.12)",
  D: "rgba(216,180,254,0.12)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(v);

const fmtNet = (v: number) =>
  v >= 0 ? `+R$${v}` : `-R$${Math.abs(v)}`;

interface BlockSummary {
  A: number; B: number; C: number; D: number;
  adv: number; disadv: number;
  score: number;
  blockNet: number;
  endBalance: number;
  avgRT: number;
}

function summariseBlock(block: IGTTrial[]): BlockSummary {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  block.forEach((t) => { counts[t.deck_chosen]++; });
  const adv = counts.C + counts.D;
  const disadv = counts.A + counts.B;
  return {
    ...counts,
    adv,
    disadv,
    score: adv - disadv,
    blockNet: block.reduce((s, t) => s + t.net_gain, 0),
    endBalance: block[block.length - 1]?.running_total ?? IGT_INITIAL_BALANCE,
    avgRT: Math.round(block.reduce((s, t) => s + t.response_time_ms, 0) / block.length),
  };
}

function buildTSV(trials: IGTTrial[]): string {
  const header = [
    "bloco", "tentativa", "tentativa_global",
    "baralho", "TR_ms", "ganho", "taxa", "liquido", "saldo", "vantajoso",
  ].join("\t");
  const rows = trials.map((t) => {
    const block = Math.ceil(t.trial_number / BLOCK_SIZE);
    const withinBlock = ((t.trial_number - 1) % BLOCK_SIZE) + 1;
    return [
      block, withinBlock, t.trial_number,
      t.deck_chosen, t.response_time_ms,
      t.gain, t.loss, t.net_gain, t.running_total,
      t.advantageous ? 1 : 0,
    ].join("\t");
  });
  return [header, ...rows].join("\n");
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreChip({ value }: { value: number }) {
  const pos = value > 0;
  const neu = value === 0;
  return (
    <span
      className="font-black text-sm px-2 py-0.5 rounded-full"
      style={{
        background: pos
          ? "rgba(52,211,153,0.2)"
          : neu
          ? "rgba(148,163,184,0.2)"
          : "rgba(248,113,113,0.2)",
        color: pos ? "#34d399" : neu ? "#94a3b8" : "#f87171",
        border: `1px solid ${
          pos ? "rgba(52,211,153,0.4)" : neu ? "rgba(148,163,184,0.3)" : "rgba(248,113,113,0.4)"
        }`,
      }}
    >
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

function DeckBadge({ deck }: { deck: DeckId }) {
  return (
    <span
      className="font-black text-xs px-1.5 py-0.5 rounded"
      style={{
        color: DECK_COLOR[deck],
        background: DECK_BG[deck],
        border: `1px solid ${DECK_COLOR[deck]}40`,
      }}
    >
      {deck}
    </span>
  );
}

// ── Main ResultsScreen ────────────────────────────────────────────────────────
export default function IGTResultsScreen({ trials, finalBalance, group, onComplete, completeLabel }: Props) {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);

  if (trials.length === 0) {
    return (
      <div className="text-slate-400 text-center py-20">
        Nenhuma tentativa registrada.
      </div>
    );
  }

  const blocks = Array.from({ length: BLOCKS }, (_, i) =>
    trials.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE)
  );
  const blockSummaries = blocks.map(summariseBlock);

  const totalAdv = trials.filter((t) => t.advantageous).length;
  const totalDisadv = trials.length - totalAdv;
  const igtScore = totalAdv - totalDisadv;
  const netGainTotal = finalBalance - IGT_INITIAL_BALANCE;
  const avgRT = Math.round(
    trials.reduce((s, t) => s + t.response_time_ms, 0) / trials.length
  );

  const handleDownloadTSV = () => {
    const tsv = buildTSV(trials);
    const blob = new Blob([tsv], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IGT_grupo${group + 1}_${Date.now()}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="w-full max-w-4xl mx-auto px-2 py-6 space-y-5"
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-800 via-violet-800 to-emerald-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-white font-black text-xl tracking-wide">
              📊 Resultados — Iowa Gambling Task
            </h2>
            <p className="text-white/60 text-xs mt-0.5">
              100 tentativas · Grupo {group + 1} · Bechara et al. (1994)
            </p>
          </div>
          <button
            onClick={handleDownloadTSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors border border-white/20"
          >
            💾 Baixar TSV
          </button>
        </div>

        {/* ── SUMMARY STATS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-700 border-b border-slate-700">
          {[
            {
              label: "Saldo Final",
              value: fmtBRL(finalBalance),
              color: finalBalance >= IGT_INITIAL_BALANCE ? "#34d399" : "#f87171",
            },
            {
              label: "Ganho/Perda Líquido",
              value: fmtNet(netGainTotal),
              color: netGainTotal >= 0 ? "#34d399" : "#f87171",
            },
            {
              label: "Escore IGT",
              value: igtScore > 0 ? `+${igtScore}` : `${igtScore}`,
              sublabel: "(C+D) − (A+B)",
              color: igtScore > 0 ? "#34d399" : igtScore < 0 ? "#f87171" : "#94a3b8",
            },
            {
              label: "TR Médio",
              value: `${avgRT} ms`,
              color: "#94a3b8",
            },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className="font-black text-xl" style={{ color: item.color }}>
                {item.value}
              </p>
              {"sublabel" in item && item.sublabel && (
                <p className="text-slate-600 text-xs mt-0.5">{item.sublabel}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── BLOCK SUMMARY TABLE ───────────────────────────────────────────── */}
        <div className="p-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
            Resumo por Bloco (n=20 por bloco)
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2.5 text-left font-semibold">Bloco</th>
                  <th className="px-3 py-2.5 text-center font-semibold" style={{ color: DECK_COLOR.A }}>A</th>
                  <th className="px-3 py-2.5 text-center font-semibold" style={{ color: DECK_COLOR.B }}>B</th>
                  <th className="px-3 py-2.5 text-center font-semibold" style={{ color: DECK_COLOR.C }}>C</th>
                  <th className="px-3 py-2.5 text-center font-semibold" style={{ color: DECK_COLOR.D }}>D</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-300">Escore</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-300">Líquido</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-300">Saldo Final</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-300">TR Médio</th>
                </tr>
              </thead>
              <tbody>
                {blockSummaries.map((s, bi) => (
                  <tr
                    key={bi}
                    className="border-t border-slate-700/60 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-slate-300 font-semibold">
                      {bi + 1}
                      <span className="text-slate-600 text-xs ml-1.5 font-normal">
                        ({bi * BLOCK_SIZE + 1}–{(bi + 1) * BLOCK_SIZE})
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono" style={{ color: DECK_COLOR.A }}>{s.A}</td>
                    <td className="px-3 py-2.5 text-center font-mono" style={{ color: DECK_COLOR.B }}>{s.B}</td>
                    <td className="px-3 py-2.5 text-center font-mono" style={{ color: DECK_COLOR.C }}>{s.C}</td>
                    <td className="px-3 py-2.5 text-center font-mono" style={{ color: DECK_COLOR.D }}>{s.D}</td>
                    <td className="px-3 py-2.5 text-center">
                      <ScoreChip value={s.score} />
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-bold ${s.blockNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtNet(s.blockNet)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                      {fmtBRL(s.endBalance)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-500 text-xs">
                      {s.avgRT} ms
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t-2 border-slate-600 bg-slate-800/60">
                  <td className="px-3 py-2.5 text-white font-black text-xs uppercase tracking-wider">
                    Total
                  </td>
                  {(["A", "B", "C", "D"] as DeckId[]).map((d) => (
                    <td key={d} className="px-3 py-2.5 text-center font-black" style={{ color: DECK_COLOR[d] }}>
                      {trials.filter((t) => t.deck_chosen === d).length}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center">
                    <ScoreChip value={igtScore} />
                  </td>
                  <td className={`px-3 py-2.5 text-right font-black ${netGainTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtNet(netGainTotal)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-black text-white">
                    {fmtBRL(finalBalance)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400 text-xs">
                    {avgRT} ms
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── INDIVIDUAL TRIALS ────────────────────────────────────────────────── */}
      <div
        ref={tableRef}
        className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl"
      >
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <p className="text-white font-bold text-sm uppercase tracking-widest">
            Tentativas Individuais
          </p>
          <span className="text-slate-500 text-xs">
            {trials.length} tentativas · 5 blocos × 20
          </span>
        </div>

        {blocks.map((block, bi) => (
          <div key={bi} className={bi > 0 ? "border-t-2 border-slate-700" : ""}>
            {/* Block header */}
            <div
              className="px-5 py-2 flex items-center gap-3 sticky top-0 z-10"
              style={{ background: "rgba(15,23,42,0.97)" }}
            >
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Bloco {bi + 1}
              </span>
              <span className="text-slate-600 text-xs">
                tentativas {bi * BLOCK_SIZE + 1}–{(bi + 1) * BLOCK_SIZE}
              </span>
              <span className="ml-auto text-xs text-slate-500 flex gap-2">
                {(["A", "B", "C", "D"] as DeckId[]).map((d) => (
                  <span key={d} style={{ color: DECK_COLOR[d] }}>
                    {d}:{block.filter((t) => t.deck_chosen === d).length}
                  </span>
                ))}
              </span>
            </div>

            {/* Trials table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="pl-5 pr-2 py-1.5 text-left w-10">#</th>
                    <th className="px-2 py-1.5 text-center w-14">Baralho</th>
                    <th className="px-2 py-1.5 text-right w-20">TR (ms)</th>
                    <th className="px-2 py-1.5 text-right w-20">Ganho</th>
                    <th className="px-2 py-1.5 text-right w-20">Taxa</th>
                    <th className="px-2 py-1.5 text-right w-24">Líquido</th>
                    <th className="px-3 py-1.5 text-right w-28">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {block.map((t, ti) => {
                    const isEven = ti % 2 === 0;
                    return (
                      <tr
                        key={t.trial_number}
                        className="border-t border-slate-800/50 transition-colors hover:bg-slate-800/30"
                        style={{ background: isEven ? "transparent" : "rgba(30,41,59,0.2)" }}
                      >
                        <td className="pl-5 pr-2 py-1.5 text-slate-600 text-[10px]">
                          {t.trial_number}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <DeckBadge deck={t.deck_chosen} />
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-400">
                          {t.response_time_ms}
                        </td>
                        <td className="px-2 py-1.5 text-right text-emerald-400 font-semibold">
                          +{t.gain}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {t.loss > 0 ? (
                            <span className="text-red-400 font-semibold">-{t.loss}</span>
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                        <td
                          className="px-2 py-1.5 text-right font-bold"
                          style={{ color: t.net_gain >= 0 ? "#34d399" : "#f87171" }}
                        >
                          {t.net_gain >= 0 ? `+${t.net_gain}` : `-${Math.abs(t.net_gain)}`}
                        </td>
                        <td
                          className="px-3 py-1.5 text-right font-bold"
                          style={{
                            color:
                              t.running_total >= IGT_INITIAL_BALANCE
                                ? "#6ee7b7"
                                : "#fca5a5",
                          }}
                        >
                          {t.running_total.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-700 bg-slate-800/40">
                    <td
                      colSpan={5}
                      className="pl-5 pr-2 py-2 text-slate-500 text-[10px] uppercase tracking-wider"
                    >
                      Bloco {bi + 1} · Escore:{" "}
                      <span
                        className="font-black"
                        style={{
                          color:
                            blockSummaries[bi].score > 0
                              ? "#34d399"
                              : blockSummaries[bi].score < 0
                              ? "#f87171"
                              : "#94a3b8",
                        }}
                      >
                        {blockSummaries[bi].score > 0
                          ? `+${blockSummaries[bi].score}`
                          : blockSummaries[bi].score}
                      </span>
                    </td>
                    <td
                      className="px-2 py-2 text-right font-bold text-[11px]"
                      style={{
                        color: blockSummaries[bi].blockNet >= 0 ? "#34d399" : "#f87171",
                      }}
                    >
                      {fmtNet(blockSummaries[bi].blockNet)}
                    </td>
                    <td
                      className="px-3 py-2 text-right font-bold text-[11px]"
                      style={{
                        color:
                          blockSummaries[bi].endBalance >= IGT_INITIAL_BALANCE
                            ? "#6ee7b7"
                            : "#fca5a5",
                      }}
                    >
                      {blockSummaries[bi].endBalance.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* ── CONTINUE BUTTON ─────────────────────────────────────────────────── */}
      <motion.button
        onClick={() => onComplete ? onComplete() : navigate("/conclusao")}
        whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-lg rounded-2xl shadow-lg tracking-wide"
      >
        {completeLabel ?? "Concluir Participação →"}
      </motion.button>
    </motion.div>
  );
}