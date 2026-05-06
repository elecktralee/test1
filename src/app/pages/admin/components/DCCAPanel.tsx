/**
 * DCCAPanel — Análise ρDCCA (Detrended Cross-Correlation Analysis)
 *
 * Referência metodológica (pré-projeto, seção 3.7):
 * "O coeficiente de correlação cruzada sem tendência (ρDCCA) será utilizado
 *  para examinar as associações bivariadas entre CSS-12, GSE, BAI e o escore
 *  líquido total do IGT."
 *
 * Algoritmo: Zebende (2011) — ρDCCA(s) = F²DCCA(s) / (F_DFA_x(s) × F_DFA_y(s))
 */

import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CorrelationPoint {
  participant_id: string;
  css33_total: number | null;
  bai_total: number | null;
  gse_total: number | null;
  igt_net: number | null;
  age: number | null;
  [key: string]: unknown;
}

// ── DCCA Pairs (seção 3.7 — todas combinações {CSS-33, GSE, BAI, IGT Net}) ────
const DCCA_PAIRS = [
  { xKey: "css33_total", yKey: "igt_net",   label: "CSS-33 × IGT Net", badge: "H1",   color: "#6366f1" },
  { xKey: "gse_total",   yKey: "igt_net",   label: "GSE × IGT Net",    badge: "H2",   color: "#10b981" },
  { xKey: "bai_total",   yKey: "igt_net",   label: "BAI × IGT Net",    badge: "Biv.", color: "#f59e0b" },
  { xKey: "css33_total", yKey: "bai_total", label: "CSS-33 × BAI",     badge: "Biv.", color: "#ef4444" },
  { xKey: "css33_total", yKey: "gse_total", label: "CSS-33 × GSE",     badge: "Mod.", color: "#8b5cf6" },
  { xKey: "gse_total",   yKey: "bai_total", label: "GSE × BAI",        badge: "Biv.", color: "#06b6d4" },
];

const SORT_OPTIONS = [
  { key: "css33_total", label: "CSS-33 (preditor principal)" },
  { key: "bai_total",   label: "BAI" },
  { key: "gse_total",   label: "GSE" },
  { key: "igt_net",     label: "IGT Net Score" },
  { key: "age",         label: "Idade" },
];

// ── DCCA Algorithm (Zebende 2011) ─────────────────────────────────────────────

/** Remove linear trend from a segment, return residuals */
function detrend(seg: number[]): number[] {
  const n = seg.length;
  const mx = (n - 1) / 2;
  const my = seg.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sx2 = 0;
  for (let i = 0; i < n; i++) { sxy += (i - mx) * (seg[i] - my); sx2 += (i - mx) ** 2; }
  const b = sx2 !== 0 ? sxy / sx2 : 0;
  const a = my - b * mx;
  return seg.map((v, i) => v - (a + b * i));
}

/** ρDCCA at a single scale s (overlapping windows) */
function dccaAtScale(X: number[], Y: number[], s: number): number | null {
  const N = X.length;
  if (N < s + 2 || N !== Y.length || s < 2) return null;

  // Mean-center and integrate (profile) — Passo 1 do slide
  const mx = X.reduce((a, b) => a + b, 0) / N;
  const my = Y.reduce((a, b) => a + b, 0) / N;
  const Xp = [0], Yp = [0];
  for (let i = 0; i < N; i++) { Xp.push(Xp[i] + X[i] - mx); Yp.push(Yp[i] + Y[i] - my); }

  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  const numWindows = N - s; // (N − n) caixas sobrepostas — Passo 2

  for (let v = 0; v < numWindows; v++) {
    // Passo 2: cada caixa tem (n+1) valores: k = v até v+s (inclusive)
    const xSeg = Xp.slice(v, v + s + 1); // s+1 valores
    const ySeg = Yp.slice(v, v + s + 1);

    // Passo 3: tendência local (ajuste linear) → resíduos X̃ e Ỹ
    const ex = detrend(xSeg);
    const ey = detrend(ySeg);

    // Passo 4: f²_DCCA(n,i) = 1/(n+1) Σ_{k=i}^{i+n} (X_k − X̃)(Y_k − Ỹ)
    // CORREÇÃO: somar n+1 termos (0 até s, inclusive) conforme o slide
    for (let i = 0; i <= s; i++) {
      sumXY += ex[i] * ey[i];
      sumX2 += ex[i] * ex[i];
      sumY2 += ey[i] * ey[i];
    }
  }
  // Passo 5: F²_DCCA(n) = média das f²; os fatores 1/(N-n) e 1/(n+1) se cancelam no ρDCCA
  // ρDCCA(n) = F²_DCCA(n) / [F_DFA_X(n) × F_DFA_Y(n)]
  const denom = Math.sqrt(sumX2 * sumY2);
  if (denom === 0) return null;
  const rho = sumXY / denom;
  return isNaN(rho) || !isFinite(rho) ? null : Math.max(-1, Math.min(1, rho));
}

/** Full ρDCCA curve over scale range */
function dccaCurve(x: number[], y: number[], sMin: number, sMax: number) {
  const out: { s: number; rho: number }[] = [];
  for (let s = sMin; s <= sMax; s++) {
    const rho = dccaAtScale(x, y, s);
    if (rho !== null) out.push({ s, rho: +rho.toFixed(4) });
  }
  return out;
}

/** Pearson r for reference */
function pearsonR(x: number[], y: number[]) {
  const n = x.length;
  if (n < 2) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sx2 += (x[i] - mx) ** 2;
    sy2 += (y[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sx2 * sy2);
  return isNaN(r) ? null : +r.toFixed(4);
}

function interpretRho(r: number) {
  const a = Math.abs(r);
  const d = r > 0 ? "positiva" : "negativa";
  if (a < 0.10) return { label: "negligenciável", color: "text-slate-500", bar: "bg-slate-300" };
  if (a < 0.30) return { label: `fraca ${d}`,     color: "text-amber-600", bar: r > 0 ? "bg-amber-300" : "bg-amber-300" };
  if (a < 0.50) return { label: `moderada ${d}`,  color: "text-orange-600", bar: "bg-orange-400" };
  if (a < 0.70) return { label: `forte ${d}`,     color: r > 0 ? "text-emerald-600" : "text-red-600", bar: r > 0 ? "bg-emerald-400" : "bg-red-400" };
  return { label: `muito forte ${d}`,             color: r > 0 ? "text-emerald-700" : "text-red-700", bar: r > 0 ? "bg-emerald-500" : "bg-red-500" };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { data: CorrelationPoint[] }

export function DCCAPanel({ data }: Props) {
  const [sortKey, setSortKey] = useState("css33_total");
  const [selectedPair, setSelectedPair] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Build sorted series (only participants with both values for a pair)
  const getSeriesForPair = (xKey: string, yKey: string, sk: string) => {
    const valid = data.filter(d => d[xKey] != null && d[yKey] != null);
    const sorted = [...valid].sort((a, b) =>
      ((a[sk] as number) ?? 0) - ((b[sk] as number) ?? 0)
    );
    return {
      x: sorted.map(d => d[xKey] as number),
      y: sorted.map(d => d[yKey] as number),
      n: sorted.length,
    };
  };

  // Compute all pairs summary (fixed scale s = floor(n/5) or at least 4)
  const pairSummaries = useMemo(() => {
    return DCCA_PAIRS.map(p => {
      const { x, y, n } = getSeriesForPair(p.xKey, p.yKey, sortKey);
      if (n < 4) return { ...p, n, rho: null, rhoMin: null, rhoMax: null, pearson: null };
      const sMin = 4;
      const sMax = Math.max(4, Math.floor(n / 4));
      const curve = dccaCurve(x, y, sMin, sMax);
      const pearson = pearsonR(x, y);
      const sMid = Math.floor(n / 5);
      const rhoMid = dccaAtScale(x, y, Math.max(sMin, sMid));
      const rhoMax = dccaAtScale(x, y, sMax);
      return { ...p, n, rho: rhoMid, rhoMax, pearson, curve };
    });
  }, [data, sortKey]);

  // Detail curve for selected pair
  const detail = useMemo(() => {
    const p = DCCA_PAIRS[selectedPair];
    const { x, y, n } = getSeriesForPair(p.xKey, p.yKey, sortKey);
    if (n < 4) return { curve: [], n, pearson: null, sMax: 0 };
    const sMin = 4;
    const sMax = Math.max(4, Math.floor(n / 4));
    const curve = dccaCurve(x, y, sMin, sMax);
    const pearson = pearsonR(x, y);
    return { curve, n, pearson, sMax };
  }, [data, sortKey, selectedPair]);

  // Multi-curve chart (all pairs on same axes)
  const allCurves = useMemo(() => {
    if (!showAll) return null;
    const refN = pairSummaries.find(p => p.n >= 4)?.n ?? 0;
    if (refN < 4) return null;
    const sMin = 4;
    const sMax = Math.max(4, Math.floor(refN / 4));
    const sArr = Array.from({ length: sMax - sMin + 1 }, (_, i) => i + sMin);
    return sArr.map(s => {
      const row: Record<string, number | null> = { s };
      DCCA_PAIRS.forEach(p => {
        const { x, y, n } = getSeriesForPair(p.xKey, p.yKey, sortKey);
        if (n >= 4) row[p.label] = dccaAtScale(x, y, s);
      });
      return row;
    });
  }, [data, sortKey, showAll, pairSummaries]);

  const sp = DCCA_PAIRS[selectedPair];
  const hasData = pairSummaries.some(p => p.n >= 4);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

      {/* Header + methodology note */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="text-sm font-bold text-violet-800 mb-1">
          ρDCCA — Coeficiente de Correlação Cruzada Sem Tendência
        </p>
        <p className="text-xs text-violet-700 leading-relaxed">
          <strong>Zebende (2011)</strong> · Aplicado às associações bivariadas entre CSS-33, GSE, BAI e IGT Net
          (seção 3.7 do pré-projeto). O ρDCCA varia de −1 a +1 e é calculado sobre janelas sobrepostas
          de tamanho <em>s</em>, permitindo detectar dependências em séries não estacionárias
          sem necessidade de remoção de tendências nos dados originais.
        </p>
      </div>

      {/* Sort key selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Ordenar participantes por:
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setSortKey(o.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                sortKey === o.key
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUMMARY MATRIX ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Resumo — Todas as combinações {"{CSS-33, GSE, BAI, IGT Net}"}
        </p>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-200 rounded-xl text-slate-400">
            <span className="text-2xl mb-1">📉</span>
            <p className="text-sm">Dados insuficientes (mínimo: 4 participantes)</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Par</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">n</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Pearson r</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">ρDCCA (s = N/5)</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">ρDCCA (s = N/4)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Interpretação</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pairSummaries.map((p, i) => {
                  const rhoVal = p.rho;
                  const interp = rhoVal != null ? interpretRho(rhoVal) : null;
                  return (
                    <tr
                      key={`${p.xKey}-${p.yKey}`}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedPair === i ? "bg-violet-50" : ""
                      }`}
                      onClick={() => { setSelectedPair(i); setShowAll(false); }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: p.color }}
                          />
                          <span className="font-medium text-slate-700">{p.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.badge === "H1" ? "bg-indigo-100 text-indigo-700" :
                            p.badge === "H2" ? "bg-emerald-100 text-emerald-700" :
                            p.badge === "Mod." ? "bg-violet-100 text-violet-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>{p.badge}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{p.n}</td>
                      <td className="px-4 py-3 text-center">
                        {p.pearson != null
                          ? <span className="font-mono font-bold text-slate-700">{p.pearson.toFixed(3)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rhoVal != null
                          ? <span className="font-mono font-bold" style={{ color: p.color }}>{rhoVal.toFixed(3)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.rhoMax != null
                          ? <span className="font-mono font-bold text-slate-600">{p.rhoMax.toFixed(3)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {interp && (
                          <span className={`text-xs font-semibold ${interp.color}`}>{interp.label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs text-violet-500 ${selectedPair === i ? "font-bold" : ""}`}>
                          {selectedPair === i ? "▶ selecionado" : "ver curva →"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DETAIL CURVE ────────────────────────────────────────────────── */}
      {hasData && (
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-slate-700">
                Curva ρDCCA(s) — <span style={{ color: sp.color }}>{sp.label}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                ρDCCA em função da escala <em>s</em> (tamanho da janela) · n = {detail.n}
              </p>
            </div>
            <button
              onClick={() => setShowAll(v => !v)}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                showAll
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-violet-600 border-violet-300 hover:bg-violet-50"
              }`}
            >
              {showAll ? "Ver par selecionado" : "Ver todos os pares"}
            </button>
          </div>

          {detail.curve.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 rounded-xl text-slate-400">
              <span className="text-2xl mb-1">📉</span>
              <p className="text-sm">Dados insuficientes para este par (mín. 4 participantes)</p>
            </div>
          ) : !showAll ? (
            /* Single pair curve */
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={detail.curve} margin={{ top: 10, right: 20, bottom: 25, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="s" tick={{ fontSize: 11 }}
                      label={{ value: "Escala s (janela)", position: "insideBottom", offset: -12, fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis domain={[-1, 1]} ticks={[-1, -0.7, -0.5, -0.3, 0, 0.3, 0.5, 0.7, 1]}
                      tick={{ fontSize: 10 }}
                      label={{ value: "ρDCCA(s)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#94a3b8" }} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                    {detail.pearson != null && (
                      <ReferenceLine y={detail.pearson} stroke={sp.color} strokeDasharray="6 3" strokeOpacity={0.5}
                        label={{ value: `r=${detail.pearson.toFixed(3)}`, position: "right", fontSize: 10, fill: sp.color }} />
                    )}
                    <ReferenceLine y={0.3}  stroke="#10b981" strokeDasharray="2 4" strokeOpacity={0.4} />
                    <ReferenceLine y={-0.3} stroke="#ef4444" strokeDasharray="2 4" strokeOpacity={0.4} />
                    <Tooltip
                      formatter={(v: any) => [typeof v === "number" ? v.toFixed(4) : v, "ρDCCA"]}
                      labelFormatter={l => `Escala s = ${l}`}
                    />
                    <Line type="monotone" dataKey="rho" name="ρDCCA(s)"
                      stroke={sp.color} strokeWidth={2.5} dot={{ r: 4, fill: sp.color }}
                      activeDot={{ r: 6 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-2 flex gap-3 flex-wrap text-[11px] text-slate-500 justify-center">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-slate-400 inline-block" style={{ borderTop: "2px dashed #94a3b8" }} />
                    ρ = 0 (linha nula)
                  </span>
                  <span className="flex items-center gap-1" style={{ color: sp.color }}>
                    <span className="w-4 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: sp.color, opacity: 0.5 }} />
                    Pearson r (referência)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-4 h-0.5 inline-block border-t-2 border-dashed border-emerald-300" />
                    ±0.30 (limiar fraco/mod.)
                  </span>
                </div>
              </div>

              {/* Stats panel */}
              <div className="lg:w-52 space-y-3 flex-shrink-0">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Pearson r</p>
                  <p className="text-2xl font-black text-slate-700">
                    {detail.pearson != null ? detail.pearson.toFixed(3) : "—"}
                  </p>
                </div>
                {detail.curve.length > 0 && (() => {
                  const rhoFirst = detail.curve[0].rho;
                  const rhoLast  = detail.curve[detail.curve.length - 1].rho;
                  const rhoPearson = detail.pearson ?? 0;
                  const consistent = detail.curve.every(pt => Math.sign(pt.rho) === Math.sign(detail.curve[0].rho));
                  const amplifiesR = Math.abs(rhoFirst) > Math.abs(rhoPearson);
                  const interp = interpretRho(rhoLast);
                  return (
                    <>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                          ρDCCA (s={detail.curve[0].s})
                        </p>
                        <p className="text-2xl font-black" style={{ color: sp.color }}>
                          {rhoFirst.toFixed(3)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                          ρDCCA (s={detail.curve[detail.curve.length - 1].s})
                        </p>
                        <p className="text-2xl font-black text-slate-600">
                          {rhoLast.toFixed(3)}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 border text-xs font-semibold text-center ${interp.color} bg-slate-50`}>
                        {interp.label}
                      </div>
                      <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-xs text-indigo-700 space-y-1">
                        <p><strong>Consistência:</strong> {consistent ? "✅ Sinal estável entre escalas" : "⚠️ Sinal muda entre escalas"}</p>
                        <p><strong>vs Pearson:</strong> {amplifiesR
                          ? "ρDCCA > r: dependência de longo alcance detectada"
                          : "ρDCCA ≤ r: sem amplificação multiescala"}</p>
                      </div>
                    </>
                  );
                })()}
                <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 text-[11px] text-violet-700">
                  <p className="font-bold mb-1">Conv. (Cohen, 1988):</p>
                  <p>|ρ| &lt; 0.10 → negligenciável</p>
                  <p>0.10–0.29 → fraca</p>
                  <p>0.30–0.49 → moderada</p>
                  <p>0.50–0.69 → forte</p>
                  <p>≥ 0.70 → muito forte</p>
                </div>
              </div>
            </div>
          ) : (
            /* All pairs on same chart */
            allCurves && allCurves.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={allCurves} margin={{ top: 10, right: 20, bottom: 25, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="s" tick={{ fontSize: 11 }}
                    label={{ value: "Escala s", position: "insideBottom", offset: -12, fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }}
                    label={{ value: "ρDCCA(s)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#94a3b8" }} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ReferenceLine y={0.3}  stroke="#10b981" strokeDasharray="2 4" strokeOpacity={0.3} />
                  <ReferenceLine y={-0.3} stroke="#ef4444" strokeDasharray="2 4" strokeOpacity={0.3} />
                  <Tooltip formatter={(v: any, name: any) =>
                    [typeof v === "number" ? v.toFixed(4) : v, name]}
                    labelFormatter={l => `Escala s = ${l}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {DCCA_PAIRS.map(p => (
                    <Line key={p.label} type="monotone" dataKey={p.label}
                      stroke={p.color} strokeWidth={2} dot={false}
                      isAnimationActive={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">Dados insuficientes para exibir todos os pares.</p>
            )
          )}
        </div>
      )}

      {/* Methodological footer */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <strong>Nota metodológica:</strong> O ρDCCA foi aplicado a dados transversais ordenados pela variável selecionada acima (padrão: CSS-33),
          seguindo Zebende (2011). A escala <em>s</em> corresponde ao tamanho da janela deslizante;
          janelas pequenas capturam correlações de curto alcance e janelas maiores capturam dependências de longo alcance.
          Os valores de Pearson <em>r</em> são exibidos como referência (linha tracejada).
          Zebende, G. F. (2011). DCCA cross-correlation coefficient: Quantifying level of cross-correlation.
          <em> Physica A</em>, 390(4), 614–618.
        </p>
      </div>
    </div>
  );
}