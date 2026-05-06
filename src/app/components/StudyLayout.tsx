import React, { useEffect } from "react";

export interface StudyStep {
  key: string;
  label: string;
}

// Ordem correta: BAI antes do CSS-33
export const STUDY_STEPS: StudyStep[] = [
  { key: "tcle", label: "Consentimento" },
  { key: "socio", label: "Perfil" },
  { key: "bai", label: "BAI" },
  { key: "css33", label: "CSS-33" },
  { key: "gse", label: "GSE" },
  { key: "igt", label: "IGT" },
];

interface StudyLayoutProps {
  currentStep?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function StudyLayout({ currentStep, children, maxWidth = "max-w-2xl" }: StudyLayoutProps) {
  const currentIndex = STUDY_STEPS.findIndex(s => s.key === currentStep);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / STUDY_STEPS.length) * 100 : 0;

  // Scroll to top on every page navigation (fixes mobile mid-page issue)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Fixed header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-indigo-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">CS</span>
              </div>
              <span className="text-sm font-semibold text-gray-800 hidden sm:block">
                Cybercondria & Tomada de Decisão
              </span>
            </div>
            {currentStep && currentIndex >= 0 && (
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                Etapa {currentIndex + 1} de {STUDY_STEPS.length}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {currentStep && (
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Step indicators */}
          {currentStep && (
            <div className="flex items-center justify-between mt-2 overflow-x-auto pb-1">
              {STUDY_STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                        i < currentIndex
                          ? "bg-indigo-600 text-white"
                          : i === currentIndex
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {i < currentIndex ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-[9px] mt-0.5 font-medium hidden sm:block ${
                        i === currentIndex ? "text-indigo-600" : i < currentIndex ? "text-indigo-400" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STUDY_STEPS.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 mx-1 transition-all ${
                        i < currentIndex ? "bg-indigo-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="py-8 px-4">
        <div className={`${maxWidth} mx-auto`}>{children}</div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        Pesquisa aprovada pelo CEP · Resolução CNS 466/2012 e 510/2016 · LGPD
      </footer>
    </div>
  );
}
