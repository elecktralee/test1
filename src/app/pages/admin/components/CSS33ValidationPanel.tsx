import React, { useEffect, useState, useMemo } from "react";
import { adminApi } from "../../../utils/api";
import { Activity, CheckCircle, BarChart2, AlertCircle } from "lucide-react";

// Funções Matemáticas Nativas
const calculateMean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const calculateVariance = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const mean = calculateMean(arr);
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
};

const calculatePearson = (x: number[], y: number[]) => {
  if (x.length < 2 || y.length < 2) return null;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < x.length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  return num / Math.sqrt(denX * denY);
};

// Cálculo do Alfa de Cronbach
const calculateCronbachAlpha = (itemsArrayOfArrays: number[][]) => {
  const k = itemsArrayOfArrays.length;
  if (k === 0 || itemsArrayOfArrays[0].length < 2) return null;
  
  const itemVariances = itemsArrayOfArrays.map(calculateVariance);
  const sumOfItemVariances = itemVariances.reduce((a, b) => a + b, 0);

  const n = itemsArrayOfArrays[0].length;
  const totalScores = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      totalScores[i] += itemsArrayOfArrays[j][i];
    }
  }
  
  const varTotal = calculateVariance(totalScores);
  if (varTotal === 0) return 0;

  return (k / (k - 1)) * (1 - (sumOfItemVariances / varTotal));
};

export function CSS33ValidationPanel() {
  const [cssData, setCssData] = useState<any[]>([]);
  const [igtData, setIgtData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [css, igt] = await Promise.all([
          adminApi.css33(),
          adminApi.igtSummary()
        ]);
        setCssData(css);
        setIgtData(igt);
      } catch (e) {
        console.error("Erro ao carregar dados de validação", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (cssData.length < 4) return null;

    // 1. Extrair todas as respostas válidas (itens 1 a 33)
    const validParticipants = cssData.filter(p => p.responses && Object.keys(p.responses).length >= 33);
    if (validParticipants.length < 4) return null;

    const itemsMap: Record<string, number[]> = {};
    for (let i = 1; i <= 33; i++) itemsMap[`item_${i}`] = [];

    validParticipants.forEach(p => {
      for (let i = 1; i <= 33; i++) {
        itemsMap[`item_${i}`].push(Number(p.responses[`item_${i}`] || 0));
      }
    });

    const allItemsArray = Object.values(itemsMap);
    const globalAlpha = calculateCronbachAlpha(allItemsArray);

    // 2. Validade de Critério (CSS-33 vs IGT)
    const matchedData = validParticipants.map(css => {
      const igt = igtData.find(i => i.participant_id === css.participant_id);
      return igt ? { cssTotal: Number(css.total_score), igtNet: Number(igt.net_total) } : null;
    }).filter(Boolean) as { cssTotal: number, igtNet: number }[];

    const pearson = matchedData.length >= 4 
      ? calculatePearson(matchedData.map(d => d.cssTotal), matchedData.map(d => d.igtNet))
      : null;

    return { 
      n: validParticipants.length, 
      globalAlpha, 
      pearson, 
      matchedN: matchedData.length 
    };
  }, [cssData, igtData]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Calculando matrizes psicométricas...</div>;

  if (!stats) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-700 flex flex-col items-center justify-center h-48">
      <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
      <p className="font-medium">Amostra Insuficiente para Validação</p>
      <p className="text-sm opacity-80">São necessários pelo menos 4 testes completos para gerar os cálculos de Alpha e Correlação.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500"/> Amostra Válida (N)</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{stats.n}</span>
          <span className="text-xs text-slate-400 mt-1">Participantes com 33 itens preenchidos</span>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Alfa de Cronbach (Global)</span>
          <span className={`text-3xl font-bold mt-2 ${stats.globalAlpha && stats.globalAlpha >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {stats.globalAlpha ? stats.globalAlpha.toFixed(3) : "—"}
          </span>
          <span className="text-xs text-slate-400 mt-1">Consistência Interna {stats.globalAlpha && stats.globalAlpha >= 0.7 ? '(Adequada)' : '(Atenção)'}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-blue-500"/> Validade de Critério (r)</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">
            {stats.pearson ? stats.pearson.toFixed(3) : "—"}
          </span>
          <span className="text-xs text-slate-400 mt-1">CSS-33 Total vs IGT Net Score</span>
        </div>
      </div>

      {/* Painel Descritivo */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Interpretação Preliminar</h3>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-2">
            <strong className="text-slate-800 min-w-[140px]">Consistência Interna:</strong> 
            <span>O Alfa de Cronbach mede se todos os 33 itens apontam para a mesma direção (Cybercondria). Um valor acima de 0.70 indica que a escala é confiável no contexto da sua amostra. Seu valor atual é <b>{stats.globalAlpha?.toFixed(3)}</b>.</span>
          </li>
          <li className="flex gap-2">
            <strong className="text-slate-800 min-w-[140px]">Validade de Critério:</strong> 
            <span>A correlação de Pearson (<b>{stats.pearson?.toFixed(3)}</b>) avalia o poder preditivo da escala. Se for significativamente negativa, confirma a hipótese de que níveis mais altos de cybercondria estão ligados a piores desempenhos na tomada de decisão (IGT).</span>
          </li>
          <li className="flex gap-2">
            <strong className="text-slate-800 min-w-[140px]">Análise Fatorial:</strong> 
            <span>Para validar que as perguntas se agrupam perfeitamente nos fatores originais (Compulsão, Sofrimento, etc.), será necessária a extração via AFC (Análise Fatorial Confirmatória) em software dedicado (ex: Jamovi/JASP) quando atingir a amostra de 500 participantes.</span>
          </li>
        </ul>
      </div>

    </div>
  );
}