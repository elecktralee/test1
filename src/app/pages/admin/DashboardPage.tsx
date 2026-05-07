import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { adminApi } from "../../utils/api";
import { DCCAPanel } from "./components/DCCAPanel";
import { RegressionScatter } from "./components/RegressionScatter";
import { ResultsPanel } from "../../components/ResultsPanel";
import {
  Users, CheckCircle2, Hourglass, Timer,
  Search, Globe, Calendar,
  ClipboardList, Brain, Activity,
  LayoutDashboard, BarChart2, Target,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Label,
  Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  RadialBarChart, RadialBar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  ReferenceLine, LineChart, Line, LabelList,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Metrics {
  total: number; completed: number; inProgress: number;
  completionRate: number; avgDuration: number;
  genders: Record<string, number>; devices: Record<string, number>;
  browsers: Record<string, number>; states: Record<string, number>;
  healthcare: Record<string, number>; dailyCompletions: Record<string, number>;
}
interface CorrelationPoint {
  participant_id: string; age: number | null;
  internet_hours_ord: number | null; internet_hours_label: string | null;
  health_search_freq_ord: number | null; health_search_freq_label: string | null;
  gender: string | null; education: string | null; monthly_income: string | null;
  css33_total: number | null; css33_compulsion: number | null; css33_distress: number | null;
  css33_excess: number | null; css33_reassurance: number | null; css33_distrust: number | null;
  bai_total: number | null; gse_total: number | null;
  igt_net: number | null; igt_balance: number | null;
  igt_net_b1: number | null; igt_net_b2: number | null; igt_net_b3: number | null;
  igt_net_b4: number | null; igt_net_b5: number | null;
}
interface Analytics {
  healthSearchFrequency: Record<string, number>; internetHours: Record<string, number>;
  ageGroups: Record<string, number>; correlationData: CorrelationPoint[];
  ageGroupOrder: string[]; internetHoursOrder: string[]; healthSearchOrder: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────
const PALETTE = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16"];

const NUMERIC_VARS = [
  { key: "css33_total",       label: "CSS-33 Total (Cybercondria)",        group: "Psicométricas" },
  { key: "css33_compulsion",  label: "CSS-33 Compulsão",                   group: "CSS-33 Subescalas" },
  { key: "css33_distress",    label: "CSS-33 Sofrimento",                  group: "CSS-33 Subescalas" },
  { key: "css33_excess",      label: "CSS-33 Excessividade",               group: "CSS-33 Subescalas" },
  { key: "css33_reassurance", label: "CSS-33 Reasseguramento",             group: "CSS-33 Subescalas" },
  { key: "css33_distrust",    label: "CSS-33 Desconfiança Médica",         group: "CSS-33 Subescalas" },
  { key: "bai_total",         label: "BAI Total (Ansiedade)",               group: "Psicométricas" },
  { key: "gse_total",         label: "GSE Total (Autoeficácia)",            group: "Psicométricas" },
  { key: "igt_net",           label: "IGT Net Total (C+D)−(A+B)",          group: "IGT" },
  { key: "igt_balance",       label: "IGT Saldo Final (R$)",               group: "IGT" },
  { key: "igt_net_b1",        label: "IGT Net Bloco 1 (1–20)",             group: "IGT Blocos" },
  { key: "igt_net_b2",        label: "IGT Net Bloco 2 (21–40)",            group: "IGT Blocos" },
  { key: "igt_net_b3",        label: "IGT Net Bloco 3 (41–60)",            group: "IGT Blocos" },
  { key: "igt_net_b4",        label: "IGT Net Bloco 4 (61–80)",            group: "IGT Blocos" },
  { key: "igt_net_b5",        label: "IGT Net Bloco 5 (81–100)",           group: "IGT Blocos" },
  { key: "age",               label: "Idade (anos)",                       group: "Sociodemográficas" },
  { key: "internet_hours_ord",     label: "Horas de Internet/dia",         group: "Sociodemográficas" },
  { key: "health_search_freq_ord", label: "Freq. Busca Saúde",             group: "Sociodemográficas" },
];

const SUGGESTED_PAIRS = [
  { x:"css33_total", y:"igt_net",   label:"CSS-33 × IGT Net",  badge:"H1",      badgeColor:"bg-indigo-100 text-indigo-700",  desc:"Cybercondria → menos escolhas vantajosas no IGT" },
  { x:"gse_total",   y:"igt_net",   label:"GSE × IGT Net",     badge:"H2",      badgeColor:"bg-emerald-100 text-emerald-700",desc:"Autoeficácia → desempenho satisfatório no IGT" },
  { x:"bai_total",   y:"igt_net",   label:"BAI × IGT Net",     badge:"Bivariada",badgeColor:"bg-amber-100 text-amber-700",   desc:"Ansiedade → tomada de decisão (covariável)" },
  { x:"css33_total", y:"bai_total", label:"CSS-33 × BAI",      badge:"Bivariada",badgeColor:"bg-amber-100 text-amber-700",   desc:"Cybercondria × ativação ansiogênica" },
  { x:"css33_total", y:"gse_total", label:"CSS-33 × GSE",      badge:"Moderação",badgeColor:"bg-violet-100 text-violet-700", desc:"Cybercondria × autoeficácia (variável moderadora)" },
  { x:"bai_total",   y:"gse_total", label:"BAI × GSE",         badge:"Bivariada",badgeColor:"bg-amber-100 text-amber-700",   desc:"Ansiedade × Autoeficácia" },
  { x:"age",         y:"igt_net",   label:"Idade × IGT Net",   badge:"Obj.5",   badgeColor:"bg-sky-100 text-sky-700",        desc:"Moduladores etários vs. tomada de decisão" },
  { x:"internet_hours_ord",y:"css33_total",label:"Internet × CSS-33",badge:"Obj.5",badgeColor:"bg-sky-100 text-sky-700",     desc:"Exposição geracional à internet vs. cybercondria" },
];

const CATEGORICAL_VARS = [
  { key:"gender",                  label:"Gênero" },
  { key:"education",               label:"Escolaridade" },
  { key:"monthly_income",          label:"Renda Mensal" },
  { key:"internet_hours_label",    label:"Horas de Internet" },
  { key:"health_search_freq_label",label:"Freq. Busca Saúde" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const withColors = (arr:{name:string;value:number}[]) =>
  arr.map((d,i)=>({...d, fill:PALETTE[i%PALETTE.length]}));
const objToArr = (obj:Record<string,number>) =>
  Object.entries(obj).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
const toOrdered = (counts:Record<string,number>, order:string[]) =>
  order.map(name=>({name, value: counts[name]??0}));
const labelOf = (key:string) => NUMERIC_VARS.find(v=>v.key===key)?.label??key;

function pearsonR(data:CorrelationPoint[], xKey:string, yKey:string) {
  const pairs = data.filter(d=>(d as any)[xKey]!=null&&(d as any)[yKey]!=null);
  const n = pairs.length;
  if (n<3) return {r:null,n};
  const xs = pairs.map(d=>(d as any)[xKey] as number);
  const ys = pairs.map(d=>(d as any)[yKey] as number);
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let sxy=0,sx2=0,sy2=0;
  for(let i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sx2+=(xs[i]-mx)**2;sy2+=(ys[i]-my)**2;}
  const r=sxy/Math.sqrt(sx2*sy2);
  return {r:isNaN(r)?null:r, n};
}
function interpretR(r:number){
  const a=Math.abs(r), d=r>0?"positiva":"negativa";
  if(a<0.10) return {label:"negligenciável",color:"text-slate-500",bg:"bg-slate-100"};
  if(a<0.30) return {label:`fraca ${d}`,color:"text-amber-700",bg:"bg-amber-50"};
  if(a<0.50) return {label:`moderada ${d}`,color:"text-orange-700",bg:"bg-orange-50"};
  if(a<0.70) return {label:`forte ${d}`,color:r>0?"text-emerald-700":"text-red-700",bg:r>0?"bg-emerald-50":"bg-red-50"};
  return {label:`muito forte ${d}`,color:r>0?"text-emerald-800":"text-red-800",bg:r>0?"bg-emerald-50":"bg-red-50"};
}
function groupMeans(data:CorrelationPoint[], catKey:string, numKey:string) {
  const groups:Record<string,number[]>={};
  data.forEach(d=>{
    const cat=(d as any)[catKey] as string, num=(d as any)[numKey] as number;
    if(cat==null||num==null) return;
    if(!groups[cat]) groups[cat]=[];
    groups[cat].push(num);
  });
  return Object.entries(groups).map(([name,vals])=>{
    const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
    const sd=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/vals.length);
    return {name, mean:+mean.toFixed(1), sd:+sd.toFixed(1), n:vals.length};
  }).sort((a,b)=>b.mean-a.mean);
}

// ── Custom Lollipop Shapes ─────────────────────────────────────────────────────
function VLollipop(props: any) {
  const { x, y, width, height, fill } = props;
  if (!width || !height || height <= 0) return <g />;
  const cx = x + width / 2;
  const dotR = 6;
  return (
    <g>
      <line x1={cx} y1={y + height} x2={cx} y2={y + dotR * 2}
        stroke={fill} strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
      <circle cx={cx} cy={y + dotR} r={dotR} fill={fill} />
    </g>
  );
}

function HLollipop(props: any) {
  const { x, y, width, height, fill } = props;
  if (!width || width <= 0) return <g />;
  const cy = y + height / 2;
  const dotR = 7;
  return (
    <g>
      <line x1={x} y1={cy} x2={x + Math.max(0, width - dotR)} y2={cy}
        stroke={fill} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
      <circle cx={x + width} cy={cy} r={dotR} fill={fill} />
    </g>
  );
}

// ── Chart Sub-Components ───────────────────────────────────────────────────────

/** KPI card */
function MetricCard({title,value,sub,icon,color,trend}:{
  title:string;value:string|number;sub?:string;icon:React.ReactNode;color:string;trend?:number;
}){
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{background:"radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 60%)"}} />
      <div className="flex items-start justify-between mb-4">
        <span className="w-8 h-8 flex items-center justify-center">{icon}</span>
        {sub && <span className={`text-xs font-bold px-2 py-1 rounded-full ${color}`}>{sub}</span>}
      </div>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      <p className="text-sm text-slate-400 mt-1 font-medium">{title}</p>
    </div>
  );
}

/** Donut chart with center count */
function DonutCard({title,data}:{title:string;data:{name:string;value:number}[]}){
  const colored = withColors(data);
  const total = data.reduce((s,d)=>s+d.value,0);
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-1">{title}</h3>
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={colored} dataKey="value" nameKey="name"
            cx="50%" cy="48%" innerRadius={48} outerRadius={72}
            paddingAngle={3} isAnimationActive={false}>
            {colored.map((d,i)=><Cell key={i} fill={d.fill} stroke="none"/>)}
            <Label value={total} position="center"
              style={{fontSize:22,fontWeight:900,fill:"#1e293b"}} />
          </Pie>
          <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}} />
          <Legend iconType="circle" iconSize={8}
            wrapperStyle={{fontSize:11,paddingTop:8}} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Radial ring bars (replaces horizontal bar cards) */
function RadialCard({title,data,icon}:{title:string;data:{name:string;value:number}[];icon?:React.ReactNode}){
  const max = Math.max(...data.map(d=>d.value),1);
  const colored = data.map((d,i)=>({
    name: d.name, count: d.value,
    value: Math.max(1, Math.round((d.value/max)*100)),
    fill: PALETTE[i%PALETTE.length],
  }));
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">{icon}{title}</h3>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={150} height={150}>
            <RadialBarChart innerRadius={18} outerRadius={70} data={colored}
              startAngle={90} endAngle={-270} barSize={9}>
              <RadialBar dataKey="value" cornerRadius={5} isAnimationActive={false} />
              <Tooltip
                content={({active,payload}:any)=>{
                  if(!active||!payload?.length) return null;
                  const d=payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
                      <p className="font-bold text-slate-700">{d.name}</p>
                      <p style={{color:d.fill}} className="font-black text-base">{d.count}</p>
                    </div>
                  );
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {colored.map(d=>(
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{background:d.fill}} />
              <span className="text-xs text-slate-500 flex-1 leading-tight truncate">{d.name}</span>
              <span className="text-xs font-black ml-1" style={{color:d.fill}}>{d.count}</span>
            </div>
          ))}
          {colored.every(d=>d.count===0)&&(
            <p className="text-slate-400 text-xs">Sem dados ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Vertical lollipop (replaces bar chart for age groups) */
function LollipopVCard({title,data,icon}:{title:string;data:{name:string;value:number}[];icon?:React.ReactNode}){
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">{icon}{title}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={data} margin={{top:16,right:8,left:-22,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
          <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}}/>
          <Bar dataKey="value" barSize={28} shape={(p:any)=><VLollipop {...p}/>} isAnimationActive={false}>
            {data.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal lollipop (replaces horizontal bar for states / group comparison) */
function LollipopHCard({title,data,icon}:{title:string;data:{name:string;value:number}[];icon?:React.ReactNode}){
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-1.5">{icon && <>{icon}{" "}</>}{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length*34)}>
        <ComposedChart data={data} layout="vertical" margin={{top:0,right:32,bottom:0,left:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false}/>
          <XAxis type="number" tick={{fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
          <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={90} axisLine={false} tickLine={false}/>
          <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}}/>
          <Bar dataKey="value" barSize={20} shape={(p:any)=><HLollipop {...p}/>} isAnimationActive={false}>
            {data.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Gradient area + line (replaces bar chart for daily completions) */
function GradientAreaCard({title,data}:{title:string;data:{date:string;count:number}[]}){
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{top:10,right:12,left:-18,bottom:0}}>
          <defs>
            <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
          <XAxis dataKey="date" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}}/>
          <Area type="monotone" dataKey="count" name="Completados"
            stroke="#6366f1" strokeWidth={2.5}
            fill="url(#gradDaily)"
            dot={{r:4,fill:"#6366f1",stroke:"white",strokeWidth:2}}
            activeDot={{r:6}} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Radar chart — CSS-33 subscale mean profile */
function CSS33RadarCard({data}:{data:CorrelationPoint[]}){
  const fields = [
    {key:"css33_compulsion",  label:"Compulsão"},
    {key:"css33_excess",      label:"Excesso"},
    {key:"css33_reassurance", label:"Reasseg."},
    {key:"css33_distrust",    label:"Desconfiança"},
    {key:"css33_distress",    label:"Sofrimento"},
  ];
  const radarData = fields.map(f=>{
    const vals = data.filter(d=>(d as any)[f.key]!=null).map(d=>(d as any)[f.key] as number);
    return {subject:f.label, mean:vals.length?+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):0, fullMark:35};
  });
  const hasSub = radarData.some(d=>d.mean>0);
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-1">Perfil Médio CSS-33 — Subescalas</h3>
      <p className="text-xs text-slate-400 mb-3">Média entre participantes</p>
      {hasSub ? (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{top:10,right:20,bottom:10,left:20}}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:"#64748b"}}/>
            <PolarRadiusAxis tick={{fontSize:9,fill:"#94a3b8"}} angle={90}/>
            <Radar dataKey="mean" name="Média" stroke="#6366f1" fill="#6366f1"
              fillOpacity={0.18} strokeWidth={2.5} dot={{r:4,fill:"#6366f1"}}
              isAnimationActive={false}/>
            <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}}
              formatter={(v:any)=>[v,"Média"]}/>
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-44 text-slate-300 text-sm border border-dashed border-slate-200 rounded-xl">
          Aguardando dados do CSS-33
        </div>
      )}
    </div>
  );
}

/** IGT Learning Curve — net score por bloco (curva de aprendizado) */
function IGTLearningCurve({data}:{data:CorrelationPoint[]}){
  const blocks = [
    {key:"igt_net_b1",label:"B1"},
    {key:"igt_net_b2",label:"B2"},
    {key:"igt_net_b3",label:"B3"},
    {key:"igt_net_b4",label:"B4"},
    {key:"igt_net_b5",label:"B5"},
  ];
  const curveData = blocks.map(b=>{
    const vals = data.filter(d=>(d as any)[b.key]!=null).map(d=>(d as any)[b.key] as number);
    return {label:b.label, mean:vals.length?+(vals.reduce((a,v)=>a+v,0)/vals.length).toFixed(2):null, n:vals.length};
  }).filter(d=>d.mean!==null);
  const hasData = curveData.length>0;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-700 text-sm mb-1">Curva de Aprendizado IGT</h3>
      <p className="text-xs text-slate-400 mb-3">Net score médio por bloco de 20 tentativas · acima de 0 = vantajoso</p>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={curveData} margin={{top:10,right:12,left:-18,bottom:0}}>
            <defs>
              <linearGradient id="gradIGT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradIGTneg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false}/>
            <XAxis dataKey="label" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4"
              label={{value:"Neutro",position:"right",fontSize:10,fill:"#94a3b8"}}/>
            <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}}
              formatter={(v:any)=>[v,"Net médio"]}/>
            <Area type="monotone" dataKey="mean" name="Net médio"
              stroke="#10b981" strokeWidth={2.5}
              fill="url(#gradIGT)"
              dot={{r:5,fill:"#10b981",stroke:"white",strokeWidth:2}}
              activeDot={{r:7}} isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-44 text-slate-300 text-sm border border-dashed border-slate-200 rounded-xl">
          Aguardando dados do IGT
        </div>
      )}
    </div>
  );
}

/** Scatter panel used in moderation tab — now with regression line */
function ScatterPanel({data,xKey,yKey,color,title,subtitle}:{
  data:CorrelationPoint[];xKey:string;yKey:string;color:string;title:string;subtitle?:string;
}){
  const pts = data
    .filter(d=>(d as any)[xKey]!=null&&(d as any)[yKey]!=null)
    .map(d=>({x:(d as any)[xKey] as number, y:(d as any)[yKey] as number}));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="font-bold text-slate-700 text-sm mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mb-3">{subtitle}</p>}
      <RegressionScatter
        data={pts}
        xLabel={labelOf(xKey)}
        yLabel={labelOf(yKey)}
        color={color}
        height={220}
        showCI={true}
        compact={true}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics,setMetrics]     = useState<Metrics|null>(null);
  const [analytics,setAnalytics] = useState<Analytics|null>(null);
  const [loading,setLoading]     = useState(true);
  const [error,setError]         = useState("");

  const [mainTab,setMainTab] = useState<"dashboard"|"results">("dashboard");
  const [crossTab,setCrossTab] = useState<"scatter"|"group"|"moderation"|"dcca">("scatter");
  const [corrX,setCorrX] = useState("css33_total");
  const [corrY,setCorrY] = useState("igt_net");
  const [grpCat,setGrpCat] = useState("gender");
  const [grpNum,setGrpNum] = useState("css33_total");
  const [modPred,setModPred] = useState("css33_total");
  const [modOut,setModOut]   = useState("igt_net");
  const [modMod,setModMod]   = useState("gse_total");

  useEffect(()=>{
    Promise.all([adminApi.metrics(),adminApi.analytics()])
      .then(([m,a])=>{setMetrics(m);setAnalytics(a);})
      .catch(e=>setError("Erro: "+e.message))
      .finally(()=>setLoading(false));
  },[]);

  const scatterData = useMemo(()=>{
    if(!analytics) return [];
    return analytics.correlationData
      .filter(d=>(d as any)[corrX]!=null&&(d as any)[corrY]!=null)
      .map(d=>({x:(d as any)[corrX] as number,y:(d as any)[corrY] as number}));
  },[analytics,corrX,corrY]);

  const corrResult = useMemo(()=>{
    if(!analytics) return null;
    return pearsonR(analytics.correlationData,corrX,corrY);
  },[analytics,corrX,corrY]);

  const groupData = useMemo(()=>{
    if(!analytics) return [];
    return groupMeans(analytics.correlationData,grpCat,grpNum);
  },[analytics,grpCat,grpNum]);

  const moderationData = useMemo(()=>{
    if(!analytics) return {low:[],high:[],medianVal:null as number|null};
    const valid=analytics.correlationData.filter(
      d=>(d as any)[modMod]!=null&&(d as any)[modPred]!=null&&(d as any)[modOut]!=null
    );
    if(valid.length<4) return {low:[],high:[],medianVal:null};
    const sorted=[...valid].sort((a,b)=>(a as any)[modMod]-(b as any)[modMod]);
    const mid=Math.floor(sorted.length/2);
    const medianVal=(sorted.length%2===1)
      ?(sorted[mid] as any)[modMod]
      :((sorted[mid-1] as any)[modMod]+(sorted[mid] as any)[modMod])/2;
    return {low:sorted.slice(0,mid),high:sorted.slice(mid),medianVal};
  },[analytics,modPred,modOut,modMod]);

  if(loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mr-3"/>
        Carregando dados...
      </div>
    </AdminLayout>
  );
  if(error||!metrics) return (
    <AdminLayout>
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">{error||"Erro"}</div>
    </AdminLayout>
  );

  const dailyData = Object.entries(metrics.dailyCompletions)
    .sort(([a],[b])=>a.localeCompare(b)).slice(-14)
    .map(([date,count])=>({date:date.slice(5),count}));

  const topStates        = objToArr(metrics.states).slice(0,8);
  const healthSearchData = analytics?toOrdered(analytics.healthSearchFrequency,analytics.healthSearchOrder):[];
  const internetHoursData= analytics?toOrdered(analytics.internetHours,analytics.internetHoursOrder):[];
  const ageGroupsData    = analytics?toOrdered(analytics.ageGroups,analytics.ageGroupOrder):[];
  const activePair       = SUGGESTED_PAIRS.find(p=>p.x===corrX&&p.y===corrY);

  return (
    <AdminLayout>
      <div className="space-y-7">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h2>
            <p className="text-slate-400 text-sm mt-0.5">Cybercondria &amp; Tomada de Decisão · Érica Silva Mascarenhas · USP-RP</p>
          </div>
          <span className="text-xs text-slate-300 font-mono">{new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span>
        </div>

        {/* ── Main Tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {([
            {id:"dashboard", label:"📊 Visão Geral"},
            {id:"results",   label:"📝 Resultados & Discussão"},
          ] as const).map(t=>(
            <button key={t.id} onClick={()=>setMainTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                mainTab===t.id
                  ?"bg-white text-indigo-700 shadow-sm"
                  :"text-slate-400 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: RESULTADOS ────────────────────────────────────────────── */}
        {mainTab==="results"&&analytics&&(
          <ResultsPanel correlationData={analytics.correlationData} metrics={metrics}/>
        )}
        {mainTab==="results"&&!analytics&&(
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-300">Carregando dados…</div>
        )}

        {/* ── TAB: DASHBOARD (conteúdo existente abaixo) ─────────────────── */}
        {mainTab==="dashboard"&&<>

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total de Acessos"  value={metrics.total}     sub="participantes" icon={<Users className="w-5 h-5 text-indigo-600"/>}   color="bg-indigo-100 text-indigo-700"/>
          <MetricCard title="Completados"        value={metrics.completed} sub={`${metrics.completionRate}%`} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600"/>} color="bg-emerald-100 text-emerald-700"/>
          <MetricCard title="Em Progresso"       value={metrics.inProgress} sub="ativos"       icon={<Hourglass className="w-5 h-5 text-amber-600"/>}  color="bg-amber-100 text-amber-700"/>
          <MetricCard title="Duração Média"      value={metrics.avgDuration>0?`${metrics.avgDuration} min`:"—"} sub="por participante" icon={<Timer className="w-5 h-5 text-blue-600"/>} color="bg-blue-100 text-blue-700"/>
        </div>

        {/* ── Donuts: Gênero + Dispositivo + Acesso Saúde ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DonutCard title="Gênero"         data={objToArr(metrics.genders)}/>
          <DonutCard title="Dispositivo"    data={objToArr(metrics.devices)}/>
          <DonutCard title="Acesso à Saúde" data={objToArr(metrics.healthcare)}/>
        </div>

        {/* ── Daily completions (gradient area) ──────────────────────────── */}
        {dailyData.length>0&&(
          <GradientAreaCard
            title="Completamentos por Dia · últimos 14 dias"
            data={dailyData}
          />
        )}

        {/* ── States (lollipop) + Browsers (donut) ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topStates.length>0&&(
            <LollipopHCard title="Estados (top 8)" data={topStates}/>
          )}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm mb-1">Navegadores</h3>
            {objToArr(metrics.browsers).length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={withColors(objToArr(metrics.browsers))} dataKey="value"
                    cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                    paddingAngle={3} isAnimationActive={false}>
                    {withColors(objToArr(metrics.browsers)).map((d,i)=>(
                      <Cell key={i} fill={d.fill} stroke="none"/>
                    ))}
                    <Label value={objToArr(metrics.browsers).reduce((s,d)=>s+d.value,0)}
                      position="center"
                      style={{fontSize:20,fontWeight:900,fill:"#1e293b"}}/>
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12}}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:8}}/>
                </PieChart>
              </ResponsiveContainer>
            ):<p className="text-slate-300 text-center py-10 text-sm">Sem dados</p>}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ANÁLISE SOCIODEMOGRÁFICA
        ════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"/>
            <h2 className="text-lg font-black text-slate-800">Análise Sociodemográfica</h2>
          </div>
          {/* Row 1: radial + radial + lollipop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RadialCard  title="Freq. de Busca de Saúde"  icon={<Search   className="w-3.5 h-3.5 text-slate-400"/>} data={healthSearchData}/>
            <RadialCard  title="Horas de Internet por Dia" icon={<Globe    className="w-3.5 h-3.5 text-slate-400"/>} data={internetHoursData}/>
            <LollipopVCard title="Faixa Etária"            icon={<Calendar className="w-3.5 h-3.5 text-slate-400"/>} data={ageGroupsData}/>
          </div>
          {/* Row 2: CSS-33 radar + IGT learning curve */}
          {analytics&&(
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <CSS33RadarCard data={analytics.correlationData}/>
              <IGTLearningCurve data={analytics.correlationData}/>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            CORRELAÇÃO E CRUZAMENTO
        ════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 bg-violet-500 rounded-full"/>
            <h2 className="text-lg font-black text-slate-800">Correlação e Cruzamento de Dados</h2>
          </div>
          <p className="text-slate-400 text-xs mb-4 ml-4">Análise bivariada — Mascarenhas &amp; Silva, 2025</p>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
            {([
              {id:"scatter",    label:"Pearson r"},
              {id:"dcca",       label:"ρDCCA"},
              {id:"moderation", label:"Moderação (H3)"},
              {id:"group",      label:"Comparação"},
            ] as const).map(t=>(
              <button key={t.id} onClick={()=>setCrossTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  crossTab===t.id
                    ?"bg-white text-indigo-700 shadow-sm"
                    :"text-slate-400 hover:text-slate-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: ρDCCA ───────────────────────────────────────────────── */}
          {crossTab==="dcca"&&analytics&&<DCCAPanel data={analytics.correlationData}/>}
          {crossTab==="dcca"&&!analytics&&(
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-300">Carregando…</div>
          )}

          {/* ── TAB: SCATTER / PEARSON r ─────────────────────────────────── */}
          {crossTab==="scatter"&&(
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              {/* Suggested pairs */}
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pares indicados no pré-projeto:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PAIRS.map(pair=>{
                    const active=corrX===pair.x&&corrY===pair.y;
                    return (
                      <button key={`${pair.x}-${pair.y}`}
                        onClick={()=>{setCorrX(pair.x);setCorrY(pair.y);}}
                        title={pair.desc}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          active
                            ?"bg-indigo-600 text-white border-indigo-600 shadow"
                            :"bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active?"bg-white/20 text-white":pair.badgeColor}`}>
                          {pair.badge}
                        </span>
                        {pair.label}
                      </button>
                    );
                  })}
                </div>
                {activePair&&<p className="text-slate-400 text-xs mt-2 italic">{activePair.desc}</p>}
              </div>

              {/* Variable selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {[{val:corrX,set:setCorrX,label:"Eixo X"},{val:corrY,set:setCorrY,label:"Eixo Y"}].map(({val,set,label})=>(
                  <div key={label}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <select value={val} onChange={e=>set(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {["Psicométricas","CSS-33 Subescalas","IGT","IGT Blocos","Sociodemográficas"].map(g=>(
                        <optgroup key={g} label={g}>
                          {NUMERIC_VARS.filter(v=>v.group===g).map(v=>(
                            <option key={v.key} value={v.key}>{v.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Chart + side stats */}
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 min-w-0">
                  <RegressionScatter
                    data={scatterData}
                    xLabel={labelOf(corrX)}
                    yLabel={labelOf(corrY)}
                    color="#6366f1"
                    height={340}
                    showCI={true}
                    compact={false}
                  />
                </div>

                {/* Side stats panel */}
                <div className="lg:w-48 flex-shrink-0 flex flex-col gap-3">
                  {corrResult?.r != null && (()=>{
                    const i = interpretR(corrResult.r);
                    return (<>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pearson r</p>
                        <p className="text-3xl font-black text-indigo-600">{corrResult.r.toFixed(3)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">R²</p>
                        <p className="text-3xl font-black text-slate-600">{(corrResult.r**2).toFixed(3)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">n</p>
                        <p className="text-3xl font-black text-slate-600">{corrResult.n}</p>
                      </div>
                      <div className={`rounded-2xl p-3 text-center ${i.bg}`}>
                        <p className={`text-xs font-bold leading-snug ${i.color}`}>{i.label}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100 text-[11px] text-indigo-700 space-y-0.5">
                        <p className="font-bold mb-1 text-xs">Cohen (1988)</p>
                        <p>|r| &lt; .10 → negligenciável</p>
                        <p>.10–.29 → fraca</p>
                        <p>.30–.49 → moderada</p>
                        <p>.50–.69 → forte</p>
                        <p>≥ .70 → muito forte</p>
                      </div>
                    </>);
                  })()}
                  {(!corrResult || corrResult.r == null) && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center text-slate-400 text-sm">
                      Selecione um par de variáveis
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: MODERAÇÃO (H3) ───────────────────────────────────────── */}
          {crossTab==="moderation"&&(
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm text-violet-800">
                <p className="font-bold mb-1">H3 — Moderação da Autoeficácia (GSE)</p>
                <p>A associação negativa entre cybercondria e IGT será <strong>mais fraca (ou inexistente)</strong> em indivíduos com <strong>alta autoeficácia</strong>.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[{val:modPred,set:setModPred,label:"Preditor (X)"},{val:modOut,set:setModOut,label:"Desfecho (Y)"},{val:modMod,set:setModMod,label:"Moderador (M)"}].map(({val,set,label})=>(
                  <div key={label}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                    <select value={val} onChange={e=>set(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {NUMERIC_VARS.map(v=><option key={v.key} value={v.key}>{v.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {moderationData.medianVal!=null?(
                <>
                  <p className="text-xs text-slate-400 text-center">
                    Mediana de <strong>{labelOf(modMod)}</strong> = <strong>{moderationData.medianVal}</strong> &nbsp;·&nbsp;
                    Baixo n={moderationData.low.length} &nbsp;vs&nbsp; Alto n={moderationData.high.length}
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ScatterPanel data={moderationData.low as CorrelationPoint[]} xKey={modPred} yKey={modOut}
                      color="#ef4444" title={`Baixa ${labelOf(modMod)}`} subtitle="H3 prevê associação MAIS FORTE aqui"/>
                    <ScatterPanel data={moderationData.high as CorrelationPoint[]} xKey={modPred} yKey={modOut}
                      color="#10b981" title={`Alta ${labelOf(modMod)}`} subtitle="H3 prevê associação MAIS FRACA aqui"/>
                  </div>
                  {(()=>{
                    const rL=pearsonR(moderationData.low as CorrelationPoint[],modPred,modOut);
                    const rH=pearsonR(moderationData.high as CorrelationPoint[],modPred,modOut);
                    const ok=rL.r!=null&&rH.r!=null&&Math.abs(rL.r)>Math.abs(rH.r);
                    return (
                      <div className={`rounded-2xl p-4 border text-sm font-medium ${ok?"bg-emerald-50 border-emerald-200 text-emerald-800":"bg-slate-50 border-slate-200 text-slate-600"}`}>
                        {rL.r!=null&&rH.r!=null
                          ?<><span className="font-bold">H3: </span>r(baixo)={rL.r.toFixed(3)} | r(alto)={rH.r.toFixed(3)}. {ok?"Padrão compatível com H3.":"Padrão ainda não compatível — aguardar mais dados."}</>
                          :"Dados insuficientes para comparação."}
                      </div>
                    );
                  })()}
                </>
              ):(
                <div className="flex flex-col items-center justify-center h-48 text-slate-300 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-sm">Mín. 4 participantes com as 3 variáveis</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: COMPARAÇÃO POR GRUPO (lollipop) ─────────────────────── */}
          {crossTab==="group"&&(
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Variável de Agrupamento</label>
                  <select value={grpCat} onChange={e=>setGrpCat(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {CATEGORICAL_VARS.map(v=><option key={v.key} value={v.key}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Medida de Desfecho</label>
                  <select value={grpNum} onChange={e=>setGrpNum(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {NUMERIC_VARS.map(v=><option key={v.key} value={v.key}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {groupData.length>0?(
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height={Math.max(200,groupData.length*48)}>
                      <ComposedChart data={groupData} layout="vertical"
                        margin={{top:0,right:55,bottom:0,left:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false}/>
                        <XAxis type="number" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={145}
                          axisLine={false} tickLine={false}/>
                        <Tooltip formatter={(v,n)=>[v,n==="mean"?"Média":n]}/>
                        <Bar dataKey="mean" barSize={22}
                          shape={(p:any)=><HLollipop {...p}/>} isAnimationActive={false}>
                          {groupData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:w-72 flex-shrink-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estatísticas</p>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-400">Grupo</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-400">M</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-400">DP</th>
                            <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-400">n</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {groupData.map((row,i)=>(
                            <tr key={row.name} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-700 text-xs">
                                <span className="inline-block w-2 h-2 rounded-full mr-1.5"
                                  style={{background:PALETTE[i%PALETTE.length]}}/>
                                {row.name}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-slate-800 text-xs">{row.mean}</td>
                              <td className="px-3 py-2 text-right text-slate-400 text-xs">{row.sd}</td>
                              <td className="px-3 py-2 text-right text-slate-400 text-xs">{row.n}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ):(
                <div className="flex flex-col items-center justify-center h-48 text-slate-300 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-sm">Dados insuficientes para este cruzamento</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Quick links ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 text-sm mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              {label:"Participantes",      path:"/admin/participants",    icon:<Users          className="w-4 h-4"/>},
              {label:"Sociodemográfico",   path:"/admin/sociodemografico",icon:<ClipboardList  className="w-4 h-4"/>},
              {label:"CSS-33",             path:"/admin/css33",           icon:<Globe          className="w-4 h-4"/>},
              {label:"BAI",                path:"/admin/bai",             icon:<Brain          className="w-4 h-4"/>},
              {label:"GSE",                path:"/admin/gse",             icon:<Activity       className="w-4 h-4"/>},
              {label:"IGT — Visualizador", path:"/admin/igt",             icon:<LayoutDashboard className="w-4 h-4"/>},
              {label:"IGT — Resumo",       path:"/admin/igt-summary",     icon:<BarChart2      className="w-4 h-4"/>},
              {label:"IGT — Tentativas",   path:"/admin/igt-trials",      icon:<Target         className="w-4 h-4"/>},
            ] as {label:string;path:string;icon:React.ReactNode}[]).map(link=>(
              <button key={link.path} onClick={()=>navigate(link.path)}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-sm text-slate-600 hover:text-indigo-700 transition-all font-medium">
                <span>{link.icon}</span><span>{link.label}</span>
              </button>
            ))}
         </div>
        </div>

        </>}

      </div>
    </AdminLayout>
  );
}
