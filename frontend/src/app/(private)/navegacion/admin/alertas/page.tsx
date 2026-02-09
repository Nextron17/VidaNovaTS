"use client";

import React, { useState, useEffect } from "react";
import { 
  BellRing, CalendarX, Clock, CheckCircle2, 
  AlertTriangle, ArrowRight, User, Loader2
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function AlertasPage() {
  const [loading, setLoading] = useState(true);
  const [inconsistencies, setInconsistencies] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
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

    fetchAlerts();
  }, []);
  
  const totalAlertas = inconsistencies.length + overdue.length;

  // --- ESTADO DE CARGA ---
  if (loading) {
      return (
        <div className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40}/>
            <p className="text-slate-400 font-bold animate-pulse">Escaneando sistema...</p>
        </div>
      );
  }

  // --- ESTADO LIMPIO ---
  if (totalAlertas === 0) {
      return (
        <div className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 size={48}/>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">¡Todo Limpio!</h2>
            <p className="text-slate-500 max-w-md">
                No hay alertas críticas ni errores de datos pendientes. El sistema está funcionando perfectamente.
            </p>
            <Link href="/navegacion/admin" className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                Volver al Tablero
            </Link>
        </div>
      );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
                    <BellRing size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Centro de Alertas</h1>
            </div>
            <p className="text-slate-500 font-medium ml-1">
                Panel de control de calidad y priorización de casos.
            </p>
        </div>
        
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-sm font-bold text-slate-700">{totalAlertas} Problemas Detectados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- 1. INCONSISTENCIAS DE FECHA --- */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-rose-700 flex items-center gap-2">
                      <CalendarX size={20}/> Inconsistencias de Fecha
                  </h3>
                  <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-black">
                      {inconsistencies.length}
                  </span>
              </div>
              
              <div className="p-4 bg-rose-50/50 border-b border-rose-100 text-xs text-rose-800 font-medium flex gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0"/>
                  <p>Error Lógico: La fecha de <strong>Cita</strong> está registrada antes que la fecha de <strong>Solicitud</strong>.</p>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-grow p-4 space-y-3">
                  {inconsistencies.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                          <CheckCircle2 size={48} className="mb-2"/>
                          <p>Sin inconsistencias</p>
                      </div>
                  ) : (
                      inconsistencies.map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all group bg-white">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                                        <User size={16}/>
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm">{item.paciente}</span>
                                </div>
                                <Link 
                                  href={`/navegacion/admin/detalle?id=${item.id}`} // 🔥 Llevamos al detalle para corregir
                                  className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                                >
                                    Corregir
                                </Link>
                            </div>
                            
                            <div className="text-xs text-slate-500 mb-3 pl-9">{item.proc}</div>
                            
                            <div className="flex gap-4 pl-9 text-xs">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 uppercase font-black text-[10px] tracking-wider">Solicitud</span>
                                    <span className="font-bold text-emerald-600">
                                        {new Date(item.fecha_sol).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="w-px bg-slate-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 uppercase font-black text-[10px] tracking-wider">Cita (Errada)</span>
                                    <span className="font-bold text-rose-600">
                                        {new Date(item.fecha_cita).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                      ))
                  )}
              </div>
          </div>

          {/* --- 2. CASOS VENCIDOS --- */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
              <div className="p-6 border-b border-amber-100 bg-amber-50/30 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-amber-700 flex items-center gap-2">
                      <Clock size={20}/> Casos Vencidos (+30 Días)
                  </h3>
                  <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-black">
                      {overdue.length}
                  </span>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-grow p-4 space-y-3">
                  {overdue.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                          <CheckCircle2 size={48} className="mb-2"/>
                          <p>Sin casos vencidos</p>
                      </div>
                  ) : (
                      overdue.map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group bg-white">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                                        <User size={16}/>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-800 text-sm block">{item.paciente}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.eps}</span>
                                    </div>
                                </div>
                                <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                                    <Clock size={10}/> {item.dias} días
                                </span>
                            </div>
                            
                            <div className="pl-9 mt-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 truncate max-w-[150px]" title={item.proc}>
                                    {item.proc}
                                </span>
                                
                                <Link 
                                  href={`/navegacion/admin/detalle?id=${item.id}`} // 🔥 Link al detalle real
                                  className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline decoration-2 underline-offset-4"
                                >
                                    Gestionar Ahora <ArrowRight size={12}/>
                                </Link>
                            </div>
                        </div>
                      ))
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}