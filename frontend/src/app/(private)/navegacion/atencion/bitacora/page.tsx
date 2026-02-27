"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, History, Activity, CheckCircle2, 
  RefreshCcw, Loader2, Calendar, Clock, User, ArrowUpRight, 
  Stethoscope, Hash, FileSymlink
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function BitacoraAtencionPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");

  // --- LÓGICA DE DATOS OPTIMIZADA ---
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // 🚀 Aumentamos el límite para traer un buen historial
      const res = await api.get("/navegacion/patients", { params: { limit: 500 } }); 
      
      if (res.data.success) {
        const patients = res.data.data || [];
        const allFollowups: any[] = [];
        
        patients.forEach((p: any) => {
            if (p.followups && Array.isArray(p.followups)) {
                p.followups.forEach((f: any) => {
                    const dateRaw = f.dateRequest || p.createdAt || new Date().toISOString();
                    
                    allFollowups.push({
                        id: f.id,
                        patientId: p.id,
                        patientName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'PACIENTE SIN NOMBRE',
                        documentNumber: p.documentNumber || "S/N",
                        cups: f.cups || "", 
                        serviceName: f.serviceName || f.cups || 'Trámite Administrativo',
                        observation: f.observation || "No se registraron detalles adicionales.",
                        status: f.status || "PENDIENTE",
                        date: new Date(dateRaw),
                        userName: "Equipo Vidanova" 
                    });
                });
            }
        });
        
        // Ordenamos cronológicamente (Más recientes primero)
        allFollowups.sort((a, b) => b.date.getTime() - a.date.getTime());
        setLogs(allFollowups);
      }
    } catch (error) {
      console.error("❌ Error cargando historial:", error);
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // --- 🚀 FILTROS COMBINADOS (Búsqueda + Estado) ---
  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      log.patientName.toLowerCase().includes(search) ||
      log.documentNumber.toLowerCase().includes(search) || 
      log.cups.toLowerCase().includes(search) || 
      log.serviceName.toLowerCase().includes(search) || 
      log.observation.toLowerCase().includes(search);
    
    const matchesStatus = filterStatus === "TODOS" || log.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-800">
      
      {/* ================= HEADER AZUL (Estilo Atención) ================= */}
      <div className="bg-blue-600 pb-20 pt-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 text-white">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
                    <History size={28} strokeWidth={2.5}/>
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none mb-1">
                        Bitácora de Eventos
                    </h1>
                    <p className="text-blue-100 font-medium text-sm">
                        Historial consolidado de gestiones, citas y observaciones.
                    </p>
                </div>
            </div>
            
            <button 
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
            >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> 
                {loading ? 'Sincronizando...' : 'Sincronizar'}
            </button>
        </div>
      </div>

      {/* ================= BARRA DE BÚSQUEDA FLOTANTE ================= */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 -mt-10 relative z-10 mb-10">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-3 flex flex-col md:flex-row gap-3 items-center">
              
              <div className="relative flex-1 w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input 
                      type="text" 
                      placeholder="Buscar por cédula, nombre, CUPS o nota médica..." 
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              <div className="w-full md:w-auto flex gap-2">
                  <select 
                      className="px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 w-full md:w-auto"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                  >
                      <option value="TODOS">Todos los Estados</option>
                      <option value="PENDIENTE">🟠 Pendientes</option>
                      <option value="EN_GESTION">🟡 En Gestión</option>
                      <option value="AGENDADO">🔵 Agendados</option>
                      <option value="REALIZADO">🟢 Realizados</option>
                  </select>
              </div>

          </div>
          
          <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-500 px-4">
              <span>Se encontraron <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{filteredLogs.length}</span> registros.</span>
          </div>
      </div>

      {/* ================= CONTENIDO (FEED) ================= */}
      <main className="max-w-5xl mx-auto px-6 md:px-12">
          {loading ? (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
                  <Loader2 size={40} className="animate-spin text-blue-600 mb-4"/>
                  <h3 className="font-black text-slate-700 text-lg">Compilando Expedientes</h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">Leyendo la base de datos masiva...</p>
              </div>
          ) : filteredLogs.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-300 shadow-sm">
                  <FileSymlink size={48} className="mx-auto text-slate-200 mb-4"/>
                  <h3 className="font-black text-slate-700 text-xl">Sin resultados</h3>
                  <p className="text-slate-400 font-medium mt-2 max-w-sm mx-auto">No se encontraron registros que coincidan con tu búsqueda actual. Intenta limpiar los filtros.</p>
              </div>
          ) : (
              <div className="relative before:absolute before:inset-0 before:ml-[28px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[3px] before:bg-gradient-to-b before:from-blue-500 before:via-blue-200 before:to-transparent">
                  {filteredLogs.map((log) => (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 transition-all hover:-translate-y-1">
                          
                          {/* PUNTO CENTRAL (ICONO) */}
                          <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                              {log.status === 'REALIZADO' ? <CheckCircle2 size={24} strokeWidth={2.5}/> : <Activity size={24} strokeWidth={2.5}/>}
                          </div>
                          
                          {/* TARJETA DE EVENTO */}
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                              
                              <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                      <Calendar size={12}/>
                                      {log.date.toLocaleDateString([], { day:'2-digit', month:'short', year:'numeric' })} 
                                      <span className="text-slate-300 mx-0.5">•</span> 
                                      {log.date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                                  </div>
                                  <Link 
                                      href={`/navegacion/atencion/pacientes/perfil?id=${log.patientId}`}
                                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                      title="Ver Expediente"
                                  >
                                      <ArrowUpRight size={16} />
                                  </Link>
                              </div>

                              <div className="mb-4">
                                  <h4 className="font-black text-slate-800 text-lg leading-tight uppercase group-hover:text-blue-700 transition-colors">
                                      {log.patientName}
                                  </h4>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                      <span className="flex items-center gap-1 text-[10px] font-mono font-black bg-slate-800 text-white px-2 py-0.5 rounded-md">
                                          <Hash size={10}/> {log.documentNumber}
                                      </span>
                                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                          log.status === 'REALIZADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          log.status === 'AGENDADO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          log.status === 'CANCELADO' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                          {log.status.replace('_', ' ')}
                                      </span>
                                  </div>
                              </div>

                              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-5 text-blue-600"><Stethoscope size={48}/></div>
                                  <p className="text-xs font-black text-blue-900 uppercase tracking-tight relative z-10 flex items-center gap-2">
                                      {log.serviceName}
                                  </p>
                                  {log.cups && (
                                      <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">CUPS: {log.cups}</p>
                                  )}
                              </div>

                              {log.observation && log.observation !== "No se registraron detalles adicionales." && (
                                  <div className="pl-4 border-l-4 border-amber-300 py-1">
                                      <p className="text-slate-600 text-xs font-medium leading-relaxed italic">
                                          "{log.observation}"
                                      </p>
                                  </div>
                              )}

                              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] font-black text-slate-400">
                                  <User size={12}/> REPORTADO POR: <span className="text-slate-600">{log.userName}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </main>
    </div>
  );
}