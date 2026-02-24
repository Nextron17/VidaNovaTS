"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, Filter, Calendar, 
  ArrowUpRight, Loader2, RefreshCcw,
  Clock, User, History, Activity, CheckCircle2, MoreHorizontal, Fingerprint
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function BitacoraAtencionPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- LÓGICA DE DATOS ---
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // 🚀 Aumentamos el límite a 500 (o 1000) para traer un muro histórico enorme
      const res = await api.get("/navegacion/patients", { params: { limit: 500 } }); 
      
      if (res.data.success) {
        const patients = res.data.data || [];
        const allFollowups: any[] = [];
        
        patients.forEach((p: any) => {
            if (p.followups && p.followups.length > 0) {
                p.followups.forEach((f: any) => {
                    allFollowups.push({
                        id: f.id,
                        patientId: p.id,
                        patientName: `${p.firstName} ${p.lastName}`,
                        documentNumber: p.documentNumber || "", // 👈 Extraemos Cédula
                        cups: f.cups || "", // 👈 Extraemos explícitamente el CUPS
                        serviceName: f.serviceName || f.cups || 'Gestión Clínica',
                        observation: f.observation || "Sin detalles de gestión.",
                        status: f.status || "PENDIENTE",
                        date: f.dateRequest || f.createdAt,
                        userName: "Navegador" 
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

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // --- 🚀 FILTRO GLOBAL SUPER POTENCIADO ---
  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    return (
      log.patientName.toLowerCase().includes(search) ||
      log.documentNumber.toLowerCase().includes(search) || // Busca por Cédula
      log.cups.toLowerCase().includes(search) ||           // Busca por CUPS exacto
      log.serviceName.toLowerCase().includes(search) ||    // Busca por nombre del examen
      log.observation.toLowerCase().includes(search)       // Busca palabras en la nota
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans text-slate-800 pb-32">
      
      {/* --- HEADER COMPACTO --- */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <History size={20}/>
          </div>
          <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                Bitácora de Gestión
              </h1>
              <p className="text-slate-500 text-xs font-medium">Historial global de atención a pacientes.</p>
          </div>
        </div>
        
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""}/> Actualizar
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- FILTROS LATERALES --- */}
        <aside className="lg:col-span-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Filter size={12} className="text-emerald-500"/> Búsqueda Avanzada
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    <input 
                        type="text" 
                        placeholder="Nombres, cédula, CUPS o notas..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Eventos encontrados:</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{filteredLogs.length}</span>
                </div>
            </div>
        </aside>

        {/* --- LÍNEA DE TIEMPO VERTICAL --- */}
        <main className="lg:col-span-8">
            {loading ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3"/>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Compilando historial masivo...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                    <FileText size={32} className="mx-auto text-slate-200 mb-3"/>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sin coincidencias para la búsqueda</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {filteredLogs.map((log, index) => {
                        const isLast = index === filteredLogs.length - 1;
                        return (
                        <div key={log.id} className="flex gap-4 relative group">
                            
                            {/* Línea conectora */}
                            {!isLast && <div className="absolute left-[11px] top-7 bottom-0 w-[2px] bg-slate-100 group-hover:bg-emerald-100 transition-colors"></div>}
                            
                            {/* Punto de tiempo */}
                            <div className="relative z-10 shrink-0 mt-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors ${
                                    log.status === 'REALIZADO' 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white' 
                                    : 'bg-white border-slate-200 text-slate-400 group-hover:border-emerald-400 group-hover:text-emerald-500'
                                }`}>
                                    {log.status === 'REALIZADO' ? <CheckCircle2 size={12}/> : <Activity size={12}/>}
                                </div>
                            </div>
                            
                            {/* Tarjeta de Contenido */}
                            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all mb-3">
                                
                                {/* Cabecera: Fecha y Estado */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <Clock size={10}/>
                                        {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border ${
                                        log.status === 'REALIZADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                        {log.status}
                                    </span>
                                </div>

                                {/* Identificación de Paciente y Trámite */}
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-slate-800 text-sm leading-tight uppercase">
                                                {log.patientName}
                                            </h4>
                                            {/* Badge Cédula (Permite que se encuentre visualmente la cédula) */}
                                            {log.documentNumber && (
                                              <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                <Fingerprint size={10}/> {log.documentNumber}
                                              </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight">
                                                {log.serviceName}
                                            </p>
                                            {/* Badge CUPS */}
                                            {log.cups && (
                                                <span className="text-[9px] font-mono font-black text-white bg-emerald-500 px-1.5 rounded-sm">
                                                    CUPS: {log.cups}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <Link 
                                        href={`/navegacion/atencion/pacientes/perfil?id=${log.patientId}`}
                                        className="bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors p-1.5 rounded-lg border border-slate-100"
                                        title="Ver expediente completo"
                                    >
                                        <ArrowUpRight size={14} />
                                    </Link>
                                </div>

                                {/* Observación */}
                                <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 relative">
                                    <MoreHorizontal size={12} className="text-slate-300 absolute top-2 right-2 opacity-50"/>
                                    <p className="text-slate-600 text-xs font-medium leading-relaxed italic pr-4">
                                        "{log.observation}"
                                    </p>
                                </div>

                                {/* Footer: Usuario */}
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                    <User size={10}/> Gestión registrada por: <span className="text-slate-600 font-black">{log.userName}</span>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </main>
      </div>
    </div>
  );
}