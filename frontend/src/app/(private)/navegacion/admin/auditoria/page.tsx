"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Stethoscope, Users, FileWarning, 
  Database, CheckCircle2, AlertOctagon,
  ArrowLeft, Search, ShieldAlert,
  Copy, Loader2, Wrench, Trash2, 
  Calendar, ArrowRight, Download,
  UploadCloud, UserPlus, Edit3, 
  Layers, RefreshCw, FileText, User, Activity, Info
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from 'xlsx';

// --- DICCIONARIO DE CAMPOS DE BD A ESPAÑOL ---
const fieldDictionary: any = {
    firstName: "Nombres", lastName: "Apellidos", documentNumber: "Cédula", 
    phone: "Teléfono", insurance: "EPS", status: "Estado", 
    observation: "Observación", category: "Categoría/Proc", 
    dateAppointment: "Fecha de Cita", cups: "Código CUPS", 
    city: "Ciudad", department: "Departamento"
};

const translateFields = (keys: string[]) => {
    if (!keys || keys.length === 0) return "";
    return keys.map(k => fieldDictionary[k] || k).join(", ");
};

const safeJSONParse = (data: any) => {
    if (!data) return {};
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return {}; }
    }
    return data;
};

// --- HELPER: TRADUCTOR HUMANO DE AUDITORÍA AVANZADO ---
const getAuditVisuals = (log: any) => {
    const { action, tableName, recordId } = log;
    const newVals = safeJSONParse(log.newValues);
    const oldVals = safeJSONParse(log.oldValues);

    // 🕵️ EXTRAER NOMBRE Y CC (Si existe en oldValues o newValues)
    const contextData = Object.keys(oldVals).length > 0 ? oldVals : newVals;
    let targetInfo = "";
    if (contextData && (contextData.firstName || contextData.documentNumber)) {
        const name = `${contextData.firstName || ''} ${contextData.lastName || ''}`.trim();
        const cc = contextData.documentNumber || "S.N";
        targetInfo = `${name} (CC: ${cc})`;
    } else if (recordId !== 'MASIVO' && !recordId.includes('[')) {
        targetInfo = `Registro Interno ID: ${recordId}`;
    }

    switch (action) {
        case 'IMPORT':
            return {
                title: "Importación Masiva de Excel",
                desc: "Actualizó la base de datos subiendo un nuevo archivo.",
                details: newVals.sheetsProcessed !== undefined 
                    ? `Nuevos: ${newVals.sheetsProcessed} | Actualizados: ${newVals.updates}` 
                    : "",
                color: "text-purple-600", bg: "bg-purple-100", icon: <UploadCloud size={16} />
            };
        case 'CREATE':
            return {
                title: "Creación de Registro",
                desc: `Registró un nuevo ${tableName === 'Patients' ? 'Paciente' : 'Seguimiento'} manualmente.`,
                target: targetInfo,
                color: "text-emerald-600", bg: "bg-emerald-100", icon: <UserPlus size={16} />
            };
        case 'UPDATE':
            const changedFields = translateFields(Object.keys(newVals));
            return {
                title: "Actualización Manual",
                desc: `Editó y guardó cambios en un ${tableName === 'Patients' ? 'Paciente' : 'Seguimiento'}.`,
                target: targetInfo,
                details: changedFields ? `Campos modificados: ${changedFields}` : "",
                color: "text-blue-600", bg: "bg-blue-100", icon: <Edit3 size={16} />
            };
        case 'BULK_UPDATE':
            return {
                title: "Gestión Masiva",
                desc: "Aplicó un cambio de estado o nota a múltiples pacientes a la vez.",
                details: newVals.status ? `Nuevo Estado: ${newVals.status}` : "Se agregó una observación masiva.",
                target: `Aplicado a ${String(recordId).split(',').length} pacientes`,
                color: "text-amber-600", bg: "bg-amber-100", icon: <Layers size={16} />
            };
        case 'UPDATE_CUPS':
            return {
                title: "Clasificación de CUPS",
                desc: "Asignó una nueva modalidad en el Maestro de Procedimientos.",
                details: `Nueva Categoría: ${newVals.category}`,
                color: "text-indigo-600", bg: "bg-indigo-100", icon: <FileText size={16} />
            };
        case 'DELETE':
            return {
                title: "Eliminación de Registro",
                desc: `Borró permanentemente un ${tableName === 'Patients' ? 'Paciente' : 'Registro'} del sistema.`,
                target: targetInfo,
                color: "text-red-600", bg: "bg-red-100", icon: <Trash2 size={16} />
            };
        case 'CLEAN_DUPLICATES':
            return {
                title: "Limpieza del Sistema",
                desc: "Ejecutó el motor de limpieza inteligente para eliminar registros duplicados.",
                color: "text-teal-600", bg: "bg-teal-100", icon: <RefreshCw size={16} />
            };
        default:
            return {
                title: "Acción del Sistema",
                desc: `Modificó el módulo de ${tableName}.`,
                target: targetInfo,
                color: "text-slate-600", bg: "bg-slate-100", icon: <User size={16} />
            };
    }
};

export default function AuditoriaPage() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  
  // --- ESTADOS DE FILTRADO Y BÚSQUEDA ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewAll, setViewAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({ total: 0, pacientes: 0, sin_eps: 0, sin_cups: 0, fechas_malas: 0 });
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchStats = async () => {
      try {
          const resStats = await api.get('/navegacion/audit/stats'); 
          if (resStats.data.success) {
              setStats(resStats.data.stats);
              setDuplicates(resStats.data.duplicates || []);
          }
      } catch (error: any) { console.error("❌ Error en STATS:", error.message); }
  };

  const fetchLogs = useCallback(async () => {
      try {
          const params = viewAll ? { all: 'true' } : { month: selectedMonth, year: selectedYear };
          const resLogs = await api.get('/navegacion/audit/logs', { params }); 
          if (resLogs.data.success) { setLogs(resLogs.data.data || []); }
      } catch (error: any) { console.error("❌ Error en LOGS:", error.message); }
  }, [selectedMonth, selectedYear, viewAll]);

  useEffect(() => {
      const init = async () => { await fetchStats(); await fetchLogs(); setLoading(false); };
      init();
  }, []);

  useEffect(() => { if (!loading) fetchLogs(); }, [selectedMonth, selectedYear, viewAll, fetchLogs, loading]);

  const handleExportExcel = () => {
    if (logs.length === 0) return alert("No hay datos para exportar");
    const dataToExport = filteredLogs.map(log => ({
        "FECHA": format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
        "USUARIO": log.user?.name || 'Sistema',
        "ACCION": log.action,
        "TABLA": log.tableName,
        "ID_REGISTRO": log.recordId
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");
    XLSX.writeFile(workbook, `Auditoria_${viewAll ? 'Total' : `${selectedMonth}_${selectedYear}`}.xlsx`);
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recordId.toString().includes(searchTerm) ||
    log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFixDates = async () => {
      if (window.confirm(`¿Corregir ${stats.fechas_malas} fechas invertidas?`)) {
          setFixing(true);
          try {
              const res = await api.post('/navegacion/audit/fix-dates');
              if (res.data.success) { alert(res.data.message); fetchStats(); }
          } catch (e) { alert('Error al corregir fechas.'); } finally { setFixing(false); }
      }
  };

  const handleMergeDuplicates = async () => {
      if (window.confirm("¿Deseas proceder con la fusión inteligente?")) {
          setFixing(true);
          try {
              const res = await api.post('/navegacion/audit/merge-duplicates');
              if (res.data.success) { alert(res.data.message); fetchStats(); }
          } catch (e) { alert('Error al fusionar.'); } finally { setFixing(false); }
      }
  };

  const handleCleanDuplicates = async () => {
      if (window.confirm("¿ELIMINAR permanentemente los duplicados viejos?")) {
          setFixing(true);
          try {
              const res = await api.delete('/navegacion/audit/clean-duplicates');
              if (res.data.success) { alert(res.data.message); fetchStats(); }
          } catch (e) { alert('Error al eliminar.'); } finally { setFixing(false); }
      }
  };

  const qualityChecks = [
      { label: 'Registros sin Código CUPS', count: stats.sin_cups, icon: Search },
      { label: 'Pacientes sin EPS Asignada', count: stats.sin_eps, icon: Database },
      { label: 'Incoherencia de Fechas', count: stats.fechas_malas, icon: AlertOctagon },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <Link href="/navegacion/admin" className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                    <ArrowLeft size={20}/>
                </Link>
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <Stethoscope size={24} strokeWidth={2.5}/>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Diagnóstico de Datos</h1>
            </div>
            <p className="text-slate-500 font-medium ml-14 text-sm">Auditoría técnica del módulo de navegación.</p>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Registros" value={stats.total.toLocaleString()} icon={Database} color="blue" />
          <StatCard label="Pacientes Únicos" value={stats.pacientes.toLocaleString()} icon={Users} color="indigo" />
          <StatCard label="Sin EPS Asignada" value={stats.sin_eps} icon={FileWarning} color="orange" isWarning={stats.sin_eps > 0} />
          
          {stats.fechas_malas > 0 ? (
              <div className="bg-amber-50 p-5 rounded-[1.5rem] shadow-sm border border-amber-200 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-600 shadow-inner"><AlertOctagon size={24} strokeWidth={2.5}/></div>
                      <div>
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Fechas Invertidas</p>
                          <p className="text-2xl font-black text-amber-800">{stats.fechas_malas}</p>
                      </div>
                  </div>
                  <button onClick={handleFixDates} disabled={fixing} className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm">
                      {fixing ? <Loader2 className="animate-spin" size={14}/> : <Wrench size={14}/>} Reparar Automáticamente
                  </button>
              </div>
          ) : (
              <StatCard label="Integridad Global" value="100%" icon={CheckCircle2} color="emerald" isWarning={false} />
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* TABLA DUPLICADOS */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden h-full flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Copy className="text-slate-400" size={20}/> Posibles Duplicados</h3>
                      {duplicates.length > 0 && (
                          <div className="flex items-center gap-2">
                              <button onClick={handleMergeDuplicates} disabled={fixing} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all">Fusionar</button>
                              <button onClick={handleCleanDuplicates} disabled={fixing} className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-rose-200 transition-all hidden sm:flex">Limpiar</button>
                          </div>
                      )}
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                              <tr><th className="p-5">Documento</th><th className="p-5">Paciente</th><th className="p-5">Fecha</th><th className="p-5 text-center">Cant.</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                              {duplicates.length === 0 ? (
                                  <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold">Base de datos limpia</td></tr>
                              ) : (
                                  duplicates.map((item: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="p-5 font-mono text-slate-500 font-bold text-xs">{item.cedula}</td>
                                          <td className="p-5 font-bold text-slate-700">{item.nombre}</td>
                                          <td className="p-5 text-slate-600 font-medium text-xs">{new Date(item.fecha).toLocaleDateString()}</td>
                                          <td className="p-5 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded bg-rose-100 text-rose-600 font-bold text-xs">{item.count}</span></td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
          
          {/* CALIDAD */}
          <div className="lg:col-span-1">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden h-full">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><ShieldAlert className="text-slate-400" size={20}/> Calidad de Datos</h3>
                  </div>
                  <div className="p-5 space-y-4">
                      {qualityChecks.map((check, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${check.count > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'}`}>
                              <div className="flex items-center gap-3">
                                  <div className={`p-2.5 rounded-xl ${check.count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}><check.icon size={18} strokeWidth={2.5}/></div>
                                  <span className={`text-xs font-bold ${check.count > 0 ? 'text-amber-900' : 'text-slate-600'}`}>{check.label}</span>
                              </div>
                              {check.count > 0 ? <span className="text-lg font-black text-amber-600">{check.count}</span> : <CheckCircle2 size={16} className="text-emerald-600" />}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* --- SECCIÓN: RASTRO DE ACTIVIDAD (MODERNIZADO E INTELIGENTE) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-8">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600"/> Rastro de Actividad
        </h2>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Buscar acción o ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <Calendar size={14} className="text-blue-500" />
                <select disabled={viewAll} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none cursor-pointer">
                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select disabled={viewAll} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none cursor-pointer">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <button onClick={() => setViewAll(!viewAll)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewAll ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {viewAll ? "TODO" : "MES"}
            </button>

            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-lg shadow-emerald-200">
                <Download size={14} /> EXCEL
            </button>
        </div>
      </div>
      
      {/* TIMELINE DE AUDITORÍA */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10">
          {filteredLogs.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                  <Activity size={40} className="text-slate-200" />
                  <p className="text-slate-400 font-medium">No se encontraron movimientos en este periodo.</p>
              </div>
          ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {filteredLogs.map((log: any, index: number) => {
                      const visual = getAuditVisuals(log); // 👈 Llama al nuevo traductor inteligente
                      const formattedDate = format(new Date(log.createdAt), "dd MMM", { locale: es });
                      const formattedTime = format(new Date(log.createdAt), "hh:mm a");

                      return (
                          <div key={log.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              
                              {/* Icono Central */}
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${visual.bg} ${visual.color} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110`}>
                                  {visual.icon}
                              </div>
                              
                              {/* Tarjeta de Información */}
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                                  
                                  {/* Encabezado: Título y Hora */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                      <h4 className={`font-bold text-sm ${visual.color}`}>{visual.title}</h4>
                                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm whitespace-nowrap">
                                          {formattedDate}, {formattedTime}
                                      </span>
                                  </div>
                                  
                                  {/* Descripción Principal */}
                                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{visual.desc}</p>
                                  
                                  {/* 🎯 EL TOQUE MÁGICO: Nombre, CC y campos cambiados */}
                                  {(visual.target || visual.details) && (
                                      <div className="mb-4 space-y-1.5">
                                          {visual.target && (
                                              <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-500 bg-white p-2 border border-slate-100 rounded-lg">
                                                  <User size={12} className="text-slate-400"/> 
                                                  {visual.target}
                                              </div>
                                          )}
                                          {visual.details && (
                                              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-700 bg-blue-50/50 p-2 border border-blue-100 rounded-lg">
                                                  <Info size={12} className="text-blue-500"/>
                                                  {visual.details}
                                              </div>
                                          )}
                                      </div>
                                  )}
                                  
                                  {/* Pie de Tarjeta: Usuario */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200/60 gap-3">
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-inner">
                                              {log.user?.name ? log.user.name.charAt(0) : 'S'}
                                          </div>
                                          <span className="text-[11px] font-bold text-slate-700">
                                              {log.user?.name || 'Sistema Automatizado'}
                                          </span>
                                      </div>
                                  </div>

                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, isWarning }: any) {
    const colors: any = { 
        blue: "bg-blue-50 text-blue-600", indigo: "bg-indigo-50 text-indigo-600", 
        orange: "bg-orange-50 text-orange-600", red: "bg-rose-50 text-rose-600", 
        emerald: "bg-emerald-50 text-emerald-600" 
    };
    const activeColor = colors[color] || colors.blue;
    return (
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
            <div className={`p-3.5 rounded-2xl ${activeColor} shadow-inner`}><Icon size={24} strokeWidth={2.5}/></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div>
        </div>
    );
}