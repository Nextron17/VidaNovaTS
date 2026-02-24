"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, Filter, Calendar, 
  Tag, ArrowUpRight, Loader2, RefreshCcw,
  Clock, User, History, Activity, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function BitacoraAtencionPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- LÓGICA DE DATOS: HISTORIAL GLOBAL DE SEGUIMIENTOS ---
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Pedimos una cantidad grande de pacientes para extraer todo su historial
      const res = await api.get("/navegacion/patients", { 
        params: { limit: 100 } 
      }); 

      if (res.data.success) {
        const patients = res.data.data || [];
        const allFollowups: any[] = [];
        
        // Extraemos TODOS los seguimientos de TODOS los pacientes
        patients.forEach((p: any) => {
            if (p.followups && p.followups.length > 0) {
                p.followups.forEach((f: any) => {
                    allFollowups.push({
                        id: f.id,
                        patientId: p.id,
                        patientName: `${p.firstName} ${p.lastName}`,
                        documentNumber: p.documentNumber,
                        serviceName: f.serviceName || f.cups || 'Gestión Clínica',
                        observation: f.observation || "Sin detalles de gestión.",
                        status: f.status || "PENDIENTE",
                        date: f.dateRequest || f.createdAt, // Usamos la fecha real del evento
                        userName: "Navegador" // Aquí podrías mapear el nombre del usuario si el backend lo envía
                    });
                });
            }
        });

        // Ordenamos cronológicamente (Más recientes primero)
        allFollowups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setLogs(allFollowups);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filtrado local inteligente
  const filteredLogs = logs.filter(log => 
    log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.observation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
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
            Historial de Gestión
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-lg">Línea de tiempo global de seguimientos y atenciones.</p>
        </div>
        
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Actualizar Muro
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- FILTROS LATERALES --- */}
        <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-6">
                <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Filter size={14} className="text-emerald-500"/> Búsqueda de Eventos
                </h3>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Paciente, procedimiento o nota..." 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Eventos</span>
                        <span className="text-lg font-black text-emerald-600">{filteredLogs.length}</span>
                    </div>
                </div>
            </div>
        </aside>

        {/* --- LÍNEA DE TIEMPO GLOBAL --- */}
        <main className="lg:col-span-8 space-y-6">
            {loading ? (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
                    <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4"/>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Extrayendo historial clínico...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No se encontraron registros</p>
                </div>
            ) : (
                <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {filteredLogs.map((log, index) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">
                            
                            {/* Icono Central (Timeline Dot) */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                {log.status === 'REALIZADO' ? <CheckCircle2 size={16}/> : <Activity size={16}/>}
                            </div>
                            
                            {/* Tarjeta de Evento */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 relative">
                                
                                {/* Flechita de la tarjeta */}
                                <div className="absolute top-5 -left-2 md:group-odd:-left-2 md:group-even:-right-2 w-4 h-4 bg-white border-l border-b border-slate-100 transform rotate-45 md:group-odd:border-r-0 md:group-odd:border-t-0 md:group-even:border-l-0 md:group-even:border-b-0 md:group-even:border-r md:group-even:border-t"></div>

                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} className="text-slate-400"/>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {new Date(log.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${
                                        log.status === 'REALIZADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {log.status}
                                    </span>
                                </div>

                                <h4 className="font-black text-slate-900 text-base leading-tight mb-1 relative z-10">
                                    {log.patientName}
                                </h4>
                                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight mb-4 relative z-10">
                                    {log.serviceName}
                                </p>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 relative z-10">
                                    <p className="text-slate-600 text-sm leading-relaxed italic line-clamp-3">
                                        "{log.observation}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50 relative z-10">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <User size={12}/> Por: {log.userName}
                                    </div>
                                    <Link 
                                        href={`/navegacion/atencion/pacientes/perfil?id=${log.patientId}`}
                                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                        title="Ver Perfil Completo"
                                    >
                                        <ArrowUpRight size={14} />
                                    </Link>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </main>
      </div>
    </div>
  );
}