/**
 * RegressionScatter — ScatterChart + linha OLS + banda IC 95%
 * Usa Customized (SVG puro) para a regressão, evitando bugs do ComposedChart.
 */
import React, { useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Customized,
} from "recharts";

export interface ScatterPt { x: number; y: number }

interface Reg {
  slope: number; intercept: number;
  r: number; r2: number;
  mx: number; sx2: number; se: number; n: number;
  pLabel: string;
}

interface LinePt { x: number; yHat: number; yUpper: number; yLower: number }

// ── OLS ───────────────────────────────────────────────────────────────────────
function ols(pts: ScatterPt[]): Reg | null {
  const n = pts.length;
  if (n < 3) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0, sx2 = 0, sy2 = 0;
  pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sx2 += (p.x - mx) ** 2; sy2 += (p.y - my) ** 2; });
  const slope = sx2 ? sxy / sx2 : 0;
  const intercept = my - slope * mx;
  const r = sx2 && sy2 ? sxy / Math.sqrt(sx2 * sy2) : 0;
  const sse = pts.reduce((s, p) => s + (p.y - (intercept + slope * p.x)) ** 2, 0);
  const se = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;
  const t = r * r < 1 ? Math.abs(r) * Math.sqrt(n - 2) / Math.sqrt(1 - r * r) : Infinity;
  const pLabel = t > 3.291 ? "p < .001" : t > 2.576 ? "p < .01" : t > 1.960 ? "p < .05" : "n.s.";
  return { slope, intercept, r, r2: r * r, mx, sx2, se, n, pLabel };
}

function buildLine(reg: Reg, pts: ScatterPt[], np = 60): LinePt[] {
  const xs = pts.map(p => p.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  return Array.from({ length: np }, (_, i) => {
    const x = xMin + (i / (np - 1)) * (xMax - xMin);
    const yHat = reg.intercept + reg.slope * x;
    const sep = reg.sx2 ? reg.se * Math.sqrt(1 / reg.n + (x - reg.mx) ** 2 / reg.sx2) : 0;
    return { x, yHat, yUpper: yHat + 1.96 * sep, yLower: yHat - 1.96 * sep };
  });
}

// ── Regression layer via Customized (SVG puro) ────────────────────────────────
function RegLayer({ xAxisMap, yAxisMap, line, color, showCI }: any) {
  try {
    const xa = (Object.values(xAxisMap as object) as any[])[0];
    const ya = (Object.values(yAxisMap as object) as any[])[0];
    if (!xa?.scale || !ya?.scale || !line?.length) return null;
    const sx = xa.scale, sy = ya.scale;

    const up  = (line as LinePt[]).map(p => `${sx(p.x)},${sy(p.yUpper)}`).join(" ");
    const dn  = [...(line as LinePt[])].reverse().map(p => `${sx(p.x)},${sy(p.yLower)}`).join(" ");
    const ln  = (line as LinePt[]).map((p, i) => `${i ? "L" : "M"}${sx(p.x)} ${sy(p.yHat)}`).join(" ");
    const uln = (line as LinePt[]).map(p => `${sx(p.x)},${sy(p.yUpper)}`).join(" ");
    const dln = (line as LinePt[]).map(p => `${sx(p.x)},${sy(p.yLower)}`).join(" ");

    return (
      <g>
        {showCI && <>
          <polygon points={`${up} ${dn}`} fill={color} fillOpacity={0.10} stroke="none" />
          <polyline points={uln} fill="none" stroke={color} strokeWidth={1}
            strokeDasharray="5 3" strokeOpacity={0.30} />
          <polyline points={dln} fill="none" stroke={color} strokeWidth={1}
            strokeDasharray="5 3" strokeOpacity={0.30} />
        </>}
        <path d={ln} fill="none" stroke={color} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  } catch { return null; }
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
function RTip({ active, payload, color, xLabel, yLabel }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as ScatterPt;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-400 mb-0.5">{xLabel}</p>
      <p className="font-black" style={{ color }}>{p.x?.toFixed(2)}</p>
      <p className="text-slate-400 mt-1 mb-0.5">{yLabel}</p>
      <p className="font-black text-slate-700">{p.y?.toFixed(2)}</p>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export interface RegressionScatterProps {
  data:      ScatterPt[];
  xLabel?:   string;
  yLabel?:   string;
  color?:    string;
  height?:   number;
  showCI?:   boolean;
  compact?:  boolean;           // compact mode: só mostra badges, sem equação
}

export function RegressionScatter({
  data,
  xLabel = "X",
  yLabel = "Y",
  color  = "#6366f1",
  height = 320,
  showCI = true,
  compact = false,
}: RegressionScatterProps) {
  const reg  = useMemo(() => ols(data), [data]);
  const line = useMemo(() => reg ? buildLine(reg, data) : [], [reg, data]);

  if (data.length < 3) return (
    <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-300"
      style={{ height }}>
      <span className="text-3xl mb-1">📉</span>
      <p className="text-sm">Mín. 3 participantes para este par</p>
    </div>
  );

  const xs   = data.map(d => d.x), ys = data.map(d => d.y);
  const allY = [...ys, ...line.map(l => l.yUpper), ...line.map(l => l.yLower)];
  const xPad = (Math.max(...xs) - Math.min(...xs)) * 0.06 || 1;
  const yPad = (Math.max(...allY) - Math.min(...allY)) * 0.07 || 1;
  const xDom: [number, number] = [Math.min(...xs) - xPad, Math.max(...xs) + xPad];
  const yDom: [number, number] = [Math.min(...allY) - yPad, Math.max(...allY) + yPad];

  const pColor = !reg || reg.pLabel === "n.s." ? "text-slate-400" : "text-emerald-600";

  // Truncate label for axis display
  const truncate = (s: string, max = 22) => s.length > max ? s.slice(0, max - 1) + "…" : s;

  return (
    <div className="w-full">
      {/* Axis labels as HTML — avoid recharts truncation */}
      <div className="flex items-start gap-2 mb-1 pl-10">
        <span className="text-[11px] font-semibold text-slate-400 truncate max-w-full" title={yLabel}>
          ↑ {yLabel}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 4, right: 16, bottom: 28, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" dataKey="x" name={xLabel}
            domain={xDom} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="number" dataKey="y" name={yLabel}
            domain={yDom} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip
            content={<RTip color={color} xLabel={xLabel} yLabel={yLabel} />}
            cursor={{ strokeDasharray: "3 3", stroke: "#e2e8f0" }} />

          {/* Regressão + IC (SVG via Customized) */}
          {reg && (
            <Customized component={(p: any) =>
              <RegLayer {...p} line={line} color={color} showCI={showCI} />
            } />
          )}

          {/* Pontos */}
          <Scatter data={data} fill={color} fillOpacity={0.70}
            shape={(p: any) => (
              <circle cx={p.cx} cy={p.cy} r={5.5}
                fill={color} fillOpacity={0.70}
                stroke="white" strokeWidth={1.5} />
            )}
            isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* X label */}
      <p className="text-[11px] font-semibold text-slate-400 text-center -mt-1 mb-2 truncate px-10" title={xLabel}>
        {xLabel} →
      </p>

      {/* Stats row */}
      {reg && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className="flex items-stretch gap-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
            {[
              { lbl: "r",   val: reg.r.toFixed(3),  c: color },
              { lbl: "R²",  val: reg.r2.toFixed(3), c: undefined },
              { lbl: "n",   val: String(reg.n),      c: undefined },
              { lbl: "sig", val: reg.pLabel,         extra: pColor },
            ].map(({ lbl, val, c, extra }, i) => (
              <div key={lbl} className={`px-3 py-2 text-center ${i > 0 ? "border-l border-slate-200" : ""}`}>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{lbl}</p>
                <p className={`text-sm font-black leading-none ${extra ?? ""}`}
                  style={c ? { color: c } : { color: "#334155" }}>
                  {val}
                </p>
              </div>
            ))}
          </div>

          {!compact && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono whitespace-nowrap flex-shrink-0">
              ŷ = <span style={{ color }}>{reg.intercept.toFixed(2)}</span>
              {" + "}
              <span style={{ color }}>{reg.slope.toFixed(3)}</span>x
            </div>
          )}
        </div>
      )}
    </div>
  );
}