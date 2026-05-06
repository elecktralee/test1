import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { StudyLayout } from "../../components/StudyLayout";
import { studyApi } from "../../utils/api";
import { requireParticipant, markStepComplete } from "../../utils/storage";

export default function TCLEPage() {
  const navigate    = useNavigate();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMinor,    setIsMinor]    = useState<boolean | null>(null); // null = não respondido
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const contentRef  = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setHasScrolled(true);
  };

  // Menor: registra consentimento e vai para o TALE
  // Maior: registra consentimento e vai direto para sociodemográfico
  const handleAccept = async () => {
    if (isMinor === null) return; // não respondeu à pergunta de idade
    setLoading(true);
    setError("");
    try {
      const id = requireParticipant();
      await studyApi.consent(id);
      markStepComplete("tcle");
      if (isMinor) {
        navigate("/tale");
      } else {
        navigate("/sociodemografico");
      }
    } catch {
      setError("Erro ao registrar consentimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = hasScrolled && isMinor !== null;

  return (
    <StudyLayout currentStep="tcle">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 text-white">
          <h2 className="text-lg font-semibold">Termo de Consentimento Livre e Esclarecido — TCLE</h2>
          <p className="text-indigo-200 text-sm mt-1">Resoluções CNS nº 466/2012 e nº 510/2016 · LGPD — Lei nº 13.709/2018</p>
        </div>

        {/* Scroll notice */}
        {!hasScrolled && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-amber-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
            Role até o final para habilitar o aceite
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="px-6 py-6 max-h-[60vh] overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-6"
        >

          {/* Identificação */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Identificação da Pesquisa
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">Título:</span>{" "}
                Cybercondria e Tomada de Decisão: impacto da busca de informações de saúde online na ansiedade e no processo decisório
              </p>
              <p>
                <span className="font-semibold text-gray-800">Pesquisadora responsável:</span>{" "}
                Érica Silva Mascarenhas — Mestranda em Psicobiologia, FFCLRP/USP
              </p>
              <p>
                <span className="font-semibold text-gray-800">Orientador:</span>{" "}
                Prof. Dr. José Aparecido da Silva — Departamento de Psicologia, FFCLRP/USP
              </p>
              <p>
                <span className="font-semibold text-gray-800">Instituição:</span>{" "}
                Faculdade de Filosofia, Ciências e Letras de Ribeirão Preto — Universidade de São Paulo (FFCLRP/USP)
              </p>
              <p>
                <span className="font-semibold text-gray-800">Contato:</span>{" "}
                ericasm@usp.br · (75) 98874-75223
              </p>
            </div>
          </section>

          {/* Convite */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Convite
            </h3>
            <p className="mb-3">
              Convidamos você a participar da pesquisa intitulada{" "}
              <em>"Cybercondria e Tomada de Decisão: impacto da busca de informações de saúde online
              na ansiedade e no processo decisório"</em>, conduzida pela mestranda Érica Silva Mascarenhas,
              sob a orientação do Prof. Dr. José Aparecido da Silva, do Departamento de Psicologia da
              FFCLRP da Universidade de São Paulo.
            </p>
            <p>
              Este comunicado visa oferecer uma explicação clara sobre a natureza da pesquisa, bem como
              sobre seu papel como participante voluntário. A participação tomará no máximo{" "}
              <strong>20 a 30 minutos</strong>.
            </p>
          </section>

          {/* Objetivo */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Objetivos e Relevância
            </h3>
            <p className="mb-3">
              Sabemos que a internet se tornou uma fonte frequente de consulta sobre sintomas e condições
              de saúde. Para algumas pessoas, esse hábito pode se tornar excessivo e contribuir para o
              aumento da ansiedade — fenômeno denominado <strong>cybercondria</strong>. A pesquisa estuda
              as relações entre esse comportamento, a ansiedade, a autoeficácia percebida e os padrões de
              tomada de decisão em adultos e adolescentes brasileiros.
            </p>
            <p>
              A contribuição de cada participante é de suma importância para compreendermos esses
              mecanismos no contexto brasileiro, podendo subsidiar futuras intervenções clínicas e
              políticas de saúde pública voltadas ao uso saudável da internet.
            </p>
          </section>

          {/* Procedimentos */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Procedimentos
            </h3>
            <p className="mb-3">A participação consiste em:</p>
            <ul className="space-y-2 mb-3">
              {[
                { letter: "A", text: "Preencher um breve questionário com dados sociodemográficos gerais (sem qualquer informação de identificação pessoal);" },
                { letter: "B", text: "Responder ao Inventário de Ansiedade de Beck (BAI) — 21 itens sobre sintomas de ansiedade;" },
                { letter: "C", text: "Responder à Escala de Severidade da Cybercondria (CSS-33) — 33 itens sobre comportamento de busca de informações de saúde na internet;" },
                { letter: "D", text: "Responder à Escala de Autoeficácia Geral (GSE) — 10 itens sobre percepção de capacidade pessoal;" },
                { letter: "E", text: "Participar do Iowa Gambling Task (IGT) — tarefa computadorizada de tomada de decisão com 100 tentativas, na qual serão feitas escolhas entre quatro baralhos virtuais buscando maximizar um saldo fictício em reais." },
              ].map(item => (
                <li key={item.letter} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {item.letter}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <p>
              Esta pesquisa é realizada com uso de software desenvolvido especificamente para o experimento,
              de forma <strong>100% online</strong>. Ao clicar em "SIM, ACEITO PARTICIPAR" ao final deste
              Termo, você atesta que leu, compreendeu e concordou em participar da pesquisa nos termos
              aqui descritos.
            </p>
          </section>

          {/* Riscos */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Riscos e Desconfortos
            </h3>
            <p>
              Esta tarefa não apresenta nenhum risco previsível, exceto pela possibilidade de leve
              desconforto ao refletir sobre sintomas de ansiedade ou sobre hábitos de busca de informações
              de saúde online. Os estímulos são breves e não se espera que causem perturbação. Os riscos
              são considerados <strong>mínimos</strong> e minimizados por se tratar de uma coleta de dados
              anônima via formulário online. Se alguma pergunta incomodar, você tem o direito de não a
              responder, sem qualquer penalidade.
            </p>
          </section>

          {/* Confidencialidade */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Confidencialidade e Proteção de Dados
            </h3>
            <p className="mb-3">
              A informação coletada será guardada indefinidamente e só será empregada para propósitos de
              pesquisa. As respostas serão codificadas usando um número de identificação e os resultados
              serão divulgados de forma grupal, <strong>sem qualquer uso de nome ou dado pessoal</strong>.
            </p>
            <p>
              Nenhum dado de identificação pessoal (nome, CPF, e-mail, endereço) é coletado em nenhuma
              etapa desta pesquisa. Os dados ficam sob sigilo, acessados somente pelos responsáveis da
              pesquisa, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
              e as Resoluções CNS nº 466/2012 e nº 510/2016.
            </p>
          </section>

          {/* Voluntariedade */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Voluntariedade e Direito de Retirada
            </h3>
            <p>
              A participação neste estudo é <strong>estritamente voluntária</strong>. É possível
              interromper a participação em qualquer momento sem que isso acarrete qualquer penalidade ou
              prejuízo. Você dispõe de tempo para refletir sobre a participação, consultando, se necessário,
              familiares ou outras pessoas que possam ajudar na tomada de decisão livre e esclarecida.
            </p>
          </section>

          {/* Custos */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Custos e Ressarcimento
            </h3>
            <p>
              Não haverá nenhuma despesa financeira para a realização do estudo. Não está previsto
              reembolso de qualquer natureza. Estão assegurados o direito a pedir indenizações e cobertura
              material para reparação de dano eventualmente causado pela participação na pesquisa.
            </p>
          </section>

          {/* Contato e CEP */}
          <section>
            <h3 className="font-semibold text-gray-900 text-base mb-3 pb-1.5 border-b border-gray-100">
              Contato e Dúvidas
            </h3>
            <p className="mb-4">
              Qualquer dúvida com relação à participação e aos procedimentos desta pesquisa poderá ser
              esclarecida antes, durante e após a realização do estudo, tanto com a pesquisadora quanto
              com o professor orientador.
            </p>
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
                <p><span className="text-gray-500">Fax:</span> (16) 3633-2660</p>
                <p><span className="text-gray-500">E-mail:</span> coetp@listas.ffclrp.usp.br</p>
                <p className="text-gray-400 text-xs pt-1">Atendimento: 2ª a 6ª, das 13h30 às 17h30</p>
              </div>
            </div>
          </section>

          {/* Declaração formal */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <p className="font-semibold text-indigo-800 mb-3">Declaração de Consentimento</p>
            <p className="text-indigo-700 text-sm mb-4 leading-relaxed">
              Pelo presente instrumento, que atende às exigências legais, após leitura minuciosa das
              informações constantes neste Termo de Consentimento Livre e Esclarecido, ciente dos
              procedimentos aos quais será submetido(a) e não restando quaisquer dúvidas, ao clicar em{" "}
              <strong>"SIM, ACEITO PARTICIPAR"</strong>, você{" "}
              <strong>DECLARA e FIRMA seu Consentimento Livre e Esclarecido</strong>, concordando em
              participar da pesquisa proposta. Fica assegurado que todas as informações prestadas
              tornar-se-ão confidenciais, e que é possível, a qualquer momento, retirar este consentimento
              e deixar de participar, sem qualquer penalidade.
            </p>
            <p className="text-indigo-600 text-xs mb-5">
              As pesquisadoras declaram o cumprimento do disposto nas Resoluções CNS nº 466/2012 e
              nº 510/2016, e na Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018).
            </p>

            {/* Campos opcionais */}
            <div className="border-t border-indigo-200 pt-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                Identificação opcional
                <span className="ml-2 font-normal normal-case text-indigo-400">
                  — não é obrigatório preencher
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-indigo-600 mb-1">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full border-b border-indigo-300 focus:border-indigo-500 bg-transparent pb-1 text-sm text-gray-800 placeholder-indigo-200 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-indigo-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border-b border-indigo-300 focus:border-indigo-500 bg-transparent pb-1 text-sm text-gray-800 placeholder-indigo-200 outline-none transition-colors"
                  />
                </div>
              </div>
              <p className="text-xs text-indigo-400 leading-relaxed">
                Caso queira receber um resumo dos resultados da pesquisa quando publicados, informe
                seu e-mail. Essas informações são opcionais e armazenadas separadamente dos dados
                do estudo, sem qualquer vinculação às suas respostas.
              </p>
            </div>
          </div>

          {/* ── Faixa etária / TALE ───────────────────────────────────── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-800">Confirmação de idade</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Esta informação determina quais termos se aplicam à sua participação.
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Opção: Maior */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isMinor === false
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="ageGroup"
                  checked={isMinor === false}
                  onChange={() => setIsMinor(false)}
                  className="accent-indigo-600 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">
                  Tenho <strong>18 anos ou mais</strong>
                </span>
              </label>

              {/* Opção: Menor */}
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isMinor === true
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="ageGroup"
                  checked={isMinor === true}
                  onChange={() => setIsMinor(true)}
                  className="accent-amber-500 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">
                  Tenho <strong>entre 16 e 17 anos</strong>
                </span>
              </label>

              {/* Aviso TALE — exibido apenas se menor */}
              {isMinor === true && (
                <div className="mt-1 bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        Termo de Assentimento (TALE) necessário
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Por você ter entre 16 e 17 anos, além do consentimento do responsável legal
                        (TCLE), é necessário também o seu próprio assentimento. Após aceitar este
                        termo, você será direcionado ao <strong>Termo de Assentimento Livre e
                        Esclarecido (TALE)</strong>, redigido em linguagem acessível.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3 text-sm">
              {error}
            </div>
          )}
          {hasScrolled && isMinor === null && (
            <p className="text-xs text-amber-600 mb-3">
              Confirme sua faixa etária acima para prosseguir.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Voltar
              </button>
              <p className="text-xs text-gray-400">
                {!hasScrolled
                  ? "Role até o final para continuar"
                  : isMinor === null
                  ? "Confirme sua faixa etária"
                  : "Tudo certo — aceite habilitado"}
              </p>
            </div>
            <button
              onClick={handleAccept}
              disabled={!canProceed || loading}
              className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all ${
                canProceed
                  ? isMinor
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Registrando...
                </span>
              ) : isMinor ? (
                "SIM, ACEITO — Continuar para o TALE →"
              ) : (
                "SIM, ACEITO PARTICIPAR →"
              )}
            </button>
          </div>
        </div>

      </div>
    </StudyLayout>
  );
}