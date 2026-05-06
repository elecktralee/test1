// localStorage utilities for study state persistence

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch { return null; }
  },

  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },

  remove: (key: string) => {
    try { localStorage.removeItem(key); } catch {}
  },
};

// Study-specific helpers
export const STORAGE_KEYS = {
  PARTICIPANT_ID: "cs_participant_id",
  IGT_GROUP: "cs_igt_group",
  SESSION_START: "cs_session_start",
  CSS33: "cs_css33",
  BAI: "cs_bai",
  GSE: "cs_gse",
  IGT_TRIALS: "cs_igt_trials",
  IGT_DECK_INDEXES: "cs_igt_deck_indexes",
  IGT_BALANCE: "cs_igt_balance",
  ADMIN_TOKEN: "cs_admin_token",
  COMPLETED_STEPS: "cs_completed_steps",
};

export function getParticipantId(): string | null {
  return storage.get<string>(STORAGE_KEYS.PARTICIPANT_ID);
}

export function requireParticipant(): string {
  const id = getParticipantId();
  if (!id) {
    window.location.href = "/";
    throw new Error("Sessão não encontrada");
  }
  return id;
}

export function markStepComplete(step: string) {
  const steps = storage.get<string[]>(STORAGE_KEYS.COMPLETED_STEPS) || [];
  if (!steps.includes(step)) {
    storage.set(STORAGE_KEYS.COMPLETED_STEPS, [...steps, step]);
  }
}

export function isStepComplete(step: string): boolean {
  const steps = storage.get<string[]>(STORAGE_KEYS.COMPLETED_STEPS) || [];
  return steps.includes(step);
}

export function clearStudyData() {
  Object.values(STORAGE_KEYS).forEach(k => {
    if (k !== STORAGE_KEYS.ADMIN_TOKEN) storage.remove(k);
  });
}
