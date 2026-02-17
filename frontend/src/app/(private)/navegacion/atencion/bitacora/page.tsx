"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, Filter, Calendar, 
  Tag, ArrowUpRight, Loader2, RefreshCcw,
  Clock, User, History
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function BitacoraAtencionPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- LÓGICA DE DATOS ADAPTADA ---
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * 💡 NOTA: Dado que el endpoint de logs globales no existe aún (Error 404),
       * consumimos /patients pidiendo los últimos registros gestionados.
       */
      const res = await api.get("/patients", { 
        params: { limit: 20, sort: 'updatedAt:desc' } 
      }); 

      if (res.data.success) {
        const data = res.data.data || [];
        
        // Mapeamos los datos para que luzcan como entradas de bitácora
        const formattedLogs = data
          .filter((p: any) => p.followups && p.followups.length > 0)
          .map((p: any) => ({
            id: p.id,
            patientName: `${p.firstName} ${p.lastName}`,
            patientId: p.id,
            observation: p.followups[0].observation || "Se realizó actualización de expediente.",
            status: p.followups[0].status || "PENDIENTE",
            updatedAt: p.updatedAt || p.createdAt,
            userName: "Navegador" // Aquí podrías mapear el nombre del usuario si el backend lo envía
          }));

        setLogs(formattedLogs);
      }
    } catch (error) {
      console.error("Error cargando bitácora:", error);
      setLogs([]); // Limpiamos para evitar loops de error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filtrado local
  const filteredLogs = logs.filter(log => 
    log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.observation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* --- HEADER --- */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-200 text-white">
                <History size={28}/>
            </div>
            Bitácora de Eventos
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-lg">Historial cronológico de las últimas gestiones en el sistema.</p>
        </div>
        
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Actualizar historial
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- FILTROS LATERALES --- */}
        <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Filter size={14} className="text-emerald-500"/> Buscar nota
                </h3>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Paciente o contenido..." 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </aside>

        {/* --- LÍNEA DE TIEMPO --- */}
        <main className="lg:col-span-9 space-y-4">
            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4"/>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando flujo de datos...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay eventos registrados recientemente</p>
                </div>
            ) : (
                filteredLogs.map((log, index) => (
                    <div key={index} className="group relative pl-8 pb-8 last:pb-0">
                        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200 group-last:bg-transparent"></div>
                        <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-white border-4 border-emerald-500 shadow-md z-10"></div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-emerald-200 transition-all">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs uppercase shadow-lg">
                                        {log.userName?.substring(0,2) || "NV"}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                                            {log.userName}
                                        </h4>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                            Actualizó expediente clínico
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 text-slate-400">
                                    <Clock size={14}/>
                                    <span className="text-[10px] font-black">{new Date(log.updatedAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 mb-4">
                                <p className="text-slate-700 text-sm leading-relaxed font-medium italic">
                                    "{log.observation}"
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente:</span>
                                        <span className="text-[10px] font-black text-slate-900 uppercase">{log.patientName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag size={12} className="text-emerald-500"/>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                            log.status === 'REALIZADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                </div>

                                <Link 
                                    href={`/navegacion/atencion/casos/${log.patientId}`}
                                    className="flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:text-slate-900 uppercase tracking-[0.2em] transition-all group/link"
                                >
                                    Abrir expediente <ArrowUpRight size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform"/>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </main>
      </div>
    </div>
  );
}