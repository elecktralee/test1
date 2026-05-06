import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { StudyLayout } from "../../components/StudyLayout";
import { studyApi } from "../../utils/api";
import { requireParticipant, markStepComplete } from "../../utils/storage";

interface FormData {
  age: string; gender: string; education: string; occupation: string;
  maritalStatus: string; monthlyIncome: string; internetHours: string;
  chronicCondition: string; psychiatricDiagnosis: string; medications: string;
  healthSearchFrequency: string; healthcareAccess: string;
  city: string; stateUF: string;
}

const initialForm: FormData = {
  age: "", gender: "", education: "", occupation: "", maritalStatus: "",
  monthlyIncome: "", internetHours: "", chronicCondition: "", psychiatricDiagnosis: "",
  medications: "", healthSearchFrequency: "", healthcareAccess: "",
  city: "", stateUF: "",
};

interface FieldProps { label: string; required?: boolean; children: React.ReactNode; error?: boolean; id?: string }
function Field({ label, required, children, error, id }: FieldProps) {
  return (
    <div id={id}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
    </div>
  );
}

const sc = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-700";

// Required fields in order — used for sequential scroll
const REQUIRED_FIELD_ORDER: (keyof FormData)[] = [
  "age", "gender", "education", "maritalStatus", "monthlyIncome",
  "internetHours", "chronicCondition", "psychiatricDiagnosis", "medications",
  "healthSearchFrequency", "healthcareAccess",
];

export default function SociodemographicPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect manual scroll — suspend auto-scroll for 1s
  useEffect(() => {
    const handleScroll = () => {
      userScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 1000);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const scrollToNextEmpty = (currentField: keyof FormData, updatedForm: FormData) => {
    if (userScrollingRef.current) return;

    const currentIndex = REQUIRED_FIELD_ORDER.indexOf(currentField);
    if (currentIndex === -1) return;

    // Find the next unanswered required field after current
    for (let i = currentIndex + 1; i < REQUIRED_FIELD_ORDER.length; i++) {
      const field = REQUIRED_FIELD_ORDER[i];
      if (!updatedForm[field]) {
        setTimeout(() => {
          if (!userScrollingRef.current) {
            document.getElementById(`field-${field}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
        return;
      }
    }
  };

  const set = (key: keyof FormData, value: string) => {
    setForm(f => {
      const next = { ...f, [key]: value };
      setErrors(e => ({ ...e, [key]: "" }));
      // Only auto-scroll for select fields (not free-text inputs)
      const isSelect = REQUIRED_FIELD_ORDER.includes(key) && key !== "age";
      if (isSelect && value) scrollToNextEmpty(key, next);
      return next;
    });
  };

  const requiredFields: (keyof FormData)[] = REQUIRED_FIELD_ORDER;

  const allRequiredFilled = requiredFields.every(k => !!form[k]);

  const validate = () => {
    const errs: Partial<FormData> = {};
    requiredFields.forEach(k => { if (!form[k]) errs[k] = "required"; });
    if (form.age && (Number(form.age) < 16 || Number(form.age) > 99)) errs.age = "invalid";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      // Scroll to first error
      const firstError = requiredFields.find(k => !form[k]);
      if (firstError) {
        document.getElementById(`field-${firstError}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setLoading(true); setApiError("");
    try {
      const id = requireParticipant();
      await studyApi.saveSociodemographic(id, form);
      markStepComplete("socio");
      navigate("/bai");
    } catch {
      setApiError("Erro ao salvar dados. Tente novamente.");
    } finally { setLoading(false); }
  };

  const Sel = ({ field, opts }: { field: keyof FormData; opts: [string, string][] }) => (
    <select className={sc} value={form[field]} onChange={e => set(field, e.target.value)}>
      <option value="">Selecione...</option>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  const STATES_BR = [
    ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],
    ["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],
    ["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],
    ["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],
    ["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],
    ["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],
    ["SE","Sergipe"],["TO","Tocantins"],
  ];

  return (
    <StudyLayout currentStep="socio">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="bg-indigo-600 px-6 py-5 text-white rounded-t-2xl">
          <h2 className="text-lg font-semibold">Dados Sociodemográficos</h2>
          <p className="text-indigo-200 text-sm mt-1">Todas as informações são anônimas e confidenciais</p>
        </div>

        <div className="p-6 space-y-5">
          <Field id="field-age" label="Idade" required error={!!errors.age}>
            <input type="number" min={16} max={99} placeholder="Ex: 20"
              value={form.age} onChange={e => set("age", e.target.value)} className={sc} />
            {errors.age === "invalid" && <p className="text-red-500 text-xs mt-1">Idade deve ser entre 16 e 99 anos</p>}
          </Field>

          <Field id="field-gender" label="Com qual gênero você se identifica?" required error={!!errors.gender}>
            <Sel field="gender" opts={[["Masculino","Masculino"],["Feminino","Feminino"],["Não-binário","Não-binário"],["Outro","Outro"],["Prefiro não informar","Prefiro não informar"]]} />
          </Field>

          <Field id="field-education" label="Nível de escolaridade" required error={!!errors.education}>
            <Sel field="education" opts={[
              ["Ensino Fundamental","Ensino Fundamental (completo ou incompleto)"],
              ["Ensino Médio","Ensino Médio (completo ou incompleto)"],
              ["Ensino Superior incompleto","Ensino Superior incompleto"],
              ["Ensino Superior completo","Ensino Superior completo"],
              ["Pós-graduação","Pós-graduação (Especialização, Mestrado, Doutorado)"],
            ]} />
          </Field>

          <Field label="Ocupação atual (opcional)">
            <input type="text" placeholder="Ex: Estudante, Professor, Enfermeiro..."
              value={form.occupation} onChange={e => set("occupation", e.target.value)} className={sc} />
          </Field>

          <Field id="field-maritalStatus" label="Estado civil" required error={!!errors.maritalStatus}>
            <Sel field="maritalStatus" opts={[
              ["Solteiro(a)","Solteiro(a)"],["Casado(a)/União estável","Casado(a) / União estável"],
              ["Divorciado(a)/Separado(a)","Divorciado(a) / Separado(a)"],["Viúvo(a)","Viúvo(a)"]
            ]} />
          </Field>

          <Field id="field-monthlyIncome" label="Renda mensal familiar aproximada" required error={!!errors.monthlyIncome}>
            <Sel field="monthlyIncome" opts={[
              ["Até R$1.320","Até R$1.320 (até 1 salário mínimo)"],
              ["R$1.321–R$2.640","R$1.321 – R$2.640 (1 a 2 SM)"],
              ["R$2.641–R$5.280","R$2.641 – R$5.280 (2 a 4 SM)"],
              ["R$5.281–R$10.560","R$5.281 – R$10.560 (4 a 8 SM)"],
              ["Acima de R$10.560","Acima de R$10.560 (mais de 8 SM)"],
              ["Prefiro não informar","Prefiro não informar"],
            ]} />
          </Field>

          <Field id="field-internetHours" label="Quantas horas por dia, em média, você usa a internet?" required error={!!errors.internetHours}>
            <Sel field="internetHours" opts={[
              ["Menos de 1 hora","Menos de 1 hora"],["1–3 horas","1 a 3 horas"],
              ["3–6 horas","3 a 6 horas"],["6–9 horas","6 a 9 horas"],["Mais de 9 horas","Mais de 9 horas"],
            ]} />
          </Field>

          <Field id="field-chronicCondition" label="Você possui alguma condição de saúde crônica diagnosticada?" required error={!!errors.chronicCondition}>
            <Sel field="chronicCondition" opts={[["Sim","Sim"],["Não","Não"],["Prefiro não informar","Prefiro não informar"]]} />
          </Field>

          <Field id="field-psychiatricDiagnosis" label="Você já recebeu diagnóstico de transtorno de ansiedade?" required error={!!errors.psychiatricDiagnosis}>
            <Sel field="psychiatricDiagnosis" opts={[["Sim","Sim"],["Não","Não"],["Prefiro não responder","Prefiro não responder"]]} />
          </Field>

          <Field id="field-medications" label="Você faz uso regular de algum medicamento?" required error={!!errors.medications}>
            <Sel field="medications" opts={[["Sim","Sim"],["Não","Não"],["Prefiro não informar","Prefiro não informar"]]} />
          </Field>

          <Field id="field-healthSearchFrequency" label="Com que frequência você busca informações de saúde na internet?" required error={!!errors.healthSearchFrequency}>
            <Sel field="healthSearchFrequency" opts={[
              ["Raramente","Raramente (menos de uma vez por mês)"],
              ["Às vezes","Às vezes (algumas vezes por mês)"],
              ["Frequentemente","Frequentemente (várias vezes por semana)"],
              ["Sempre","Sempre (praticamente todo dia)"],
            ]} />
          </Field>

          <Field id="field-healthcareAccess" label="Qual é o seu principal tipo de acesso a serviços de saúde?" required error={!!errors.healthcareAccess}>
            <Sel field="healthcareAccess" opts={[
              ["SUS exclusivamente","SUS exclusivamente"],
              ["Plano privado exclusivamente","Plano de saúde privado exclusivamente"],
              ["Ambos (SUS + plano privado)","Ambos (SUS + plano de saúde privado)"],
            ]} />
          </Field>

          {/* Localização */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Localização (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade">
                <input
                  type="text"
                  placeholder="Ex: Salvador"
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  className={sc}
                />
              </Field>
              <Field label="Estado">
                <select
                  className={sc}
                  value={form.stateUF}
                  onChange={e => set("stateUF", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {STATES_BR.map(([uf, name]) => (
                    <option key={uf} value={uf}>{uf} — {name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{apiError}</div>
          )}

          {/* Green approval indicator */}
          {allRequiredFilled && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Todos os campos obrigatórios preenchidos!
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => navigate("/tcle")}
              className="px-5 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors"
            >
              ← Voltar ao TCLE
            </button>
            <button
              onClick={handleSubmit} disabled={loading}
              className={`px-8 py-3 font-semibold rounded-xl shadow-md transition-all disabled:opacity-60 text-white ${
                allRequiredFilled
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </span>
              ) : "Continuar →"}
            </button>
          </div>
        </div>
      </div>
    </StudyLayout>
  );
}
