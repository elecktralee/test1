import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { StudyLayout } from "../../components/StudyLayout";
import { LikertQuestion } from "../../components/LikertQuestion";
import { BAI_ITEMS, BAI_SCALE } from "../../data/instruments";
import { studyApi } from "../../utils/api";
import { storage, STORAGE_KEYS, requireParticipant, markStepComplete } from "../../utils/storage";

export default function BAIPage() {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const saved = storage.get<Record<string, number>>(STORAGE_KEYS.BAI);
    if (saved) setResponses(saved);
  }, []);

  const handleChange = (item: number, value: number) => {
    setResponses(prev => {
      const next = { ...prev, [`item_${item}`]: value };
      storage.set(STORAGE_KEYS.BAI, next);
      return next;
    });
  };

  const answeredCount = Object.keys(responses).length;
  const totalItems = BAI_ITEMS.length;
  const allAnswered = answeredCount === totalItems;

  const handleSubmit = async () => {
    if (!allAnswered) {
      setShowErrors(true);
      const firstUnanswered = BAI_ITEMS.findIndex((_, i) => !(`item_${i + 1}` in responses));
      if (firstUnanswered >= 0) {
        document.getElementById(`q-bai-${firstUnanswered + 1}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const id = requireParticipant();
      await studyApi.saveBAI(id, responses);
      markStepComplete("bai");
      storage.remove(STORAGE_KEYS.BAI);
      navigate("/css33"); // BAI → CSS-33
    } catch (e: any) {
      setApiError("Erro ao salvar respostas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudyLayout currentStep="bai">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 text-white rounded-t-2xl">
          <h2 className="text-lg font-semibold">Inventário de Ansiedade de Beck (BAI)</h2>
          <p className="text-indigo-200 text-sm mt-1">Beck et al. (1988) · Versão brasileira: Cunha (2001)</p>
        </div>

        {/* Instructions */}
        <div className="px-6 pt-5 pb-3">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800 mb-3">
            <p className="font-medium mb-1">Instruções</p>
            <p>
              Abaixo está uma lista de sintomas comuns de ansiedade. Por favor, leia com cuidado cada item da lista.
              Indique o quanto você tem sido incomodado(a) por cada sintoma durante a <strong>última semana</strong>, 
              incluindo hoje.
            </p>
          </div>

          {/* Scale reference */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {BAI_SCALE.map(s => (
              <div key={s.value} className="bg-gray-50 rounded-lg p-2 text-center text-xs">
                <span className="font-bold text-indigo-600 text-base block">{s.value}</span>
                <span className="text-gray-600 leading-tight">{s.label.split(" — ")[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress counter */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className={`font-medium ${allAnswered ? "text-green-600" : "text-gray-500"}`}>
              {answeredCount}/{totalItems} respondidos
            </span>
            {showErrors && !allAnswered && (
              <span className="text-red-500 text-xs">⚠ Responda todos os itens</span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalItems) * 100}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="px-6 pb-6">
          {BAI_ITEMS.map((text, i) => {
            const itemKey = `item_${i + 1}`;
            const hasError = showErrors && !(itemKey in responses);
            return (
              <div key={i} id={`q-bai-${i + 1}`}>
                <LikertQuestion
                  index={i + 1}
                  text={text}
                  name={`bai_${itemKey}`}
                  scale={BAI_SCALE}
                  value={responses[itemKey] ?? null}
                  onChange={(v) => handleChange(i + 1, v)}
                  hasError={hasError}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
              {apiError}
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigate("/sociodemografico")}
                className="px-4 py-2 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors"
              >
                ← Voltar
              </button>
              <span className="text-xs text-gray-400">Suas respostas são salvas automaticamente</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-60"
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