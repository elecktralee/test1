import React, { useEffect } from "react";
import { clearStudyData } from "../../utils/storage";

export default function CompletionPage() {
  useEffect(() => {
    // Clear all study data from localStorage after completion
    setTimeout(clearStudyData, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Muito obrigada pela sua participação!
        </h1>
        <p className="text-gray-500 text-lg mb-6 leading-relaxed">
          Você concluiu com sucesso todas as etapas do estudo sobre 
          <strong> Cybercondria e Tomada de Decisão</strong>.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "🔬", title: "Contribuição", desc: "Seus dados contribuem para o conhecimento científico sobre saúde digital no Brasil" },
            { icon: "🔒", title: "Segurança", desc: "Seus dados estão armazenados com segurança e serão utilizados apenas para fins científicos" },
            { icon: "📧", title: "Contato", desc: "Dúvidas? ericasm@usp.br · (75) 98874-75223" },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-left">
              <span className="text-2xl mb-2 block">{card.icon}</span>
              <p className="font-semibold text-gray-800 text-sm mb-1">{card.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Researcher info */}
        <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 mb-6 text-sm text-left">
          <p className="font-semibold text-indigo-800 mb-2">Sobre a Pesquisa</p>
          <p className="text-indigo-700 mb-1">
            <strong>Pesquisadora:</strong> Erica Silva Mascarenhas (Mestranda)
          </p>
          <p className="text-indigo-700 mb-1">
            <strong>Orientador:</strong> Prof. Jose Aparecido da Silva
          </p>
          <p className="text-indigo-600 text-xs mt-2">
            Pesquisa aprovada pelo Comitê de Ética em Pesquisa · Res. CNS 466/2012 e 510/2016 · LGPD
          </p>
        </div>

        <p className="text-gray-400 text-sm">
          Você pode fechar esta janela com segurança.
        </p>
      </div>
    </div>
  );
}