/**
 * ResultsPanel — Aba de Resultados, Discussão e Conclusão
 *
 * Gera texto interpretativo dinâmico com base nos dados coletados.
 * Atualiza automaticamente a cada refresh do Dashboard.
 */

import React, { useMemo } from "react";

// ── Types (espelha DashboardPage) ──────────────────────────────────────────────
export interface CorrelationPoint {
  participant_id: string;
  css33_total: number | null;
  css33_compulsion: number | null;
  css33_distress: number | null;
  css33_excess: number | null;
  css33_reassurance: number | null;
  css33_distrust: number | null;
  bai_total: number | null;
  gse_total: number | null;
  igt_net: number | null;
  igt_balance: number | null;
  igt_net_b1: number | null;
  igt_net_b2: number | null;
  igt_net_b3: number | null;
  igt_net_b4: number | null;
  igt_net_b5: number | null;
  age: number | null;
  gender: string | null;
  education: string | null;
  [key: string]: unknown;
}

interface Metrics {
  total: number;
  completed: number;
  completionRate: number;
  avgDuration: number;
  genders: Record<string, number>;
}

interface Props {
  correlationData: CorrelationPoint[];
  metrics: Metrics;
}

// ── Stat helpers ───────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function sd(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function valid(data: CorrelationPoint[], key: keyof CorrelationPoint): number[] {
  return data.map(d => d[key] as number).filter(v => v != null && !isNaN(v));
}
function pearsonR(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sx2 += (xs[i] - mx) ** 2;
    sy2 += (ys[i] - my) ** 2;
  }
  const r = sxy / Math.sqrt(sx2 * sy2);
  return isNaN(r) ? null : +r.toFixed(3);
}
function pairR(data: CorrelationPoint[], xKey: keyof CorrelationPoint, yKey: keyof CorrelationPoint) {
  const pairs = data.filter(d => d[xKey] != null && d[yKey] != null);
  return {
    r: pearsonR(pairs.map(d => d[xKey] as number), pairs.map(d => d[yKey] as number)),
    n: pairs.length,
  };
}
function rInterpret(r: number | null): string {
  if (r == null) return "não calculável (n insuficiente)";
  const a = Math.abs(r);
  const dir = r > 0 ? "positiva" : "negativa";
  if (a < 0.10) return "negligenciável";
  if (a < 0.30) return `fraca ${dir}`;
  if (a < 0.50) return `moderada ${dir}`;
  if (a < 0.70) return `forte ${dir}`;
  return `muito forte ${dir}`;
}
function baiLevel(score: number): string {
  if (score <= 10) return "mínimo";
  if (score <= 19) return "leve";
  if (score <= 30) return "moderado";
  return "grave";
}
function igtInterpret(net: number): string {
  if (net > 10) return "padrão vantajoso";
  if (net >= -10) return "padrão neutro";
  return "padrão desvantajoso";
}

// ── Section Components ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-1 h-5 bg-indigo-500 rounded-full flex-shrink-0" />
      <h3 className="text-base font-black text-slate-800">{children}</h3>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>;
}

function StatBadge({ label, value, color = "bg-indigo-50 text-indigo-700 border-indigo-100" }: {
  label: string; value: string | number; color?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${color}`}>
      <span className="text-slate-400 font-medium">{label}</span> {value}
    </span>
  );
}

function InsufficientData({ minN = 8 }: { minN?: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 rounded-2xl text-slate-300">
      <span className="text-2xl mb-1">📊</span>
      <p className="text-sm">Mín. {minN} participantes com dados completos para esta análise</p>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ResultsPanel({ correlationData: data, metrics }: Props) {

  const stats = useMemo(() => {
    const css33  = valid(data, "css33_total");
    const bai    = valid(data, "bai_total");
    const gse    = valid(data, "gse_total");
    const igt    = valid(data, "igt_net");
    const igtBal = valid(data, "igt_balance");

    const css33Sub = {
      compulsion:  valid(data, "css33_compulsion"),
      distress:    valid(data, "css33_distress"),
      excess:      valid(data, "css33_excess"),
      reassurance: valid(data, "css33_reassurance"),
      distrust:    valid(data, "css33_distrust"),
    };

    // IGT learning curve
    const blocks = ["igt_net_b1","igt_net_b2","igt_net_b3","igt_net_b4","igt_net_b5"].map(k => ({
      key: k,
      vals: valid(data, k as keyof CorrelationPoint),
    }));
    const blockMeans = blocks.map(b => ({ key: b.key, m: mean(b.vals), n: b.vals.length }));
    const learningTrend = blockMeans.filter(b => b.n > 0).length >= 2
      ? (blockMeans[blockMeans.length - 1]?.m ?? 0) - (blockMeans[0]?.m ?? 0)
      : null;

    // Correlations
    const h1 = pairR(data, "css33_total", "igt_net");
    const h2 = pairR(data, "gse_total",   "igt_net");
    const h3_low_r  = (() => {
      const mod = data.filter(d => d.gse_total != null && d.css33_total != null && d.igt_net != null);
      if (mod.length < 6) return null;
      const sorted = [...mod].sort((a, b) => (a.gse_total ?? 0) - (b.gse_total ?? 0));
      const half = Math.floor(sorted.length / 2);
      const lo = sorted.slice(0, half);
      const hi = sorted.slice(half);
      const rLo = pearsonR(lo.map(d => d.css33_total!), lo.map(d => d.igt_net!));
      const rHi = pearsonR(hi.map(d => d.css33_total!), hi.map(d => d.igt_net!));
      return { rLo, rHi, nLo: lo.length, nHi: hi.length };
    })();
    const baiIgt = pairR(data, "bai_total", "igt_net");
    const css33Bai = pairR(data, "css33_total", "bai_total");
    const css33Gse = pairR(data, "css33_total", "gse_total");

    // Demographics
    const genderCounts = metrics.genders;
    const dominantGender = Object.entries(genderCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      css33, bai, gse, igt, igtBal, css33Sub, blockMeans, learningTrend,
      h1, h2, h3_low_r, baiIgt, css33Bai, css33Gse,
      dominantGender,
      n: {
        css33: css33.length, bai: bai.length, gse: gse.length, igt: igt.length,
      },
      means: {
        css33: +mean(css33).toFixed(1),
        bai:   +mean(bai).toFixed(1),
        gse:   +mean(gse).toFixed(1),
        igt:   +mean(igt).toFixed(1),
        igtBal:+mean(igtBal).toFixed(0),
      },
      sds: {
        css33: +sd(css33).toFixed(1),
        bai:   +sd(bai).toFixed(1),
        gse:   +sd(gse).toFixed(1),
        igt:   +sd(igt).toFixed(1),
      },
    };
  }, [data, metrics]);

  const hasEnoughForResults = stats.n.css33 >= 5 || stats.n.bai >= 5 || stats.n.igt >= 5;

  if (!hasEnoughForResults) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
        <span className="text-4xl block mb-3">🔬</span>
        <p className="font-semibold text-slate-500 mb-1">Dados em coleta</p>
        <p className="text-sm">A interpretação automática será gerada a partir de 5 participantes com dados completos.</p>
        <p className="text-xs mt-2 text-slate-300">{metrics.completed} participante(s) completo(s) até agora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── 1. RESULTADOS ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionTitle>1. Resultados</SectionTitle>

        {/* 1.1 Amostra */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1.1 Caracterização da Amostra</p>
          <Prose>
            <p>
              A amostra é composta por <strong>{metrics.completed} participantes</strong> que concluíram o protocolo
              completo (taxa de conclusão: {metrics.completionRate}%
              {metrics.avgDuration > 0 ? `; duração média: ${metrics.avgDuration} min` : ""}).
              {stats.dominantGender && (
                <> O gênero predominante foi <strong>{stats.dominantGender[0]}</strong> ({stats.dominantGender[1]} participantes).</>
              )}
            </p>
          </Prose>
        </div>

        {/* 1.2 CSS-33 */}
        {stats.n.css33 >= 3 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1.2 Cybercondria — CSS-33</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatBadge label="M" value={stats.means.css33} />
              <StatBadge label="DP" value={stats.sds.css33} color="bg-slate-50 text-slate-600 border-slate-200" />
              <StatBadge label="n" value={stats.n.css33} color="bg-slate-50 text-slate-600 border-slate-200" />
            </div>
            <Prose>
              <p>
                O escore médio na Escala de Severidade da Cybercondria (CSS-33; Silva et al., 2016) foi de{" "}
                <strong>M = {stats.means.css33} (DP = {stats.sds.css33})</strong>.
                {stats.means.css33 > 66
                  ? " Este valor indica nível elevado de cybercondria na amostra, sugerindo padrão de busca excessiva e angustiante de informações de saúde online."
                  : stats.means.css33 > 33
                  ? " Este valor indica nível moderado de cybercondria, compatível com uso frequente, porém não compulsivo, da internet para busca de informações de saúde."
                  : " Este valor situa-se no terço inferior da escala, indicando baixo comprometimento pelo comportamento cybercondríaco."
                }
              </p>
              {Object.entries(stats.css33Sub).some(([, v]) => v.length >= 3) && (
                <p>
                  Entre as subescalas, destacaram-se:{" "}
                  {Object.entries(stats.css33Sub)
                    .filter(([, v]) => v.length >= 3)
                    .map(([k, v]) => {
                      const label: Record<string, string> = {
                        compulsion: "Compulsão", distress: "Sofrimento",
                        excess: "Excessividade", reassurance: "Reasseguramento", distrust: "Desconfiança Médica",
                      };
                      return `${label[k]} (M = ${mean(v).toFixed(1)})`;
                    })
                    .join("; ")}.
                </p>
              )}
            </Prose>
          </div>
        )}

        {/* 1.3 BAI */}
        {stats.n.bai >= 3 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1.3 Ansiedade — BAI</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatBadge label="M" value={stats.means.bai} color="bg-purple-50 text-purple-700 border-purple-100" />
              <StatBadge label="DP" value={stats.sds.bai} color="bg-slate-50 text-slate-600 border-slate-200" />
              <StatBadge label="n" value={stats.n.bai} color="bg-slate-50 text-slate-600 border-slate-200" />
            </div>
            <Prose>
              <p>
                O Inventário de Ansiedade de Beck (BAI; Beck et al., 1988) revelou escore médio de{" "}
                <strong>M = {stats.means.bai} (DP = {stats.sds.bai})</strong>,
                correspondendo ao nível <strong>{baiLevel(stats.means.bai)}</strong> de ansiedade.
                {stats.means.bai > 19
                  ? " Este perfil indica que uma parcela relevante da amostra apresenta sintomatologia ansiosa clinicamente significativa, o que é consistente com a literatura que associa busca excessiva de informações de saúde a estados de hipervigilância e ruminação ansiosa."
                  : " Este perfil indica que a amostra, em média, não apresenta comprometimento ansioso significativo, embora a variabilidade individual deva ser considerada nas análises subsequentes."
                }
              </p>
            </Prose>
          </div>
        )}

        {/* 1.4 GSE */}
        {stats.n.gse >= 3 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1.4 Autoeficácia — GSE</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatBadge label="M" value={stats.means.gse} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
              <StatBadge label="DP" value={stats.sds.gse} color="bg-slate-50 text-slate-600 border-slate-200" />
              <StatBadge label="n" value={stats.n.gse} color="bg-slate-50 text-slate-600 border-slate-200" />
            </div>
            <Prose>
              <p>
                A Escala de Autoeficácia Geral (GSE; Schwarzer &amp; Jerusalem, 1995) apresentou média de{" "}
                <strong>M = {stats.means.gse} (DP = {stats.sds.gse})</strong>
                {stats.means.gse > 30
                  ? ", indicando percepção robusta de capacidade de enfrentamento. Participantes com autoeficácia elevada tendem a demonstrar menor ruminação ansiosa e melhor regulação emocional diante de informações de saúde ambíguas."
                  : ", indicando percepção moderada de autoeficácia. Valores abaixo da mediana teórica (25) podem refletir vulnerabilidade cognitiva relevante para a tomada de decisão sob incerteza."
                }
              </p>
            </Prose>
          </div>
        )}

        {/* 1.5 IGT */}
        {stats.n.igt >= 3 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1.5 Tomada de Decisão — IGT</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatBadge label="NET médio" value={stats.means.igt > 0 ? `+${stats.means.igt}` : stats.means.igt} color="bg-amber-50 text-amber-700 border-amber-100" />
              <StatBadge label="DP" value={stats.sds.igt} color="bg-slate-50 text-slate-600 border-slate-200" />
              <StatBadge label="Saldo médio" value={`R$ ${Number(stats.means.igtBal).toLocaleString("pt-BR")}`} color="bg-slate-50 text-slate-600 border-slate-200" />
              <StatBadge label="n" value={stats.n.igt} color="bg-slate-50 text-slate-600 border-slate-200" />
            </div>
            <Prose>
              <p>
                No Iowa Gambling Task (IGT; Bechara et al., 1994), o escore líquido médio foi de{" "}
                <strong>{stats.means.igt > 0 ? "+" : ""}{stats.means.igt} (DP = {stats.sds.igt})</strong>,
                caracterizando <strong>{igtInterpret(stats.means.igt)}</strong> de tomada de decisão.
                {stats.means.igt > 10
                  ? " A predominância de escolhas nos baralhos vantajosos (C e D) sugere que a amostra, em média, aprende a evitar as opções de maior risco ao longo das tentativas."
                  : stats.means.igt >= -10
                  ? " O padrão neutro indica que, em média, os participantes não distinguiram sistematicamente entre baralhos vantajosos e desvantajosos, o que pode refletir variabilidade individual elevada ou tamanho amostral ainda limitado."
                  : " O predomínio de escolhas desvantajosas sugere dificuldade de aprendizagem por retroalimentação, padrão associado na literatura à impulsividade e à dificuldade de regulação emocional."
                }
              </p>
              {stats.learningTrend !== null && (
                <p>
                  <strong>Curva de aprendizado:</strong> a trajetória dos escores por bloco indica{" "}
                  {stats.learningTrend > 2
                    ? "melhora progressiva ao longo das tentativas, consistente com aprendizagem por retroalimentação implícita (soma somática; Damasio, 1994)"
                    : stats.learningTrend < -2
                    ? "declínio ao longo dos blocos, sugerindo ausência de aprendizagem adaptativa ou fadiga decisional"
                    : "estabilidade ao longo dos blocos, sem tendência clara de aprendizado ou piora"}.
                </p>
              )}
            </Prose>
          </div>
        )}

        {/* 1.6 Correlações */}
        <div className="mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1.6 Análise Correlacional</p>

          {(stats.h1.n < 5 && stats.h2.n < 5) ? (
            <InsufficientData minN={5} />
          ) : (
            <div className="space-y-4">
              {/* H1 */}
              {stats.h1.n >= 3 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded">H1</span>
                    <span className="text-xs font-bold text-indigo-700">CSS-33 × IGT Net</span>
                    <div className="flex gap-1.5 ml-auto flex-wrap">
                      <StatBadge label="r" value={stats.h1.r ?? "—"} color="bg-white text-indigo-700 border-indigo-200" />
                      <StatBadge label="n" value={stats.h1.n} color="bg-white text-slate-500 border-slate-200" />
                    </div>
                  </div>
                  <Prose>
                    <p>
                      A correlação entre cybercondria e tomada de decisão no IGT foi{" "}
                      <strong>r = {stats.h1.r ?? "—"} ({rInterpret(stats.h1.r)})</strong>.
                      {stats.h1.r != null && stats.h1.r < -0.10
                        ? " A direção negativa é consistente com H1: maior severidade de cybercondria associa-se a pior desempenho decisional, apoiando a hipótese de que a hipervigilância à informação de saúde compromete processos de marcação somática e aprendizagem por retroalimentação."
                        : stats.h1.r != null && stats.h1.r >= -0.10
                        ? " A associação ainda não atingiu magnitude consistente com H1. O padrão atual pode refletir tamanho amostral insuficiente para detectar efeitos de magnitude pequena a moderada — recomenda-se aguardar coleta adicional."
                        : " Dados insuficientes para interpretar a hipótese."
                      }
                    </p>
                  </Prose>
                </div>
              )}

              {/* H2 */}
              {stats.h2.n >= 3 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded">H2</span>
                    <span className="text-xs font-bold text-emerald-700">GSE × IGT Net</span>
                    <div className="flex gap-1.5 ml-auto flex-wrap">
                      <StatBadge label="r" value={stats.h2.r ?? "—"} color="bg-white text-emerald-700 border-emerald-200" />
                      <StatBadge label="n" value={stats.h2.n} color="bg-white text-slate-500 border-slate-200" />
                    </div>
                  </div>
                  <Prose>
                    <p>
                      A correlação entre autoeficácia e desempenho no IGT foi{" "}
                      <strong>r = {stats.h2.r ?? "—"} ({rInterpret(stats.h2.r)})</strong>.
                      {stats.h2.r != null && stats.h2.r > 0.10
                        ? " A direção positiva é consistente com H2: maior autoeficácia associa-se a melhores escolhas vantajosas, o que pode refletir maior tolerância à incerteza e capacidade de regulação emocional durante o teste."
                        : stats.h2.r != null
                        ? " O padrão atual não confirma H2. A associação não atingiu magnitude ou direção esperada — recomenda-se expansão amostral."
                        : " Dados insuficientes para interpretar a hipótese."
                      }
                    </p>
                  </Prose>
                </div>
              )}

              {/* H3 Moderação */}
              {stats.h3_low_r ? (
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black bg-violet-600 text-white px-2 py-0.5 rounded">H3</span>
                    <span className="text-xs font-bold text-violet-700">Moderação da GSE sobre CSS-33 × IGT</span>
                  </div>
                  <Prose>
                    <p>
                      Dividindo a amostra pela mediana da GSE:{" "}
                      baixa autoeficácia (n={stats.h3_low_r.nLo}) r(CSS-33×IGT) = <strong>{stats.h3_low_r.rLo ?? "—"}</strong>;{" "}
                      alta autoeficácia (n={stats.h3_low_r.nHi}) r(CSS-33×IGT) = <strong>{stats.h3_low_r.rHi ?? "—"}</strong>.{" "}
                      {stats.h3_low_r.rLo != null && stats.h3_low_r.rHi != null
                        ? Math.abs(stats.h3_low_r.rLo) > Math.abs(stats.h3_low_r.rHi)
                          ? "O padrão é compatível com H3: a relação negativa entre cybercondria e tomada de decisão é mais pronunciada no grupo com baixa autoeficácia, sugerindo efeito moderador da crença de autoeficácia."
                          : "O padrão atual não confirma H3. A relação entre cybercondria e IGT não é significativamente atenuada pela autoeficácia com os dados disponíveis."
                        : "Dados insuficientes para comparação dos subgrupos."
                      }
                    </p>
                  </Prose>
                </div>
              ) : null}

              {/* Bivariadas adicionais */}
              {(stats.css33Bai.n >= 3 || stats.baiIgt.n >= 3 || stats.css33Gse.n >= 3) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">Correlações bivariadas adicionais</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {stats.css33Bai.n >= 3 && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">CSS-33 × BAI</p>
                        <p className="text-lg font-black text-amber-600">{stats.css33Bai.r ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">{rInterpret(stats.css33Bai.r)} · n={stats.css33Bai.n}</p>
                      </div>
                    )}
                    {stats.baiIgt.n >= 3 && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">BAI × IGT Net</p>
                        <p className="text-lg font-black text-purple-600">{stats.baiIgt.r ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">{rInterpret(stats.baiIgt.r)} · n={stats.baiIgt.n}</p>
                      </div>
                    )}
                    {stats.css33Gse.n >= 3 && (
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">CSS-33 × GSE</p>
                        <p className="text-lg font-black text-violet-600">{stats.css33Gse.r ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">{rInterpret(stats.css33Gse.r)} · n={stats.css33Gse.n}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. DISCUSSÃO E ENCAMINHAMENTOS METODOLÓGICOS ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionTitle>2. Discussão e Encaminhamentos Metodológicos</SectionTitle>
        <Prose>
          <p>
            Os dados parciais atuais (N={metrics.completed} completos) permitem observações preliminares que
            devem orientar as próximas etapas da coleta e análise.
          </p>

          {/* CSS-33 discussion */}
          {stats.n.css33 >= 3 && (
            <p>
              <strong>Cybercondria (CSS-33):</strong>{" "}
              {stats.means.css33 > 66
                ? "O nível elevado observado sugere que a estratégia de recrutamento está capturando população com comprometimento significativo — o que é metodologicamente desejável para testar H1. Recomenda-se manter os critérios de divulgação atuais e monitorar se a variância permanece suficiente para detectar correlações."
                : "O nível moderado observado indica boa variância no construto, adequada para análises correlacionais. Caso a média permaneça abaixo de 50 com a expansão amostral, considerar estratificação por nível de cybercondria nas análises ou recrutamento direcionado a contextos de maior exposição à saúde online."
              }
            </p>
          )}

          {/* IGT discussion */}
          {stats.n.igt >= 3 && (
            <p>
              <strong>Tomada de Decisão (IGT):</strong>{" "}
              {stats.learningTrend !== null && stats.learningTrend > 2
                ? "A curva de aprendizado positiva é um indicador de validade de constructo do IGT nesta amostra — participantes estão aprendendo com o feedback. Isso fortalece a interpretação dos escores NET como medida de tomada de decisão adaptativa e não apenas de variação aleatória."
                : stats.learningTrend !== null && stats.learningTrend < -2
                ? "A ausência de curva de aprendizado ascendente é um sinal de atenção. Recomenda-se verificar se houve problemas de interface ou compreensão das instruções. Considerar incluir questão de checagem de manipulação (manipulation check) ao final do IGT."
                : "O padrão neutro por blocos sugere variabilidade elevada — esperada em amostras pequenas. A curva de aprendizado tende a emergir com maior N. Recomenda-se analisar individualmente participantes com escores extremos antes de análises de grupo."
              }
            </p>
          )}

          {/* Correlation power analysis hint */}
          {(stats.h1.n > 0 || stats.h2.n > 0) && (
            <p>
              <strong>Poder estatístico:</strong>{" "}
              Para detectar correlações de magnitude moderada (r ≈ 0.35, α = .05, poder = .80), são necessários
              aproximadamente 62 participantes (Cohen, 1988). Para efeitos pequenos (r ≈ 0.20), o N mínimo sobe para
              aproximadamente 194. Com N={metrics.completed} completos, a análise tem poder adequado para detectar
              efeitos{" "}
              {metrics.completed >= 62
                ? "moderados a grandes. Recomenda-se prosseguir com as análises principais."
                : metrics.completed >= 30
                ? "grandes (r > 0.50). Resultados negativos devem ser interpretados com cautela quanto ao poder."
                : "apenas muito grandes (r > 0.65). Os achados atuais têm caráter exploratório e não permitem conclusões inferenciais robustas."
              }
            </p>
          )}

          {/* DCCA methodological note */}
          <p>
            <strong>ρDCCA (Zebende, 2011):</strong> A análise de correlação cruzada sem tendência será plenamente
            interpretável a partir de N ≥ 20 com dados completos nos quatro instrumentos principais (CSS-33, BAI, GSE,
            IGT). Esta técnica complementa o Pearson ao revelar dependências de longo alcance que correlações lineares
            simples não capturam, sendo particularmente indicada para verificar se a associação entre cybercondria e
            tomada de decisão é estável em diferentes escalas de agregação.
          </p>

          {/* Moderation H3 */}
          <p>
            <strong>Moderação (H3):</strong> A análise de moderação da autoeficácia sobre a relação CSS-33 → IGT
            requer subgrupos com N suficiente após divisão pela mediana da GSE. Recomenda-se N total ≥ 40 para que
            cada subgrupo tenha poder adequado. Alternativamente, considerar análise de moderação contínua via
            regressão com produto de interação (CSS-33 × GSE → IGT), que preserva toda a variância amostral.
          </p>
        </Prose>
      </div>

      {/* ── 3. CONCLUSÃO ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionTitle>3. Conclusão Parcial</SectionTitle>
        <Prose>
          <p>
            Com base nos dados coletados até o momento (N={metrics.completed} participantes completos),
            é possível delinear as seguintes conclusões parciais:
          </p>

          {stats.n.css33 >= 3 && (
            <p>
              A amostra apresenta nível{" "}
              {stats.means.css33 > 66 ? "elevado" : stats.means.css33 > 33 ? "moderado" : "baixo"}{" "}
              de cybercondria (M = {stats.means.css33}) e nível{" "}
              {baiLevel(stats.means.bai)} de ansiedade (BAI M = {stats.means.bai}),
              {stats.means.css33 > 33 && stats.means.bai > 10
                ? " com co-ocorrência de cybercondria e sintomas ansiosos — padrão consistente com a literatura que descreve esses construtos como mutuamente amplificadores (Starcevic & Berle, 2013)."
                : " sem co-ocorrência marcada de ansiedade clínica, o que permitirá isolar a contribuição específica da cybercondria na tomada de decisão."
              }
            </p>
          )}

          {stats.n.igt >= 3 && (
            <p>
              No IGT, o padrão de tomada de decisão observado é{" "}
              <strong>{igtInterpret(stats.means.igt)}</strong> (NET médio = {stats.means.igt > 0 ? "+" : ""}{stats.means.igt}),
              {stats.h1.r != null
                ? ` com correlação ${rInterpret(stats.h1.r)} em relação à cybercondria (r = ${stats.h1.r}).`
                : " embora a correlação com cybercondria ainda não possa ser calculada com precisão pelo tamanho amostral atual."
              }
            </p>
          )}

          <p>
            {metrics.completed < 30
              ? `Os resultados têm caráter exploratório e descritivo neste estágio. A continuidade da coleta é necessária para atingir poder estatístico adequado às análises inferenciais previstas no pré-projeto. Recomenda-se manter o recrutamento ativo até N ≥ 60 participantes completos.`
              : metrics.completed < 62
              ? `Os dados já permitem análises inferenciais para efeitos grandes (r > 0.50). Para as hipóteses principais (H1, H2), que pressupõem efeitos moderados, recomenda-se expandir a amostra até N ≥ 62 antes das análises finais.`
              : `Com N = ${metrics.completed} participantes completos, o estudo possui poder estatístico adequado para detectar efeitos moderados (r ≈ 0.35). As análises principais podem ser conduzidas, com atenção especial à análise de moderação (H3), que requer subgrupos balanceados.`
            }
          </p>
        </Prose>

        {/* Disclaimer */}
        <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Nota:</strong> Este relatório é gerado automaticamente com base nos dados disponíveis no momento
            da última atualização. As interpretações têm caráter orientativo e devem ser revisadas pela pesquisadora
            responsável à luz do contexto teórico e das decisões metodológicas do estudo.
            Referências: Beck et al. (1988); Bechara et al. (1994); Cohen (1988); Damasio (1994);
            Schwarzer &amp; Jerusalem (1995); Silva et al. (2016); Starcevic &amp; Berle (2013); Zebende (2011).
          </p>
        </div>
      </div>

    </div>
  );
}
