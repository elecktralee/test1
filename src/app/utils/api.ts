import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ba772e44`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

// ─── Study API ───────────────────────────────────────────────────────────────

export const studyApi = {
  init: () =>
    request<{ success: boolean; participantId: string; igtGroup: number; sessionStart: string }>(
      "/study/init",
      { method: "POST" }
    ),

  consent: (id: string) =>
    request<{ success: boolean }>(`/study/consent/${id}`, { method: "POST" }),

  saveSociodemographic: (id: string, data: Record<string, any>) =>
    request<{ success: boolean }>(`/study/sociodemographic/${id}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  saveCSS33: (id: string, responses: Record<string, number>) =>
    request<{ success: boolean; total_score: number }>(`/study/css33/${id}`, {
      method: "POST",
      body: JSON.stringify({ responses }),
    }),

  saveBAI: (id: string, responses: Record<string, number>) =>
    request<{ success: boolean; total_score: number }>(`/study/bai/${id}`, {
      method: "POST",
      body: JSON.stringify({ responses }),
    }),

  saveGSE: (id: string, responses: Record<string, number>) =>
    request<{ success: boolean; total_score: number }>(`/study/gse/${id}`, {
      method: "POST",
      body: JSON.stringify({ responses }),
    }),

  saveIGT: (id: string, trials: any[], finalBalance: number) =>
    request<{ success: boolean }>(`/study/igt/${id}`, {
      method: "POST",
      body: JSON.stringify({ trials, finalBalance }),
    }),

  complete: (id: string) =>
    request<{ success: boolean; durationMinutes: number }>(`/study/complete/${id}`, {
      method: "POST",
    }),
};

// ─── Admin API ───────────────────────────────────────────────────────────────

export const adminApi = {
  login: (username: string, password: string) =>
    request<{ success: boolean; token: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  metrics: () =>
    request<any>("/admin/metrics"),

  participants: () =>
    request<any[]>("/admin/participants"),

  sociodemographic: () =>
    request<any[]>("/admin/sociodemographic"),

  bai: () =>
    request<any[]>("/admin/bai"),

  css33: () =>
    request<any[]>("/admin/css33"),


  gse: () =>
    request<any[]>("/admin/gse"),


  igtSummary: () =>
    request<any[]>("/admin/igt-summary"),


  igtTrials: (participantId?: string) =>
    request<any[]>(`/admin/igt-trials${participantId ? `?participant=${participantId}` : ""}`),

  analytics: () =>
    request<any>("/admin/analytics"),

  deleteParticipant: (participantId: string) =>
    request<{ success: boolean }>(`/admin/participants/${participantId}`, {
      method: "DELETE",
    }),
};