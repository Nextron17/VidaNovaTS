"use client";

import React, { useState, useEffect } from "react";
import { 
  BellRing, CalendarX, Clock, CheckCircle2, 
  AlertTriangle, ArrowRight, User, Loader2,
  ShieldAlert, Database, History, RefreshCcw
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function AlertasPage() {
  const [loading, setLoading] = useState(true);
  const [inconsistencies, setInconsistencies] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts');
      if (res.data.success) {
          setInconsistencies(res.data.inconsistencies);
          setOverdue(res.data.overdue);
      }
    } catch (error) {
      console.error("Error cargando alertas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);
  
  const totalAlertas = inconsistencies.length + overdue.length;

  if (loading) {
      return (
        <div className="w-full min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
            <p className="text-slate-500 font-black tracking-widest uppercase text-xs animate-pulse">Analizando integridad de datos...</p>
        </div>
      );
  }

  if (totalAlertas === 0) {
      return (
        <div className="w-full min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100 ring-4 ring-white">
                <CheckCircle2 size={48}/>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Sistema Optimizado</h2>
            <p className="text-slate-500 max-w-md text-lg font-medium leading-relaxed">
                No se detectaron inconsistencias de fechas ni retrasos críticos en la navegación de pacientes.
            </p>
            <Link href="/navegacion/admin" className="mt-10 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 uppercase text-xs tracking-widest">
                Volver al Centro de Control
            </Link>
        </div>
      );
  }

  return (
    <div className="w-full min-h-screen bg-[#fcfdfe] p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* --- HEADER INDIGO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
            <div className="flex items-center gap-4 mb-3">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-200">
                    <ShieldAlert size={28} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Auditoría de Alertas</h1>
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-xl leading-snug">
                Supervisión técnica de la calidad de la información y priorización de trámites demorados.
            </p>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={fetchAlerts}
                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm group"
            >
                <RefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500"/>
            </button>
            <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">{totalAlertas} Críticos Detectados</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* --- 1. SECCIÓN: INCONSISTENCIAS TÉCNICAS --- */}
          <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shadow-sm">
                    <Database size={20}/>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-none uppercase tracking-tight">Errores de Integridad</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Inconsistencias en fechas</p>
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[650px]">
                  <div className="p-4 bg-rose-50/40 border-b border-rose-50 text-[10px] text-rose-700 font-black uppercase tracking-[0.1em] flex items-center gap-3">
                      <AlertTriangle size={14}/>
                      Inconsistencia: Fecha de Cita es menor a la Fecha de Solicitud
                  </div>

                  <div className="overflow-y-auto custom-scrollbar flex-grow p-6 space-y-4">
                      {inconsistencies.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                              <CheckCircle2 size={64} strokeWidth={1} className="mb-4"/>
                              <p className="font-black uppercase tracking-widest text-xs">Sin errores técnicos</p>
                          </div>
                      ) : (
                          inconsistencies.map((item) => (
                            <div key={item.id} className="p-5 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all bg-white group relative overflow-hidden shadow-sm hover:shadow-xl">
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <History size={40} className="text-indigo-50"/>
                                </div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 font-black text-xs uppercase">
                                            {item.paciente.substring(0,2)}
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-900 text-sm uppercase block tracking-tight">{item.paciente}</span>
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{item.eps || 'No EPS'}</span>
                                        </div>
                                    </div>
                                    <Link 
                                      href={`/navegacion/admin/pacientes/perfil?id=${item.id}`}
                                      className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest"
                                    >
                                      Corregir
                                    </Link>
                                </div>
                                
                                <div className="text-xs text-slate-500 font-medium mb-5 pl-1 tracking-tight italic">
                                    "{item.proc}"
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                    <div className="space-y-1">
                                        <span className="text-slate-400 uppercase font-black text-[9px] tracking-[0.15em] block">Solicitud</span>
                                        <span className="font-black text-indigo-600 text-xs">
                                            {new Date(item.fecha_sol).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-4">
                                        <span className="text-rose-400 uppercase font-black text-[9px] tracking-[0.15em] block">Cita (Error)</span>
                                        <span className="font-black text-rose-600 text-xs">
                                            {new Date(item.fecha_cita).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* --- 2. SECCIÓN: ALERTAS OPERATIVAS (VENCIDOS) --- */}
          <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm">
                    <Clock size={20}/>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-none uppercase tracking-tight">Retrasos en Navegación</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Trámites con más de 30 días</p>
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[650px]">
                  <div className="p-4 bg-amber-50/40 border-b border-amber-50 text-[10px] text-amber-700 font-black uppercase tracking-[0.1em] flex items-center gap-3">
                      <History size={14}/>
                      Atención: Pacientes esperando gestión fuera del tiempo estándar
                  </div>

                  <div className="overflow-y-auto custom-scrollbar flex-grow p-6 space-y-4">
                      {overdue.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                              <CheckCircle2 size={64} strokeWidth={1} className="mb-4"/>
                              <p className="font-black uppercase tracking-widest text-xs">Operación al día</p>
                          </div>
                      ) : (
                          overdue.map((item) => (
                            <div key={item.id} className="p-5 rounded-3xl border border-slate-100 hover:border-amber-200 transition-all bg-white group shadow-sm hover:shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg font-black text-xs uppercase tracking-tighter ring-4 ring-slate-50">
                                            {item.paciente.substring(0,2)}
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-900 text-sm uppercase block tracking-tight leading-none mb-1">{item.paciente}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.eps}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm border border-rose-200 uppercase tracking-widest">
                                            <Clock size={10}/> {item.dias} Días
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Servicio Pendiente</span>
                                    <span className="text-xs font-bold text-slate-700 leading-tight block">{item.proc}</span>
                                </div>

                                <Link 
                                  href={`/navegacion/admin/gestion?id=${item.id}`}
                                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                >
                                  GESTIONAR AHORA <ArrowRight size={14}/>
                                </Link>
                            </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

      </div>
      
      {/* Estilos para el scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

    </div>
  );
}