import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-ba772e44/health", (c) => c.json({ status: "ok" }));

// ─── STUDY ROUTES ─────────────────────────────────────────────────────────────

// Initialize participant session
app.post("/make-server-ba772e44/study/init", async (c) => {
  try {
    const participantId = crypto.randomUUID();
    const ua = c.req.header("user-agent") || "";
    const now = new Date().toISOString();

    const isMobile = /Mobile|Android|iPhone/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|OPR|Opera)[/\s](\d+)/)?.[1] || "Unknown";
    const os = ua.match(/(Windows NT|Mac OS X|Linux|Android|iOS|iPhone OS)/)?.[1]?.replace("NT", "").replace("OS X", "macOS").replace("iPhone OS", "iOS") || "Unknown";

    const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
               c.req.header("cf-connecting-ip") ||
               c.req.header("x-real-ip") || "unknown";

    let geo = { country: null as string | null, state: null as string | null, city: null as string | null };
    const isPrivateIp = !ip || ip === "unknown" || /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
    if (!isPrivateIp) {
      try {
        const r = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
          const g = await r.json();
          geo = { country: g.country_name || null, state: g.region || null, city: g.city || null };
        }
      } catch (e) { console.log("Geo lookup failed:", e); }
    }

    const igtGroup = Math.floor(Math.random() * 4);

    const participant = {
      participant_id: participantId,
      session_start: now,
      session_end: null,
      duration_minutes: null,
      user_agent: ua,
      ip_address: ip,
      device_type: deviceType,
      browser,
      os,
      country: geo.country,
      state: geo.state,
      city: geo.city,
      igt_group: igtGroup,
      status: "in_progress",
      created_at: now,
    };

    await kv.set(`participant:${participantId}`, participant);
    return c.json({ success: true, participantId, igtGroup, sessionStart: now }, 201);
  } catch (e) {
    console.log("Error /study/init:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Save consent
app.post("/make-server-ba772e44/study/consent/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const p = await kv.get(`participant:${id}`);
    if (!p) return c.json({ success: false, error: "Participante não encontrado" }, 404);
    await kv.set(`participant:${id}`, { ...p, consent_at: new Date().toISOString() });
    return c.json({ success: true });
  } catch (e) {
    console.log("Error /study/consent:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Save sociodemographic
app.post("/make-server-ba772e44/study/sociodemographic/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const record = {
      participant_id: id,
      age: data.age,
      gender: data.gender,
      education: data.education,
      occupation: data.occupation,
      marital_status: data.maritalStatus,
      monthly_income: data.monthlyIncome,
      internet_hours: data.internetHours,
      chronic_condition: data.chronicCondition,
      psychiatric_diagnosis: data.psychiatricDiagnosis,
      medications: data.medications,
      health_search_frequency: data.healthSearchFrequency,
      healthcare_access: data.healthcareAccess,
      created_at: new Date().toISOString(),
    };
    await kv.set(`socio:${id}`, record);
    return c.json({ success: true }, 201);
  } catch (e) {
    console.log("Error /study/sociodemographic:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Save CSS-33
app.post("/make-server-ba772e44/study/css33/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const responses: Record<string, number> = data.responses || {};
    const total = Object.values(responses).reduce((s, v) => s + Number(v), 0);
    const sub = (items: number[]) => items.reduce((s, i) => s + (Number(responses[`item_${i}`]) || 0), 0);
    const record = {
      participant_id: id,
      responses,
      total_score: total,
      score_compulsion: sub([1, 2, 5, 13, 18, 29, 31]),
      score_distress: sub([7, 10, 22, 32]),
      score_excess: sub([3, 6, 8, 12, 14, 17, 24, 25]),
      score_reassurance: sub([4, 15, 16, 26]),
      score_distrust: sub([9, 19, 28, 30, 33]),
      created_at: new Date().toISOString(),
    };
    await kv.set(`css33:${id}`, record);
    return c.json({ success: true, total_score: total }, 201);
  } catch (e) {
    console.log("Error /study/css33:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Save BAI
app.post("/make-server-ba772e44/study/bai/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const responses: Record<string, number> = data.responses || {};
    const total = Object.values(responses).reduce((s, v) => s + Number(v), 0);
    const record = { participant_id: id, responses, total_score: total, created_at: new Date().toISOString() };
    await kv.set(`bai:${id}`, record);
    return c.json({ success: true, total_score: total }, 201);
  } catch (e) {
    console.log("Error /study/bai:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Save GSE
app.post("/make-server-ba772e44/study/gse/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const responses: Record<string, number> = data.responses || {};
    const total = Object.values(responses).reduce((s, v) => s + Number(v), 0);
    const record = { participant_id: id, responses, total_score: total, created_at: new Date().toISOString() };
    await kv.set(`gse:${id}`, record);
    return c.json({ success: true, total_score: total }, 201);
  } catch (e) {
    console.log("Error /study/gse:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Save IGT
app.post("/make-server-ba772e44/study/igt/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    const trials: any[] = data.trials || [];
    const finalBalance = data.finalBalance || 0;

    // Net scores = contagem (vantajoso − desvantajoso) por bloco de 20 tentativas
    // Padrão Inquisit: deck3(C)/deck4(D) = vantajoso; deck1(A)/deck2(B) = desvantajoso
    const netBlock = (from: number, to: number) => {
      const block = trials.filter(t => t.trial_number >= from && t.trial_number <= to);
      const adv = block.filter(t => t.deck_chosen === "C" || t.deck_chosen === "D").length;
      const disadv = block.filter(t => t.deck_chosen === "A" || t.deck_chosen === "B").length;
      return adv - disadv;
    };

    const countTotal = (type: "adv" | "disadv") =>
      trials.filter(t => type === "adv"
        ? (t.deck_chosen === "C" || t.deck_chosen === "D")
        : (t.deck_chosen === "A" || t.deck_chosen === "B")
      ).length;

    const p = await kv.get(`participant:${id}`);
    const summary = {
      participant_id: id,
      total_trials: trials.length,
      final_balance: finalBalance,
      count_advantageous: countTotal("adv"),
      count_disadvantageous: countTotal("disadv"),
      net_total: countTotal("adv") - countTotal("disadv"),
      net1: netBlock(1, 20),
      net2: netBlock(21, 40),
      net3: netBlock(41, 60),
      net4: netBlock(61, 80),
      net5: netBlock(81, 100),
      igt_group: p?.igt_group ?? 0,
      created_at: new Date().toISOString(),
    };

    await kv.set(`igt_sum:${id}`, summary);

    for (const trial of trials) {
      const padded = String(trial.trial_number).padStart(3, "0");
      await kv.set(`igt_trial:${id}:${padded}`, {
        participant_id: id,
        trial_number: trial.trial_number,
        deck_chosen: trial.deck_chosen,
        gain: trial.gain,
        loss: trial.loss,
        net_gain: trial.net_gain,
        running_total: trial.running_total,
        response_time_ms: trial.response_time_ms || 0,
        created_at: new Date().toISOString(),
      });
    }

    return c.json({ success: true }, 201);
  } catch (e) {
    console.log("Error /study/igt:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// Complete session
app.post("/make-server-ba772e44/study/complete/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const p = await kv.get(`participant:${id}`);
    if (!p) return c.json({ success: false, error: "Participante não encontrado" }, 404);
    const now = new Date().toISOString();
    const duration = (new Date(now).getTime() - new Date(p.session_start).getTime()) / 60000;
    await kv.set(`participant:${id}`, {
      ...p,
      session_end: now,
      status: "completed",
      duration_minutes: Math.round(duration * 100) / 100,
    });
    return c.json({ success: true, durationMinutes: duration });
  } catch (e) {
    console.log("Error /study/complete:", e);
    return c.json({ success: false, error: String(e) }, 500);
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

const ADMIN_USERNAME = "joseaparecido";
const ADMIN_PASSWORD = "uspribeiraopreto";

// Login com validação de credenciais
app.post("/make-server-ba772e44/admin/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return c.json({ success: false, error: "Usuário ou senha incorretos." }, 401);
    }
    const token = `adm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return c.json({ success: true, token });
  } catch (e) {
    return c.json({ success: false, error: String(e) }, 500);
  }
});

app.get("/make-server-ba772e44/admin/metrics", async (c) => {
  try {
    const participants = await kv.getByPrefix("participant:") as any[];
    const socioList = await kv.getByPrefix("socio:") as any[];
    const total = participants.length;
    const completed = participants.filter(p => p.status === "completed").length;
    const durations = participants.filter(p => p.duration_minutes != null).map(p => p.duration_minutes as number);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const countBy = (arr: any[], key: string) => arr.reduce((acc: Record<string, number>, item) => {
      const val = item[key] || "Desconhecido";
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    const genders = countBy(socioList, "gender");
    const devices = countBy(participants, "device_type");
    const browsers = countBy(participants, "browser");
    const states = countBy(participants, "state");
    const healthcare = countBy(socioList, "healthcare_access");

    // Completions over time (last 30 days)
    const dailyCompletions: Record<string, number> = {};
    participants.forEach(p => {
      if (p.status === "completed" && p.session_end) {
        const day = p.session_end.slice(0, 10);
        dailyCompletions[day] = (dailyCompletions[day] || 0) + 1;
      }
    });

    return c.json({
      total,
      completed,
      inProgress: total - completed,
      completionRate: total > 0 ? Math.round(completed / total * 1000) / 10 : 0,
      avgDuration: Math.round(avgDuration * 100) / 100,
      genders,
      devices,
      browsers,
      states,
      healthcare,
      dailyCompletions,
    });
  } catch (e) {
    console.log("Error /admin/metrics:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/make-server-ba772e44/admin/participants", async (c) => {
  try {
    const data = await kv.getByPrefix("participant:");
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get("/make-server-ba772e44/admin/sociodemographic", async (c) => {
  try {
    const data = await kv.getByPrefix("socio:");
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get("/make-server-ba772e44/admin/bai", async (c) => {
  try {
    const data = await kv.getByPrefix("bai:");
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get("/make-server-ba772e44/admin/css33", async (c) => {
  try {
    const data = await kv.getByPrefix("css33:");
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get("/make-server-ba772e44/admin/gse", async (c) => {
  try {
    const data = await kv.getByPrefix("gse:");
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get("/make-server-ba772e44/admin/analytics", async (c) => {
  try {
    const socioList  = await kv.getByPrefix("socio:")    as any[];
    const baiList    = await kv.getByPrefix("bai:")      as any[];
    const css33List  = await kv.getByPrefix("css33:")    as any[];
    const gseList    = await kv.getByPrefix("gse:")      as any[];
    const igtList    = await kv.getByPrefix("igt_sum:")  as any[];

    const byPid = (list: any[]) =>
      Object.fromEntries(list.map(r => [r.participant_id, r]));
    const baiMap   = byPid(baiList);
    const css33Map = byPid(css33List);
    const gseMap   = byPid(gseList);
    const igtMap   = byPid(igtList);

    const countBy = (arr: any[], key: string) =>
      arr.reduce((acc: Record<string, number>, item) => {
        const val = item[key] || "Desconhecido";
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

    const healthSearchFrequency = countBy(socioList, "health_search_frequency");
    const internetHours         = countBy(socioList, "internet_hours");

    const ageGroups: Record<string, number> = {};
    socioList.forEach(s => {
      const age = Number(s.age);
      if (isNaN(age)) return;
      const g = age <= 17 ? "16–17" : age <= 24 ? "18–24" : age <= 34 ? "25–34"
              : age <= 44 ? "35–44" : age <= 54 ? "45–54" : "55+";
      ageGroups[g] = (ageGroups[g] || 0) + 1;
    });

    const ihOrd: Record<string, number> = {
      "Menos de 1 hora": 0.5, "1–3 horas": 2, "3–6 horas": 4.5,
      "6–9 horas": 7.5, "Mais de 9 horas": 10,
    };
    const hsfOrd: Record<string, number> = {
      "Raramente": 1, "Às vezes": 2, "Frequentemente": 3, "Sempre": 4,
    };

    const correlationData = socioList.map(s => {
      const pid = s.participant_id;
      return {
        participant_id: pid,
        age:                    Number(s.age) || null,
        internet_hours_ord:     ihOrd[s.internet_hours]              ?? null,
        internet_hours_label:   s.internet_hours   || null,
        health_search_freq_ord: hsfOrd[s.health_search_frequency]    ?? null,
        health_search_freq_label: s.health_search_frequency          || null,
        gender:         s.gender         || null,
        education:      s.education      || null,
        monthly_income: s.monthly_income || null,
        css33_total:         css33Map[pid] ? Number(css33Map[pid].total_score)          : null,
        css33_compulsion:    css33Map[pid] ? Number(css33Map[pid].score_compulsion)     : null,
        css33_distress:      css33Map[pid] ? Number(css33Map[pid].score_distress)       : null,
        css33_excess:        css33Map[pid] ? Number(css33Map[pid].score_excess)         : null,
        css33_reassurance:   css33Map[pid] ? Number(css33Map[pid].score_reassurance)    : null,
        css33_distrust:      css33Map[pid] ? Number(css33Map[pid].score_distrust)       : null,
        bai_total:   baiMap[pid]   ? Number(baiMap[pid].total_score)   : null,
        gse_total:   gseMap[pid]   ? Number(gseMap[pid].total_score)   : null,
        igt_net:     igtMap[pid]   ? Number(igtMap[pid].net_total)     : null,
        igt_balance: igtMap[pid]   ? Number(igtMap[pid].final_balance) : null,
        igt_net_b1:  igtMap[pid]   ? Number(igtMap[pid].net1)        : null,
        igt_net_b2:  igtMap[pid]   ? Number(igtMap[pid].net2)        : null,
        igt_net_b3:  igtMap[pid]   ? Number(igtMap[pid].net3)        : null,
        igt_net_b4:  igtMap[pid]   ? Number(igtMap[pid].net4)        : null,
        igt_net_b5:  igtMap[pid]   ? Number(igtMap[pid].net5)        : null,
      };
    });

    return c.json({
      healthSearchFrequency,
      internetHours,
      ageGroups,
      correlationData,
      ageGroupOrder:       ["16–17", "18–24", "25–34", "35–44", "45–54", "55+"],
      internetHoursOrder:  ["Menos de 1 hora", "1–3 horas", "3–6 horas", "6–9 horas", "Mais de 9 horas"],
      healthSearchOrder:   ["Raramente", "Às vezes", "Frequentemente", "Sempre"],
    });
  } catch (e) {
    console.log("Error /admin/analytics:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/make-server-ba772e44/admin/igt-summary", async (c) => {
  try {
    const data = await kv.getByPrefix("igt_sum:");
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

app.get("/make-server-ba772e44/admin/igt-trials", async (c) => {
  try {
    const participantId = c.req.query("participant");
    const prefix = participantId ? `igt_trial:${participantId}:` : "igt_trial:";
    const data = await kv.getByPrefix(prefix);
    return c.json(data);
  } catch (e) { return c.json({ error: String(e) }, 500); }
});

Deno.serve(app.fetch);