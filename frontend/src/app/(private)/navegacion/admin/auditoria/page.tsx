"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Stethoscope, Users, FileWarning, 
  Database, CheckCircle2, AlertOctagon,
  ArrowLeft, Search, ShieldAlert,
  Copy, Loader2, Wrench, Trash2, 
  Calendar, ArrowRight, Download,
  FilterX
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from 'xlsx';

export default function AuditoriaPage() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  
  // --- ESTADOS DE FILTRADO Y BÚSQUEDA ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewAll, setViewAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
      total: 0,
      pacientes: 0,
      sin_eps: 0,
      sin_cups: 0,
      fechas_malas: 0
  });

  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // 1. CARGAR ESTADÍSTICAS
  const fetchStats = async () => {
      try {
          const resStats = await api.get('/navegacion/audit/stats'); 
          if (resStats.data.success) {
              setStats(resStats.data.stats);
              setDuplicates(resStats.data.duplicates || []);
          }
      } catch (error: any) {
          console.error("❌ Error en STATS:", error.message);
      }
  };

  // 2. CARGAR LOGS (Basado en filtros)
  const fetchLogs = useCallback(async () => {
      try {
          const params = viewAll 
            ? { all: 'true' } 
            : { month: selectedMonth, year: selectedYear };

          const resLogs = await api.get('/navegacion/audit/logs', { params }); 
          if (resLogs.data.success) {
              setLogs(resLogs.data.data || []);
          }
      } catch (error: any) {
          console.error("❌ Error en LOGS:", error.message);
      }
  }, [selectedMonth, selectedYear, viewAll]);

  useEffect(() => {
      const init = async () => {
          await fetchStats();
          await fetchLogs();
          setLoading(false);
      };
      init();
  }, []);

  useEffect(() => {
      if (!loading) fetchLogs();
  }, [selectedMonth, selectedYear, viewAll, fetchLogs, loading]);

  // --- EXPORTAR A EXCEL ---
  const handleExportExcel = () => {
    if (logs.length === 0) return alert("No hay datos para exportar");

    const dataToExport = filteredLogs.map(log => ({
        "FECHA": format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
        "USUARIO": log.user?.name || 'Sistema',
        "ROL": log.user?.role || 'N/A',
        "ACCION": log.action,
        "TABLA": log.tableName,
        "ID_REGISTRO": log.recordId
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");
    
    const fileName = `Auditoria_${viewAll ? 'Total' : `${selectedMonth}_${selectedYear}`}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // --- FILTRO LOCAL (Buscador rápido) ---
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recordId.toString().includes(searchTerm) ||
    log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACCIONES DE REPARACIÓN ---
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

  const getActionBadge = (action: string) => {
      const styles: any = {
          'CREATE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
          'UPDATE': 'bg-blue-100 text-blue-700 border-blue-200',
          'DELETE': 'bg-red-100 text-red-700 border-red-200',
          'IMPORT': 'bg-purple-100 text-purple-700 border-purple-200',
      };
      return styles[action] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

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

      {/* --- SECCIÓN: CAJA NEGRA --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-8">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShieldAlert className="text-emerald-500"/> Rastro de Actividad</h2>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador Local */}
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

            {/* Selectores Mes/Año */}
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
      
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                          <th className="p-5">Fecha y Hora</th><th className="p-5">Responsable</th><th className="p-5">Acción</th><th className="p-5">Módulo / ID</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredLogs.length === 0 ? (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">No se encontraron registros.</td></tr>
                      ) : (
                          filteredLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-5 text-slate-600 font-medium text-xs">
                                      {format(new Date(log.createdAt), "dd MMM, hh:mm a", { locale: es })}
                                  </td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">{log.user?.name?.charAt(0) || '?'}</div>
                                          <div><p className="font-bold text-slate-700 text-xs">{log.user?.name || 'Sistema'}</p></div>
                                      </div>
                                  </td>
                                  <td className="p-5"><span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${getActionBadge(log.action)}`}>{log.action}</span></td>
                                  <td className="p-5">
                                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                          <Database size={12} className="text-slate-400" /> {log.tableName} <ArrowRight size={12} className="text-slate-300" />
                                          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">ID: {log.recordId}</span>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
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