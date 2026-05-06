import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { StudyLayout } from "../../components/StudyLayout";
import { requireParticipant, markStepComplete } from "../../utils/storage";

// ── Helpers ──────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }
function today() {
  const d = new Date();
  const months = [
    "janeiro","fevereiro","março","abril","maio","junho",
    "julho","agosto","setembro","outubro","novembro","dezembro",
  ];
  return { day: pad(d.getDate()), month: months[d.getMonth()], year: d.getFullYear() };
}

export default function TALEPage() {
  const navigate      = useNavigate();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted,    setAccepted]    = useState(false);
  const [minorName,   setMinorName]   = useState("");
  const contentRef    = useRef<HTMLDivElement>(null);
  const { day, month, year } = today();

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setHasScrolled(true);
  };

  const handleAccept = () => {
    markStepComplete("tale");
    navigate("/sociodemografico");
  };

  return (
    <StudyLayout currentStep="tcle">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-amber-500 px-6 py-5 text-white">
          <h2 className="text-lg font-semibold">Termo de Assentimento Livre e Esclarecido — TALE</h2>
          <p className="text-amber-100 text-sm mt-1">Para participantes entre 16 e 17 anos · Resolução CNS nº 466/2012</p>
        </div>

        {/* Scroll notice */}
        {!hasScrolled && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-amber-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
            Role até o final para habilitar o assentimento
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="px-6 py-6 max-h-[60vh] overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-6"
        >

          {/* Convite */}
          <section>
            <p className="mb-4 text-base text-gray-800">
              Nós, pesquisadoras da Universidade de São Paulo, convidamos você a participar do estudo{" "}
              <em>"Cybercondria e Tomada de Decisão: impacto da busca de informações de saúde online
              na ansiedade e no processo decisório"</em>.
              Informamos que seu pai/mãe ou responsável legal já permitiu a sua participação.
            </p>
          </section>

          {/* O que queremos saber */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              O que queremos saber?
            </h3>
            <p className="mb-3">
              Você já pesquisou algum sintoma ou doença na internet e ficou preocupado achando que
              tinha algo grave? Muitas pessoas fazem isso — e algumas ficam tão ansiosas que não
              conseguem parar de buscar. Isso tem um nome: <strong>cybercondria</strong>.
            </p>
            <p>
              Queremos entender como esse hábito se relaciona com a ansiedade, com a confiança que a
              pessoa tem em si mesma e com a forma como cada um toma decisões. Com isso, esperamos
              ajudar outras pessoas a usar a internet de forma mais saudável.
            </p>
          </section>

          {/* Sua participação */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Como vai ser sua participação?
            </h3>
            <p className="mb-3">
              A pesquisa é feita completamente pela internet, direto no seu computador, celular ou
              tablet. Vai levar entre 20 e 30 minutos. Você vai:
            </p>
            <ul className="space-y-2.5 mb-3">
              {[
                { n: "1", text: "Responder a algumas perguntas rápidas sobre você (sem dizer seu nome ou qualquer dado pessoal)." },
                { n: "2", text: "Responder a questionários sobre ansiedade, sobre como você busca informações de saúde na internet e sobre o quanto você confia em si mesmo para resolver problemas." },
                { n: "3", text: "Participar de um jogo de tomada de decisão: você vai escolher entre quatro baralhos virtuais tentando ganhar o maior saldo possível. Não tem resposta certa — é apenas para entender como cada pessoa decide." },
              ].map(item => (
                <li key={item.n} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {item.n}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <p>
              Para isso, será usado um software desenvolvido especialmente para esta pesquisa. Ele é
              seguro e funciona direto no navegador, sem precisar instalar nada.
            </p>
          </section>

          {/* Riscos */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Tem algum risco?
            </h3>
            <p>
              Não tem nenhum risco físico. É possível que alguma pergunta sobre ansiedade ou sobre
              hábitos de internet faça você pensar em coisas que te deixem um pouco desconfortável.
              Se isso acontecer, você pode parar quando quiser — e tudo bem. Não vai acontecer nada
              de ruim se você desistir. Se tiver qualquer problema, você, seus pais ou responsável
              podem entrar em contato com a pesquisadora pelos contatos que estão no final desta página.
            </p>
          </section>

          {/* Benefícios */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Por que sua participação é importante?
            </h3>
            <p>
              A sua participação vai ajudar os pesquisadores a entender melhor como adolescentes e
              adultos se comportam quando buscam informações de saúde na internet. Com isso, será
              possível criar formas de ajudar quem sofre com ansiedade causada pelo uso excessivo da
              internet — algo que afeta cada vez mais pessoas jovens no Brasil.
            </p>
          </section>

          {/* Sigilo */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Suas informações ficam em sigilo
            </h3>
            <p>
              Ninguém vai saber que você está participando desta pesquisa. Não vamos falar para
              outras pessoas nem dar a estranhos nenhuma informação que você nos der. Seu nome não
              vai aparecer em nenhum lugar — nem nos resultados, nem em publicações científicas. Os
              resultados serão publicados de forma conjunta, sem identificar nenhum participante
              individualmente.
            </p>
          </section>

          {/* Voluntário */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Você não é obrigado a participar
            </h3>
            <p>
              Participar é uma escolha completamente sua. Você pode dizer "sim" e participar, mas a
              qualquer momento pode dizer "não" e desistir — e ninguém vai ficar com raiva ou
              chateado com você. Não tem nenhuma punição ou consequência por desistir.
            </p>
          </section>

          {/* Contato */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Fale com a gente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <p className="font-semibold text-gray-800 mb-2">Equipe de Pesquisa</p>
                <p><span className="text-gray-500">Pesquisadora:</span> Érica Silva Mascarenhas</p>
                <p><span className="text-gray-500">E-mail:</span> ericasm@usp.br</p>
                <p><span className="text-gray-500">Telefone:</span> (75) 98874-75223</p>
                <p className="pt-1 border-t border-gray-200 mt-1">
                  <span className="text-gray-500">Orientador:</span> Prof. Dr. José Aparecido da Silva
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                <p className="font-semibold text-gray-800 mb-2">Comitê de Ética em Pesquisa</p>
                <p className="font-medium text-gray-700">COETP — FFCLRP/USP</p>
                <p className="text-gray-500">Av. Bandeirantes, 3900 — Bloco 01, Sala 07</p>
                <p className="text-gray-500">14040-901 · Ribeirão Preto — SP</p>
                <p><span className="text-gray-500">Fone:</span> (16) 3315-4811</p>
                <p><span className="text-gray-500">E-mail:</span> coetp@listas.ffclrp.usp.br</p>
                <p className="text-gray-400 text-xs pt-1">Atendimento: 2ª a 6ª, das 13h30 às 17h30</p>
              </div>
            </div>
          </section>

          {/* ── Consentimento Pós-Informado ──────────────────────────── */}
          <div className="border-2 border-amber-300 rounded-xl overflow-hidden">
            <div className="bg-amber-50 px-5 py-3 border-b border-amber-200">
              <p className="font-semibold text-amber-900 text-sm">Assentimento Pós-Informado</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Datas e local */}
              <div className="text-sm text-gray-600 text-right">
                Ribeirão Preto, {day} de {month} de {year}.
              </div>

              {/* Texto do assentimento */}
              <p className="text-sm text-gray-800 leading-relaxed">
                Eu aceito participar da pesquisa{" "}
                <em>"Cybercondria e Tomada de Decisão: impacto da busca de informações de saúde
                online na ansiedade e no processo decisório"</em>.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Entendi as coisas ruins e as coisas boas que podem acontecer. Entendi que posso
                dizer "sim" e participar, mas que, a qualquer momento, posso dizer "não" e desistir
                — e que ninguém vai ficar com raiva ou chateado comigo. Os pesquisadores
                esclareceram minhas dúvidas e conversaram com os meus pais ou responsável legal.
              </p>

              {/* Checkbox de assentimento */}
              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                accepted
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
              }`}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm text-gray-800">
                  Li este Termo de Assentimento, entendi o que foi explicado e{" "}
                  <strong>concordo em participar da pesquisa</strong>.
                </span>
              </label>

              {/* Linha de assinatura */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Nome do(a) participante
                    <span className="text-gray-400 font-normal ml-1">(escreva seu nome abaixo)</span>
                  </label>
                  <input
                    type="text"
                    value={minorName}
                    onChange={e => setMinorName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full border-b-2 border-gray-300 focus:border-amber-400 bg-transparent pb-1.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-400 text-center mt-1.5">Assinatura do(a) participante menor</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Pesquisadora responsável</label>
                  <div className="border-b-2 border-gray-300 pb-1.5">
                    <p className="text-sm text-gray-600">Érica Silva Mascarenhas</p>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1.5">Pesquisadora responsável</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/tcle")}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Voltar ao TCLE
              </button>
              <p className="text-xs text-gray-400">
                {!hasScrolled
                  ? "Role até o final para continuar"
                  : !accepted
                  ? "Marque o assentimento para continuar"
                  : "Tudo certo — continue"}
              </p>
            </div>
            <button
              onClick={handleAccept}
              disabled={!hasScrolled || !accepted}
              className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all ${
                hasScrolled && accepted
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirmar Assentimento →
            </button>
          </div>
        </div>

      </div>
    </StudyLayout>
  );
}