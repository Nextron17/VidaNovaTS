"use client";

import React, { useState, useEffect } from "react";
import { 
  Stethoscope, Users, FileWarning, 
  Database, CheckCircle2, AlertOctagon,
  ArrowLeft, Search, ShieldAlert,
  AlertTriangle, Copy, Loader2,
  Wrench, Trash2
} from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

export default function AuditoriaPage() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  
  const [stats, setStats] = useState({
      total: 0,
      pacientes: 0,
      sin_eps: 0,
      sin_cups: 0,
      fechas_malas: 0
  });

  const [duplicates, setDuplicates] = useState<any[]>([]);

  // Función para cargar datos
  const fetchData = async () => {
      try {
          const res = await api.get('/audit/stats'); 
          if (res.data.success) {
              setStats(res.data.stats);
              setDuplicates(res.data.duplicates || []);
          }
      } catch (error) {
          console.error("Error cargando auditoría:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // --- ACCIÓN: REPARAR FECHAS ---
  const handleFixDates = async () => {
      if (window.confirm(`¿Corregir ${stats.fechas_malas} fechas invertidas?`)) {
          setFixing(true);
          try {
              const res = await api.post('/audit/fix-dates');
              if (res.data.success) {
                  alert(res.data.message);
                  fetchData(); 
              }
          } catch (e) {
              alert('Error al corregir fechas.');
          } finally {
              setFixing(false);
          }
      }
  };

  // --- ACCIÓN: FUSIONAR DUPLICADOS ---
  const handleMergeDuplicates = async () => {
      const msg = "FUSIÓN INTELIGENTE:\n\n" +
                  "- Conserva el registro más reciente.\n" +
                  "- Copia datos faltantes de los antiguos.\n" +
                  "- Une observaciones.\n" +
                  "- Elimina los sobrantes.\n\n" +
                  "¿Deseas proceder?";
                  
      if (window.confirm(msg)) {
          setFixing(true);
          try {
              const res = await api.post('/audit/merge-duplicates');
              if (res.data.success) {
                  alert(res.data.message);
                  fetchData(); 
              }
          } catch (e) {
              alert('Error al fusionar duplicados.');
          } finally {
              setFixing(false);
          }
      }
  };

  // --- ACCIÓN: LIMPIAR (BORRADO DURO) ---
  const handleCleanDuplicates = async () => {
      if (window.confirm("¿Estás seguro de ELIMINAR permanentemente los duplicados viejos?")) {
          setFixing(true);
          try {
              const res = await api.delete('/audit/fix-duplicates');
              if (res.data.success) {
                  alert(res.data.message);
                  fetchData(); 
              }
          } catch (e) {
              alert('Error al eliminar duplicados.');
          } finally {
              setFixing(false);
          }
      }
  };

  const qualityChecks = [
      { label: 'Registros sin Código CUPS', count: stats.sin_cups, icon: Search },
      { label: 'Pacientes sin EPS Asignada', count: stats.sin_eps, icon: Database },
      { label: 'Incoherencia de Fechas', count: stats.fechas_malas, icon: AlertOctagon },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <Link href="/navegacion/admin" className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md"><ArrowLeft size={20}/></Link>
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20"><Stethoscope size={24} strokeWidth={2.5}/></div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Diagnóstico de Datos</h1>
            </div>
            <p className="text-slate-500 font-medium ml-14 text-sm">Auditoría y reparación técnica en tiempo real.</p>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Registros" value={stats.total.toLocaleString()} icon={Database} color="blue" />
          <StatCard label="Pacientes Únicos" value={stats.pacientes.toLocaleString()} icon={Users} color="indigo" />
          <StatCard label="Sin EPS Asignada" value={stats.sin_eps} icon={FileWarning} color="orange" isWarning={stats.sin_eps > 0} />
          
          {/* TARJETA INTELIGENTE DE FECHAS */}
          {stats.fechas_malas > 0 ? (
              <div className="bg-amber-50 p-5 rounded-[1.5rem] shadow-sm border border-amber-200 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-600 shadow-inner"><AlertOctagon size={24} strokeWidth={2.5}/></div>
                      <div>
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Fechas Invertidas</p>
                          <p className="text-2xl font-black text-amber-800">{stats.fechas_malas}</p>
                      </div>
                  </div>
                  <button 
                    onClick={handleFixDates} 
                    disabled={fixing}
                    className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                  >
                      {fixing ? <Loader2 className="animate-spin" size={14}/> : <Wrench size={14}/>}
                      Reparar Automáticamente
                  </button>
              </div>
          ) : (
              <StatCard label="Integridad Global" value="100%" icon={CheckCircle2} color="emerald" isWarning={false} />
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TABLA DUPLICADOS */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden h-full flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Copy className="text-slate-400" size={20}/> Posibles Duplicados</h3>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Registros idénticos (Paciente + Fecha + Procedimiento).</p>
                      </div>
                      
                      {duplicates.length > 0 && (
                          <div className="flex items-center gap-2">
                              {/* Botón Fusionar */}
                              <button 
                                onClick={handleMergeDuplicates}
                                disabled={fixing}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                              >
                                  {fixing ? <Loader2 className="animate-spin" size={12}/> : <Copy size={12}/>} 
                                  Fusionar
                              </button>
                              
                              {/* Botón Limpiar (Oculto en móvil para seguridad) */}
                              <button 
                                onClick={handleCleanDuplicates}
                                disabled={fixing}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 hidden sm:flex"
                              >
                                  <Trash2 size={12}/> Limpiar
                              </button>
                          </div>
                      )}
                  </div>
                  
                  <div className="overflow-x-auto flex-grow">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="p-5 w-32">Documento</th><th className="p-5">Paciente</th><th className="p-5 w-32">Fecha</th><th className="p-5 text-center w-24">Cant.</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                              {duplicates.length === 0 ? (
                                  <tr><td colSpan={4} className="p-10 text-center text-slate-400"><div className="flex flex-col items-center gap-2"><CheckCircle2 size={32} className="text-emerald-400"/><span className="font-bold text-emerald-600">Base de datos limpia</span></div></td></tr>
                              ) : (
                                  duplicates.map((item: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
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
          
          {/* LISTA DE CHEQUEO */}
          <div className="lg:col-span-1">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden h-full flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><ShieldAlert className="text-slate-400" size={20}/> Calidad de Datos</h3><p className="text-xs text-slate-500 mt-1 font-medium">Semáforo de integridad.</p></div>
                  <div className="p-5 space-y-4 flex-1">
                      {qualityChecks.map((check, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${check.count > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'}`}>
                              <div className="flex items-center gap-3"><div className={`p-2.5 rounded-xl ${check.count > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}><check.icon size={18} strokeWidth={2.5}/></div><span className={`text-xs font-bold ${check.count > 0 ? 'text-amber-900' : 'text-slate-600'}`}>{check.label}</span></div>
                              {check.count > 0 ? (<span className="text-lg font-black text-amber-600">{check.count}</span>) : (<div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full"><CheckCircle2 size={16} strokeWidth={3}/></div>)}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, isWarning }: any) {
    const colors: any = { blue: "bg-blue-50 text-blue-600", indigo: "bg-indigo-50 text-indigo-600", orange: "bg-orange-50 text-orange-600", red: "bg-rose-50 text-rose-600", emerald: "bg-emerald-50 text-emerald-600" };
    const activeColor = colors[color] || colors.blue;
    return (
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className={`p-3.5 rounded-2xl ${activeColor} shadow-inner`}><Icon size={24} strokeWidth={2.5}/></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div>
        </div>
    );
}