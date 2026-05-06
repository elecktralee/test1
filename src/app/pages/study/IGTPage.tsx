import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { StudyLayout } from "../../components/StudyLayout";
import {
  IGT_DECKS,
  IGT_INITIAL_BALANCE,
  IGT_TOTAL_TRIALS,
  IGT_RANDOMIZATION_GROUPS,
  initPools,
  drawLoss,
  isAdvantageous,
  type DeckId,
  type DeckPools,
} from "../../data/igt-config";
import { studyApi } from "../../utils/api";
import { storage, STORAGE_KEYS, requireParticipant, markStepComplete } from "../../utils/storage";

// ── Deck visual config ─────────────────────────────────────────────────────────
const DECK_STYLE: Record<
  DeckId,
  { bg: string; border: string; accent: string; suit: string; glow: string; ring: string }
> = {
  A: {
    bg: "linear-gradient(160deg, #2d1515 0%, #120808 100%)",
    border: "#7f1d1d",
    accent: "#fca5a5",
    suit: "♠",
    glow: "rgba(252,165,165,0.55)",
    ring: "#ef4444",
  },
  B: {
    bg: "linear-gradient(160deg, #15152d, #080812)",
    border: "#1e1b4b",
    accent: "#a5b4fc",
    suit: "♥",
    glow: "rgba(165,180,252,0.55)",
    ring: "#6366f1",
  },
  C: {
    bg: "linear-gradient(160deg, #0a2d1a, #041208)",
    border: "#14532d",
    accent: "#6ee7b7",
    suit: "♦",
    glow: "rgba(110,231,183,0.55)",
    ring: "#10b981",
  },
  D: {
    bg: "linear-gradient(160deg, #1e152d, #0d0812)",
    border: "#3b0764",
    accent: "#d8b4fe",
    suit: "♣",
    glow: "rgba(216,180,254,0.55)",
    ring: "#a855f7",
  },
};

interface Trial {
  trial_number: number;
  deck_chosen: DeckId;
  gain: number;
  loss: number;
  net_gain: number;
  running_total: number;
  response_time_ms: number;
  advantageous: boolean;
}

type Phase = "instructions" | "choosing" | "feedback" | "saving" | "results";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ── DeckCard ──────────────────────────────────────────────────────────────────
function DeckCard({
  deck,
  onClick,
  disabled = false,
  isChosen = false,
  isOther = false,
  entryDelay = 0,
}: {
  deck: DeckId;
  onClick?: () => void;
  disabled?: boolean;
  isChosen?: boolean;
  isOther?: boolean;
  entryDelay?: number;
}) {
  const s = DECK_STYLE[deck];
  const interactive = !disabled && !isChosen && !isOther;

  return (
    <motion.div
      style={{ perspective: "900px" }}
      className="w-full"
      initial={{ y: 50, opacity: 0, scale: 0.85 }}
      animate={
        isChosen
          ? { y: -18, scale: 1.1, opacity: 1 }
          : isOther
          ? { y: 2, scale: 0.93, opacity: 0.22 }
          : { y: 0, scale: 1, opacity: 1 }
      }
      transition={
        isChosen
          ? { type: "spring", stiffness: 260, damping: 18, delay: 0 }
          : isOther
          ? { type: "spring", stiffness: 320, damping: 26, delay: 0 }
          : { type: "spring", stiffness: 220, damping: 20, delay: entryDelay }
      }
    >
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={interactive ? { y: -10, scale: 1.04, rotateY: 4 } : {}}
        whileTap={interactive ? { scale: 0.95, rotateY: -2 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative w-full outline-none border-0 bg-transparent cursor-pointer select-none"
        style={{ minHeight: "140px", aspectRatio: "2/3", maxHeight: "210px" }}
        aria-label={`Baralho ${deck}`}
      >
        {isChosen && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ boxShadow: `0 0 40px 8px ${s.glow}, 0 0 0 2px ${s.ring}` }}
          />
        )}
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col items-center justify-between px-3 py-3"
          style={{
            background: s.bg,
            border: `1.5px solid ${isChosen ? s.ring : "rgba(255,255,255,0.07)"}`,
            boxShadow: isChosen
              ? `0 12px 40px ${s.glow}`
              : interactive
              ? "0 4px 16px rgba(0,0,0,0.5)"
              : "0 2px 8px rgba(0,0,0,0.4)",
            transition: "box-shadow 0.3s, border-color 0.3s",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="self-start z-10 leading-none">
            <div className="font-black text-base leading-none" style={{ color: s.accent }}>
              {deck}
            </div>
            <div
              className="text-xs mt-0.5 leading-none"
              style={{ color: s.accent, opacity: 0.7 }}
            >
              {s.suit}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 z-10">
            <motion.span
              className="font-black leading-none"
              style={{
                fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)",
                color: s.accent,
                textShadow: `0 0 28px ${s.glow}`,
              }}
              animate={
                isChosen
                  ? {
                      textShadow: [
                        `0 0 16px ${s.glow}`,
                        `0 0 48px ${s.glow}`,
                        `0 0 24px ${s.glow}`,
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 1.2,
                repeat: isChosen ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              {deck}
            </motion.span>
            <span className="text-xl opacity-60 leading-none" style={{ color: s.accent }}>
              {s.suit}
            </span>
          </div>
          <div className="self-end z-10 rotate-180 leading-none">
            <div className="font-black text-base leading-none" style={{ color: s.accent }}>
              {deck}
            </div>
            <div
              className="text-xs mt-0.5 leading-none"
              style={{ color: s.accent, opacity: 0.7 }}
            >
              {s.suit}
            </div>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

// ── MoneyBubble ───────────────────────────────────────────────────────────────
function MoneyBubble({
  amount,
  type,
  delay = 0,
}: {
  amount: number;
  type: "gain" | "loss";
  delay?: number;
}) {
  const isGain = type === "gain";
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 16 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-2xl"
        style={{
          background: isGain
            ? "radial-gradient(circle at 38% 30%, #86efac, #15803d)"
            : "radial-gradient(circle at 38% 30%, #fca5a5, #b91c1c)",
          boxShadow: isGain
            ? "0 0 32px rgba(134,239,172,0.55), inset 0 2px 6px rgba(255,255,255,0.25)"
            : "0 0 32px rgba(252,165,165,0.55), inset 0 2px 6px rgba(255,255,255,0.25)",
        }}
      >
        <div
          className="absolute top-2 left-3 w-6 h-3 rounded-full opacity-40"
          style={{ background: "rgba(255,255,255,0.7)", filter: "blur(3px)" }}
        />
        <span className="text-white font-black text-xl leading-none z-10 drop-shadow">
          {isGain ? "+" : "−"}
        </span>
        <span className="text-white font-bold text-xs leading-none z-10 drop-shadow">
          R${amount}
        </span>
      </div>
      <span
        className={`text-xs font-bold uppercase tracking-widest ${
          isGain ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isGain ? "Ganho" : "Taxa"}
      </span>
    </motion.div>
  );
}

// ── EmptyLossBubble ───────────────────────────────────────────────────────────
function EmptyLossBubble({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 0.3, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600"
        style={{ background: "rgba(30,41,59,0.4)" }}
      >
        <span className="text-slate-500 font-black text-xl leading-none">—</span>
        <span className="text-slate-600 text-xs leading-none mt-1">R$0</span>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
        Sem taxa
      </span>
    </motion.div>
  );
}

// ── CollectButton ─────────────────────────────────────────────────────────────
function CollectButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative flex items-center justify-center py-2">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "100%",
          maxWidth: "320px",
          height: "64px",
          border: "2px solid rgba(34,197,94,0.5)",
        }}
        animate={{ scale: [1, 1.35, 1.35], opacity: [0.7, 0, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "100%",
          maxWidth: "320px",
          height: "64px",
          border: "2px solid rgba(34,197,94,0.4)",
        }}
        animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
      />
      <motion.button
        onClick={onClick}
        animate={{
          scale: [1, 1.04, 1],
          boxShadow: [
            "0 0 0px 0px rgba(34,197,94,0.7), 0 4px 20px rgba(0,0,0,0.5)",
            "0 0 24px 6px rgba(34,197,94,0.35), 0 4px 20px rgba(0,0,0,0.5)",
            "0 0 0px 0px rgba(34,197,94,0.7), 0 4px 20px rgba(0,0,0,0.5)",
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{
          scale: 1.07,
          boxShadow: "0 0 36px 8px rgba(34,197,94,0.5), 0 6px 24px rgba(0,0,0,0.6)",
        }}
        whileTap={{ scale: 0.96 }}
        className="relative z-10 w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-black text-xl tracking-widest text-white cursor-pointer outline-none border-0"
        style={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
          minWidth: "220px",
          maxWidth: "320px",
          letterSpacing: "0.12em",
        }}
      >
        <span className="text-2xl">💰</span>
        COLETAR
        <span className="text-2xl">💰</span>
      </motion.button>
    </div>
  );
}

// ── NetBanner ─────────────────────────────────────────────────────────────────
function NetBanner({ net, delay = 0.4 }: { net: number; delay?: number }) {
  const isPos = net >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 350, damping: 22 }}
      className="flex items-center justify-center gap-2 rounded-xl py-2 px-4 mx-auto"
      style={{
        background: isPos ? "rgba(21,128,61,0.18)" : "rgba(185,28,28,0.18)",
        border: `1px solid ${
          isPos ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"
        }`,
        maxWidth: "260px",
      }}
    >
      <span className={`font-black text-lg ${isPos ? "text-emerald-400" : "text-red-400"}`}>
        {isPos ? "▲" : "▼"}
      </span>
      <span className={`font-black text-base ${isPos ? "text-emerald-300" : "text-red-300"}`}>
        Resultado: {fmt(net)}
      </span>
    </motion.div>
  );
}

// ── IGTPage ───────────────────────────────────────────────────────────────────
export default function IGTPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("instructions");
  const [balance, setBalance] = useState(IGT_INITIAL_BALANCE);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [pools, setPools] = useState<DeckPools>(() => initPools());
  const [lastTrial, setLastTrial] = useState<Trial | null>(null);
  const [group, setGroup] = useState(0);
  const [chosenDeck, setChosenDeck] = useState<DeckId | null>(null);
  const [apiError, setApiError] = useState("");
  const trialStartTime = useRef<number>(Date.now());

  // ── Restore from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const savedTrials = storage.get<Trial[]>(STORAGE_KEYS.IGT_TRIALS) || [];
    const savedPools = storage.get<DeckPools>(STORAGE_KEYS.IGT_DECK_INDEXES);
    const savedBalance = storage.get<number>(STORAGE_KEYS.IGT_BALANCE);
    const savedGroup = storage.get<number>(STORAGE_KEYS.IGT_GROUP) ?? 0;
    setGroup(savedGroup);
    if (savedTrials.length > 0) {
      setTrials(savedTrials);
      setBalance(savedBalance ?? IGT_INITIAL_BALANCE);
      if (savedPools) setPools(savedPools);
      if (savedTrials.length < IGT_TOTAL_TRIALS) {
        setPhase("choosing");
        trialStartTime.current = Date.now();
      }
    }
  }, []);

  // ── Keyboard: Enter / Space → COLETAR ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "feedback") return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        collect();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trials.length]);

  const deckMapping = IGT_RANDOMIZATION_GROUPS[group];

  // ── Choose deck ───────────────────────────────────────────────────────────
  const handleChooseDeck = (deckId: DeckId) => {
    if (phase !== "choosing") return;
    const responseTime = Date.now() - trialStartTime.current;
    const trialNum = trials.length + 1;
    const { loss, newPools } = drawLoss(deckId, pools);
    const gain = IGT_DECKS[deckId].gain;
    const netGain = gain - loss;
    const newBalance = balance + netGain;
    const trial: Trial = {
      trial_number: trialNum,
      deck_chosen: deckId,
      gain,
      loss,
      net_gain: netGain,
      running_total: newBalance,
      response_time_ms: responseTime,
      advantageous: isAdvantageous(deckId),
    };
    const newTrials = [...trials, trial];
    setLastTrial(trial);
    setTrials(newTrials);
    setBalance(newBalance);
    setPools(newPools);
    setChosenDeck(deckId);
    setPhase("feedback");
    storage.set(STORAGE_KEYS.IGT_TRIALS, newTrials);
    storage.set(STORAGE_KEYS.IGT_DECK_INDEXES, newPools);
    storage.set(STORAGE_KEYS.IGT_BALANCE, newBalance);
  };

  // ── Finish (save + navigate) ──────────────────────────────────────────────
  const finish = async (currentTrials: Trial[], currentBalance: number) => {
    setPhase("saving");
    setApiError("");
    try {
      const id = requireParticipant();
      await studyApi.saveIGT(id, currentTrials, currentBalance);
      await studyApi.complete(id);
      markStepComplete("igt");
      storage.remove(STORAGE_KEYS.IGT_TRIALS);
      storage.remove(STORAGE_KEYS.IGT_DECK_INDEXES);
      storage.remove(STORAGE_KEYS.IGT_BALANCE);
      navigate("/conclusao");
    } catch (_err) {
      setApiError("Erro ao salvar. Tente novamente.");
      setPhase("feedback");
    }
  };

  // ── Collect (advance or finish) ───────────────────────────────────────────
  const collect = () => {
    if (trials.length >= IGT_TOTAL_TRIALS) {
      finish(trials, balance);
    } else {
      setPhase("choosing");
      setChosenDeck(null);
      trialStartTime.current = Date.now();
    }
  };

  const trialNumber = trials.length;
  const progress = (trialNumber / IGT_TOTAL_TRIALS) * 100;
  const isComplete = trialNumber >= IGT_TOTAL_TRIALS;

  // ── INSTRUCTIONS ──────────────────────────────────────────────────────────
  if (phase === "instructions") {
    return (
      <StudyLayout currentStep="igt" maxWidth="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
        >
          <div className="bg-gradient-to-r from-blue-800 via-violet-800 to-emerald-800 px-6 py-5 text-white">
            <h2 className="text-xl font-bold">🃏 Iowa Gambling Task (IGT)</h2>
            <p className="text-white/60 text-sm mt-1">
              Bechara et al. (1994) — Tomada de Decisão
            </p>
          </div>
          <div className="p-6">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-5 text-sm text-slate-200 leading-relaxed mb-6">
              <p className="font-semibold text-white text-base mb-3">Instruções</p>
              <p className="mb-3">
                Nesta tarefa, você será solicitado(a) a selecionar uma carta de um dos quatro
                baralhos apresentados na tela.
              </p>
              <p className="mb-3">
                Em cada carta, você pode{" "}
                <span className="text-emerald-400 font-semibold">ganhar dinheiro</span>, mas
                também pode ter que{" "}
                <span className="text-red-400 font-semibold">pagar uma taxa para o banco</span>.
              </p>
              <p className="mb-3">
                Após cada tentativa, clique em{" "}
                <strong className="text-emerald-300">COLETAR</strong> para confirmar e seguir em
                frente.
              </p>
              <p className="mb-3">
                Você começa com{" "}
                <span className="text-yellow-400 font-bold">R$ 2.000,00</span>.
              </p>
              <p className="font-medium text-white">
                São <strong>100 tentativas</strong> no total (≈ 5–10 min). Tente maximizar seu
                saldo final!
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6" style={{ perspective: "900px" }}>
              {(["A", "B", "C", "D"] as DeckId[]).map((d, i) => (
                <DeckCard key={d} deck={d} disabled entryDelay={i * 0.1} />
              ))}
            </div>
            <motion.button
              onClick={() => {
                setPhase("choosing");
                trialStartTime.current = Date.now();
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black rounded-xl text-lg shadow-lg tracking-wide"
            >
              INICIAR →
            </motion.button>
          </div>
        </motion.div>
      </StudyLayout>
    );
  }

  // ── SAVING ────────────────────────────────────────────────────────────────
  if (phase === "saving") {
    return (
      <StudyLayout currentStep="igt" maxWidth="max-w-sm">
        <div className="bg-slate-900 rounded-2xl p-10 text-center shadow-xl border border-slate-700">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-200 font-medium">Salvando seus resultados...</p>
        </div>
      </StudyLayout>
    );
  }

  // ── GAME SCREEN ───────────────────────────────────────────────────────────
  return (
    <StudyLayout currentStep="igt" maxWidth="max-w-2xl">
      <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        {/* TOP BAR */}
        <div className="px-5 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Saldo Atual
              </p>
              <motion.p
                key={balance}
                initial={{ scale: 1.15, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`font-black text-2xl sm:text-3xl mt-0.5 ${
                  balance >= IGT_INITIAL_BALANCE ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {fmt(balance)}
              </motion.p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Cartas</p>
              <p className="text-white font-bold text-lg">
                {trialNumber}
                <span className="text-slate-500 font-normal text-sm">
                  /{IGT_TOTAL_TRIALS}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #6366f1, #10b981)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* GAME AREA */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4" style={{ perspective: "1000px" }}>
            {(["A", "B", "C", "D"] as DeckId[]).map((deckId, i) => (
              <DeckCard
                key={deckId}
                deck={deckId}
                onClick={phase === "choosing" ? () => handleChooseDeck(deckId) : undefined}
                disabled={phase !== "choosing"}
                isChosen={phase === "feedback" && deckId === chosenDeck}
                isOther={phase === "feedback" && deckId !== chosenDeck}
                entryDelay={phase === "choosing" && trialNumber === 0 ? i * 0.08 : 0}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {phase === "choosing" && (
              <motion.div
                key="choose-label"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mt-2 bg-slate-800/80 border border-slate-600/60 rounded-xl py-3 text-center"
              >
                <span className="text-slate-300 text-sm font-bold tracking-[0.18em] uppercase">
                  ✦ Escolha um baralho ✦
                </span>
              </motion.div>
            )}

            {phase === "feedback" && lastTrial && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <NetBanner net={lastTrial.net_gain} delay={0.15} />
                <div className="flex items-end justify-center gap-8 sm:gap-14 py-1">
                  <MoneyBubble amount={lastTrial.gain} type="gain" delay={0.1} />
                  {lastTrial.loss > 0 ? (
                    <MoneyBubble amount={lastTrial.loss} type="loss" delay={0.22} />
                  ) : (
                    <EmptyLossBubble delay={0.22} />
                  )}
                </div>
                {apiError && (
                  <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 text-sm text-center">
                    {apiError}
                  </div>
                )}
                {isComplete ? (
                  <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, type: "spring", stiffness: 280, damping: 20 }}
                    onClick={() => finish(trials, balance)}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xl rounded-2xl shadow-lg tracking-widest"
                  >
                    FINALIZAR TESTE →
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38, type: "spring", stiffness: 280, damping: 20 }}
                  >
                    <CollectButton onClick={collect} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-2 bg-slate-800 border-t border-slate-700 text-center">
          <p className="text-slate-600 text-xs">
            IGT · Bechara et al. (1994) · Grupo {group + 1}
          </p>
        </div>
      </div>
    </StudyLayout>
  );
}