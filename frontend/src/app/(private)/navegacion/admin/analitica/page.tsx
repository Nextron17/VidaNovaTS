"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, ChartPie, Users, TrendingUp, 
  Download, Calendar, RefreshCcw, AlertCircle, Filter, Loader2,
  ChevronLeft, ChevronRight // Importamos flechas
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid, Area, AreaChart 
} from 'recharts';
import api from "@/src/app/services/api";

// --- COLORES ---
const COLORS_GENDER = ['#ec4899', '#3b82f6', '#94a3b8']; 
const COLORS_AGE = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'];

export default function AnaliticaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Estado del Año Seleccionado (Por defecto el actual)
  const [year, setYear] = useState(new Date().getFullYear());

  // Datos
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalRequestsYear, setTotalRequestsYear] = useState(0);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const fetchAnalytics = async () => {
      setLoading(true);
      setError(false);
      try {
          // Enviamos el año como parámetro
          const res = await api.get(`/navegacion/analytics/dashboard?year=${year}`);
          
          if (res.data.success) {
              setTotalPatients(res.data.totalPatients);
              setTotalRequestsYear(res.data.totalRequestsInYear); // Nuevo dato
              setGenderData(res.data.genderData);
              setAgeData(res.data.ageData);
              setTrendData(res.data.trendData);
          } else {
              setError(true);
          }
      } catch (err) {
          console.error("Error fetching analytics:", err);
          setError(true);
      } finally {
          setTimeout(() => setLoading(false), 500);
      }
  };

  // Recargar cuando cambia el año
  useEffect(() => { 
      fetchAnalytics(); 
  }, [year]);

  // Manejadores de cambio de año
  const prevYear = () => setYear(prev => prev - 1);
  const nextYear = () => setYear(prev => prev + 1);

  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
              <AlertCircle size={48} className="text-rose-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800">Error de conexión</h2>
              <button onClick={fetchAnalytics} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2">
                  <RefreshCcw size={16}/> Reintentar
              </button>
          </div>
      );
  }

  return (
    <div className="w-full min-h-screen font-sans text-slate-800 pb-24 bg-slate-50/50 p-6 md:p-10">
      
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <Link href="/navegacion/admin" className="p-2 -ml-2 rounded-xl hover:bg-white text-slate-400 hover:text-slate-700 transition-all">
                    <ArrowLeft size={24}/>
                </Link>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tablero Gerencial</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium ml-11">Visión estratégica en tiempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
            
            {/* --- SELECTOR DE AÑO (NUEVO) --- */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button 
                    onClick={prevYear}
                    disabled={loading}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors disabled:opacity-50"
                >
                    <ChevronLeft size={20}/>
                </button>
                
                <div className="px-4 py-1 flex items-center gap-2 font-black text-slate-700 select-none min-w-[100px] justify-center">
                    <Calendar size={16} className="text-blue-500"/>
                    <span className="text-lg">{year}</span>
                </div>

                <button 
                    onClick={nextYear}
                    disabled={loading || year >= new Date().getFullYear()} // Opcional: Bloquear futuro
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronRight size={20}/>
                </button>
            </div>

            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
                <Download size={18}/> <span className="hidden sm:inline">Exportar</span>
            </button>
        </div>
      </header>

      {/* KPI & GRÁFICOS SUPERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* KPI TOTAL */}
        <div className="lg:col-span-12 xl:col-span-3">
            <div className="h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 opacity-80">
                        <div className="p-2 bg-white/20 rounded-lg"><Users size={20} /></div>
                        <span className="text-sm font-bold uppercase">Pacientes Activos</span>
                    </div>
                    {loading ? <div className="h-10 w-24 bg-white/20 rounded animate-pulse"/> : 
                        <h2 className="text-5xl font-black mb-2">{totalPatients.toLocaleString()}</h2>
                    }
                    <p className="text-blue-100 text-sm">Base total histórica.</p>
                </div>
                
                {/* KPI Secundario del Año */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-xs font-bold text-blue-200 uppercase block mb-1">Solicitudes {year}</span>
                            <span className="text-2xl font-black">{totalRequestsYear}</span>
                        </div>
                        <TrendingUp size={24} className="text-blue-300 opacity-50"/>
                    </div>
                </div>
            </div>
        </div>

        {/* GÉNERO */}
        <div className="lg:col-span-6 xl:col-span-4">
            <div className="h-full bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-pink-500 rounded-full"></span> Distribución por Género
                </h3>
                <div className="flex-1 min-h-[250px] relative">
                    {loading ? <SkeletonChart type="circle"/> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={genderData.length > 0 ? genderData : [{name: 'Sin datos', value: 1}]} 
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} 
                                    dataKey="value" stroke="none"
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                                    ))}
                                    {genderData.length === 0 && <Cell fill="#e2e8f0" />}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" iconType="circle" iconSize={8}/>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    {!loading && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">100%</div>}
                </div>
            </div>
        </div>

        {/* EDAD */}
        <div className="lg:col-span-6 xl:col-span-5">
            <div className="h-full bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-purple-500 rounded-full"></span> Rangos de Edad
                </h3>
                <div className="flex-1 min-h-[250px]">
                    {loading ? <SkeletonChart type="bar"/> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} dy={10}/>
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                                <Tooltip cursor={{fill: '#f8fafc', radius: 8}} content={<CustomTooltip />} />
                                <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={40} name="Pacientes">
                                    {ageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_AGE[index % COLORS_AGE.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* 3. TENDENCIAS */}
      <div className="w-full">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20}/></div>
                    Tendencia de Solicitudes ({year})
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Nuevos Casos
                </div>
            </div>

            <div className="h-80 w-full">
                {loading ? <SkeletonChart type="area"/> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSolicitudes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="solicitudes" 
                                stroke="#3b82f6" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorSolicitudes)" 
                                activeDot={{r: 6, strokeWidth: 0, fill: '#2563eb', stroke: '#fff'}}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPERS ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill || payload[0].stroke }}></span>
                    <p className="text-slate-800 font-black text-lg">{payload[0].value.toLocaleString()}</p>
                </div>
            </div>
        );
    }
    return null;
};

const SkeletonChart = ({ type }: { type: 'bar' | 'circle' | 'area' }) => (
    <div className="w-full h-full flex items-end justify-center gap-4 animate-pulse px-4 pb-4">
        {type === 'bar' && [1,2,3,4,5].map(i => <div key={i} className="bg-slate-100 rounded-t-lg w-full" style={{ height: `${Math.random() * 60 + 20}%` }}></div>)}
        {type === 'circle' && <div className="w-40 h-40 rounded-full border-[16px] border-slate-100 m-auto"></div>}
        {type === 'area' && <div className="w-full h-full bg-slate-50 rounded-xl relative overflow-hidden"><div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-100 opacity-50"></div></div>}
    </div>
);