// Iowa Gambling Task — Configuração completa
// Baseado na implementação PsyToolkit (https://www.psytoolkit.org/experiment-library/igt.html)
// Referência: Bechara et al. (1994)
//
// Estrutura simplificada (PsyToolkit):
//   Decks A e B (desvantajosos): ganho=$100, penalidade=$250 com 50% de chance
//   Decks C e D (vantajosos):    ganho=$50,  penalidade=$50  com 50% de chance
//
// Pool de 10 tentativas sem reposição (/ replace = false):
//   A/B: 5 × $0  +  5 × $250  → líquido/10 = -$250
//   C/D: 5 × $0  +  5 × $50   → líquido/10 = +$250

export type DeckId = "A" | "B" | "C" | "D";

export interface DeckConfig {
  id: DeckId;
  gain: number;
  lossPool: number[]; // 10 valores sorteados SEM REPOSIÇÃO por bloco
  label: "Desvantajoso" | "Vantajoso";
  color: "blue" | "green";
}

export const IGT_DECKS: Record<DeckId, DeckConfig> = {
  // ── Desvantajosos: ganho alto, perda alta ────────────────────────────────
  A: {
    id: "A",
    gain: 100,
    lossPool: [0, 0, 0, 0, 0, 250, 250, 250, 250, 250],
    label: "Desvantajoso",
    color: "blue",
  },
  B: {
    id: "B",
    gain: 100,
    lossPool: [0, 0, 0, 0, 0, 250, 250, 250, 250, 250],
    label: "Desvantajoso",
    color: "blue",
  },
  // ── Vantajosos: ganho menor, perda menor ─────────────────────────────────
  C: {
    id: "C",
    gain: 50,
    lossPool: [0, 0, 0, 0, 0, 50, 50, 50, 50, 50],
    label: "Vantajoso",
    color: "green",
  },
  D: {
    id: "D",
    gain: 50,
    lossPool: [0, 0, 0, 0, 0, 50, 50, 50, 50, 50],
    label: "Vantajoso",
    color: "green",
  },
};

export const IGT_INITIAL_BALANCE = 2000;
export const IGT_TOTAL_TRIALS = 100;

// ── Grupos de randomização (ordem das posições na tela) ──────────────────────
// Extraídos do script Inquisit original — deckOrderGroup 1–4
// Cada array mapeia posição visual [esq→dir] → deck [A/B/C/D]
export const IGT_RANDOMIZATION_GROUPS: Record<number, DeckId[]> = {
  0: ["A", "B", "C", "D"], // group 1
  1: ["C", "A", "D", "B"], // group 2
  2: ["D", "C", "B", "A"], // group 3
  3: ["B", "D", "A", "C"], // group 4
};

// ── Sorteio SEM REPOSIÇÃO (Fisher-Yates) ─────────────────────────────────────
export function shufflePool(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface DeckPools {
  A: number[];
  B: number[];
  C: number[];
  D: number[];
}

export function initPools(): DeckPools {
  return {
    A: shufflePool(IGT_DECKS.A.lossPool),
    B: shufflePool(IGT_DECKS.B.lossPool),
    C: shufflePool(IGT_DECKS.C.lossPool),
    D: shufflePool(IGT_DECKS.D.lossPool),
  };
}

// Sorteia uma perda sem reposição; reabastece automaticamente quando pool esgota
export function drawLoss(deck: DeckId, pools: DeckPools): { loss: number; newPools: DeckPools } {
  let remaining = [...pools[deck]];
  if (remaining.length === 0) {
    remaining = shufflePool(IGT_DECKS[deck].lossPool);
  }
  const idx = Math.floor(Math.random() * remaining.length);
  const loss = remaining[idx];
  remaining.splice(idx, 1);
  return { loss, newPools: { ...pools, [deck]: remaining } };
}

export function isAdvantageous(deck: DeckId): boolean {
  return deck === "C" || deck === "D";
}