import React, { useState } from "react";
import { useNavigate } from "react-router";
import { studyApi } from "../../utils/api";
import { storage, STORAGE_KEYS } from "../../utils/storage";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

const HERO_IMG = "https://images.unsplash.com/photo-1737505599159-5ffc1dcbc08f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJyYWluJTIwbmV1cmFsJTIwbmV0d29yayUyMGRpZ2l0YWwlMjBzY2llbmNlfGVufDF8fHx8MTc3Nzk4NzczNHww&ixlib=rb-4.1.0&q=80&w=1080";

const steps = [
  { n: "01", title: "Consentimento",      desc: "TCLE / TALE",                              time: "2 min",  color: "from-violet-500 to-indigo-500" },
  { n: "02", title: "Perfil",             desc: "Dados sociodemográficos",                  time: "3 min",  color: "from-indigo-500 to-blue-500" },
  { n: "03", title: "BAI",                desc: "Inventário de Ansiedade de Beck",          time: "3 min",  color: "from-blue-500 to-cyan-500" },
  { n: "04", title: "CSS-33",             desc: "Escala de Severidade da Cybercondria",     time: "5 min",  color: "from-cyan-500 to-teal-500" },
  { n: "05", title: "GSE",                desc: "Escala de Autoeficácia Geral",             time: "2 min",  color: "from-teal-500 to-emerald-500" },
  { n: "06", title: "Iowa Gambling Task", desc: "Tomada de Decisão · 100 tentativas",      time: "10 min", color: "from-emerald-500 to-green-500" },
];

const badges = [
  { label: "20–30 min",    icon: ClockIcon },
  { label: "Anônimo",      icon: LockIcon },
  { label: "LGPD",         icon: ShieldIcon },
  { label: "CEP aprovado", icon: CheckIcon },
];

// ── Inline SVG icons (sem emojis) ─────────────────────────────────────────────
function ClockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/>
    </svg>
  );
}
function LockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function ShieldIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  );
}
function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  );
}
function ArrowRightIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
    </svg>
  );
}
function MailIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  );
}
function PhoneIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
    </svg>
  );
}
function MicroscopeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M9 3v4m6-4v4M9 7h6M7 21h10M12 17v-6m0 0a4 4 0 100-8 4 4 0 000 8z"/>
    </svg>
  );
}
function UserIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  );
}

export default function PresentationPage() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await studyApi.init();
      storage.set(STORAGE_KEYS.PARTICIPANT_ID, res.participantId);
      storage.set(STORAGE_KEYS.IGT_GROUP,      res.igtGroup);
      storage.set(STORAGE_KEYS.SESSION_START,  res.sessionStart);
      storage.set(STORAGE_KEYS.COMPLETED_STEPS, []);
      navigate("/tcle");
    } catch {
      setError("Erro ao iniciar sessão. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white font-sans">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-screen flex flex-col">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={HERO_IMG}
            alt="Neural network visualization"
            className="w-full h-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f14]/60 via-[#0d0f14]/50 to-[#0d0f14]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <span className="text-white text-xs font-black tracking-tight">USP</span>
            </div>
            <div>
              <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest leading-none">FFCLRP</p>
              <p className="text-xs text-white/70 font-semibold leading-none mt-0.5">Psicobiologia</p>
            </div>
          </div>
          <a href="/admin" className="text-xs text-white/20 hover:text-white/40 transition-colors">
            Acesso restrito
          </a>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-16 max-w-5xl mx-auto w-full">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wider uppercase">
              Pesquisa de Mestrado · 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            <span className="text-white">Cybercondria</span>
            <br />
            <span className="text-white/40">&amp; Tomada de</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Decisão
            </span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-xl mb-10">
            Como a busca excessiva de informações de saúde na internet impacta a ansiedade
            e a capacidade de tomar decisões?
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-10">
            {badges.map(({ label, icon: Icon }) => (
              <span key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-white/60 text-xs font-medium">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 mb-4 text-sm max-w-md">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleStart}
              disabled={loading}
              className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-900/40 hover:shadow-indigo-900/60 transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Iniciando…
                </>
              ) : (
                <>
                  Participar da Pesquisa
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
            <p className="text-white/30 text-sm">
              Ao clicar, você será direcionado ao Termo de Consentimento
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="flex flex-col items-center gap-1.5 text-white/20 animate-bounce">
            <span className="text-xs tracking-wider uppercase">Saiba mais</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── PROTOCOL STEPS ──────────────────────────────────────────────── */}
      <section className="bg-[#0d0f14] px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Protocolo</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">6 etapas · ~25 minutos</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map(step => (
              <div key={step.n}
                className="relative bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/16 rounded-2xl p-6 transition-all duration-200 cursor-default">
                {/* Colored top bar */}
                <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${step.color} mb-5`} />
                <p className="text-white/20 text-xs font-bold font-mono mb-1">{step.n}</p>
                <h3 className="text-white font-bold text-base mb-1">{step.title}</h3>
                <p className="text-white/50 text-sm leading-snug">{step.desc}</p>
                <div className="mt-4 pt-4 border-t border-white/6 flex items-center justify-between">
                  <span className="text-white/30 text-xs">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFO GRID ────────────────────────────────────────────────────── */}
      <section className="bg-[#0a0c10] px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* About */}
            <div className="lg:col-span-2 bg-white/4 border border-white/8 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <MicroscopeIcon className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Sobre o Estudo</h3>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Esta pesquisa de mestrado investiga a relação entre <strong className="text-white/80">cybercondria</strong> —
                preocupação excessiva com saúde baseada em buscas na internet —, ansiedade,
                autoeficácia e tomada de decisão.
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                Os dados contribuem para o conhecimento científico sobre saúde digital no Brasil,
                com instrumentos validados: BAI, CSS-33, GSE e Iowa Gambling Task (100 tentativas).
              </p>
              <div className="mt-6 pt-6 border-t border-white/8 grid grid-cols-2 gap-4">
                {[
                  { label: "Instrumentos",   value: "4"   },
                  { label: "Tentativas IGT", value: "100" },
                  { label: "Itens CSS-33",   value: "33"  },
                  { label: "Ano",            value: "2026" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-3xl font-black text-white">{s.value}</p>
                    <p className="text-white/40 text-xs font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Privacidade</h3>
              </div>
              <ul className="space-y-3 flex-1">
                {[
                  "Participação completamente voluntária",
                  "Você pode desistir a qualquer momento",
                  "Dados anônimos e confidenciais",
                  "Armazenados com segurança (LGPD)",
                  "Nenhum dado de identificação coletado",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckIcon className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Criteria */}
          <div className="mt-6 bg-amber-500/6 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-amber-500/40 flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="text-amber-400 text-[10px] font-black">!</span>
              </div>
              <div>
                <h3 className="text-amber-300 font-bold text-sm mb-1">Critérios de Participação</h3>
                <p className="text-amber-200/60 text-sm">
                  Ter <strong className="text-amber-200/80">16 anos ou mais</strong> e acesso regular à internet.
                  {" "}Participantes entre 16 e 17 anos necessitam de autorização do responsável legal (TALE + TCLE).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESEARCHER ────────────��──────────────────────────────────────── */}
      <section className="bg-[#0d0f14] px-6 md:px-12 lg:px-20 py-16 border-t border-white/6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-3">Equipe de Pesquisa</p>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">Érica Silva Mascarenhas</h3>
                  <p className="text-white/50 text-sm">Mestranda em Psicobiologia · FFCLRP/USP</p>
                  <p className="text-white/40 text-xs mt-1">
                    Orientador: Prof. Dr. José Aparecido da Silva
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <a href="mailto:ericasm@usp.br"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 hover:text-white transition-all">
                <MailIcon className="w-4 h-4 text-indigo-400" />
                ericasm@usp.br
              </a>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-sm text-white/50">
                <PhoneIcon className="w-4 h-4 text-indigo-400" />
                (75) 98874-75223
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#0d0f14] to-[#0a0c10] px-6 md:px-12 py-16 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/20 text-xs font-medium uppercase tracking-widest mb-8">
            Pesquisa aprovada pelo Comitê de Ética em Pesquisa · Res. CNS 466/2012, 510/2016 e LGPD
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white hover:bg-white/90 disabled:opacity-50 text-slate-900 font-black text-lg rounded-2xl shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                Iniciando…
              </>
            ) : (
              <>
                Iniciar Estudo
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </section>

    </div>
  );
}