"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, Filter, HeartHandshake, X, ChartPie,
  MessageCircle, Layers, CheckCircle2,
  Loader2, FileSpreadsheet, ChevronLeft, ChevronRight, Edit,
  Calendar, AlertCircle, FileText, Syringe, Activity, Stethoscope, FlaskConical, Scissors, UserPlus
} from "lucide-react";

import api from "@/src/app/services/api";
import { useUser } from "@/src/app/context/UserContext";

// --- 1. CONSTANTES ---
const OPCIONES_ESTADO = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDIENTE", label: "🟠 Pendiente" },
  { value: "EN_GESTION", label: "🟡 En Gestión" },
  { value: "AGENDADO", label: "🔵 Agendado" },
  { value: "REALIZADO", label: "🟢 Realizado" },
  { value: "CANCELADO", label: "🔴 Cancelado" },
];

const OPCIONES_EPS = [
  "ASMET SALUD", "UNIVERSIDAD DEL CAUCA", "NUEVA EPS", "SANITAS", "SURA", "OTRA"
];

// 🔥 RESTAURADOS: AGRUPADORES CLÍNICOS
const MODALIDADES = [
  "Consulta Externa", "Quimioterapia", "Radioterapia", "Cirugía", 
  "Imagenología", "Laboratorio", "Clínica del Dolor", "Estancia", "Oncología"
];

const CAC_GROUPS = [
    "1= CAC Mama", "2= CAC Próstata", "3= CAC Cérvix", "4= CAC Colorectal", 
    "5= CAC Estómago", "6= CAC Melanoma", "7= CAC Pulmón", 
    "8= CAC Linfoma Hodgkin", "9= CAC Linfoma No Hodgkin", "10= CAC Leucemia"
];

// --- HELPER: ICONO POR MODALIDAD ---
const getIconByModality = (modality: string) => {
    const m = (modality || '').toUpperCase();
    if (m.includes('QUIMIO')) return <Syringe size={12}/>;
    if (m.includes('RADIO') || m.includes('IMAGEN')) return <Activity size={12}/>;
    if (m.includes('CONSULTA')) return <Stethoscope size={12}/>;
    if (m.includes('LAB')) return <FlaskConical size={12}/>;
    if (m.includes('CIRUGIA')) return <Scissors size={12}/>;
    return <FileText size={12}/>;
};

// --- HELPER: EXTRAER COHORTE ---
const extractCohort = (obs: string) => {
    if (!obs) return "General";
    const match = obs.match(/(?:COHORTE|DX SUGERIDO):\s*([^|]+)/i);
    const txt = match ? match[1].trim() : "General";
    return txt.replace("= CAC", "").replace("=", " "); 
};

// --- COMPONENTE WHATSAPP ---
const WhatsAppActions = ({ tel, nombre }: { tel: string, nombre: string }) => {
  const strTel = String(tel || "");
  if (!strTel || strTel.length < 5) return <span className="text-slate-300">-</span>;
  const numbers = strTel.split(/[\/\:\-\s]+/).map(n => n.replace(/\D/g, '')).filter(n => n.length >= 7);
  
  if (numbers.length === 0) return <span className="text-slate-300">-</span>;

  if (numbers.length === 1) {
    return (
      <a href={`https://wa.me/57${numbers[0]}?text=Hola ${nombre}, le escribo de Vidanova...`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors border border-emerald-200 shadow-sm" title={`Chat con ${numbers[0]}`}>
        <MessageCircle size={14} />
      </a>
    );
  }
  return (
    <div className="relative group inline-block">
      <button className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">
        <MessageCircle size={12} />
        <span className="text-[10px] font-bold">{numbers.length}</span>
      </button>
      <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-slate-100 shadow-xl rounded-lg p-1 hidden group-hover:block z-50">
        {numbers.map((num, idx) => (
          <a key={idx} href={`https://wa.me/57${num}`} target="_blank" className="block px-3 py-2 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors flex items-center gap-2">
            <MessageCircle size={12}/> {num}
          </a>
        ))}
      </div>
    </div>
  );
};

export default function AtencionDashboardPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pendientes: 0, realizados: 0, agendados: 0 });
  
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showMassModal, setShowMassModal] = useState(false);
  const [filtros, setFiltros] = useState({ 
    eps: "TODAS", 
    cohorte: [] as string[], // 🔥 AQUÍ SE GUARDAN LOS AGRUPADORES SELECCIONADOS
    fechaIni: "", 
    fechaFin: "", 
    estado: "TODOS" 
  });
  
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [tabEstado, setTabEstado] = useState<'PENDIENTE' | 'AGENDADO' | 'REALIZADO' | 'TODOS'>('PENDIENTE');
  const [massUpdateData, setMassUpdateData] = useState({ status: "", observation: "" });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const params: any = { page: page, limit: 10 };
        if (busqueda) params.search = busqueda;
        if (filtros.eps !== 'TODAS') params.eps = filtros.eps;
        if (filtros.fechaIni) params.startDate = filtros.fechaIni;
        if (filtros.fechaFin) params.endDate = filtros.fechaFin;
        
        // 🔥 ENVIAR AGRUPADORES AL BACKEND
        if (filtros.cohorte.length > 0) params.cohorte = filtros.cohorte.join(','); 
        
        if (tabEstado !== 'TODOS') params.status = tabEstado;
        else if (filtros.estado !== 'TODOS') params.status = filtros.estado;

        const res = await api.get('/patients', { params });
        const data = res.data;

        if (data.success) {
            const rawData = data.data || [];
            const mappedData = rawData.map((p: any) => {
                const f = p.followups?.[0] || {}; 
                const fechaSol = f.dateRequest ? new Date(f.dateRequest) : new Date();
                const hoy = new Date();
                const dias = Math.ceil(Math.abs(hoy.getTime() - fechaSol.getTime()) / (1000 * 60 * 60 * 24)); 

                return {
                    id: p.id,
                    paciente: `${p.firstName} ${p.lastName}`.trim(),
                    doc: p.documentNumber,
                    eps: p.insurance || "SIN EPS",
                    tel: p.phone,
                    modalidad: f.category || "PENDIENTE", 
                    cups: f.cups || "N/A",                
                    cohorte: extractCohort(f.observation), 
                    fecha_sol: f.dateRequest ? String(f.dateRequest).split('T')[0] : '',
                    fecha_cita: f.dateAppointment ? String(f.dateAppointment).split('T')[0] : null,
                    dias: dias,
                    meta: 15,
                    estado: f.status || "PENDIENTE",
                    obs: f.observation || ""
                };
            });

            setPatients(mappedData);
            setTotalPages(data.pagination?.totalPages || 1);
            setStats(data.stats || { total: 0, pendientes: 0, realizados: 0, agendados: 0 }); 
        }
    } catch (error: any) {
        console.error("❌ Error API:", error);
        setPatients([]);
    } finally {
        setLoading(false);
    }
  }, [page, busqueda, tabEstado, filtros]);
  
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMassUpdate = async () => {
    if (!massUpdateData.status && !massUpdateData.observation) return;
    try {
        const res = await api.put('/patients/bulk-update', {
            ids: seleccionados,
            status: massUpdateData.status,
            observation: massUpdateData.observation
        });
        
        if (res.data.success) {
            alert("✅ Gestión aplicada correctamente.");
            setShowMassModal(false);
            setSeleccionados([]);
            fetchData();
        }
    } catch (error) {
        alert("Error al procesar la solicitud.");
    }
  };

  const getRowStyle = (estado: string, dias: number, meta: number) => {
    if (estado === "REALIZADO") return "border-l-4 border-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20";
    if (estado === "CANCELADO") return "border-l-4 border-red-500 bg-red-50/10 opacity-70 hover:opacity-100";
    if (dias > meta) return "border-l-4 border-rose-500 bg-rose-50/10 hover:bg-rose-50/20";
    return "border-l-4 border-slate-200 hover:bg-slate-50";
  };

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
        case 'REALIZADO': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20';
        case 'AGENDADO': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20';
        case 'EN_GESTION': return 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20';
        case 'CANCELADO': return 'bg-red-100 text-red-700 ring-1 ring-red-600/20';
        default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20';
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const seleccionarTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSeleccionados(patients.map(c => c.id));
    else setSeleccionados([]);
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-800 pb-20">
      
      {/* 1. HEADER OPERATIVO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20 text-white animate-in zoom-in duration-300">
                <HeartHandshake size={28}/>
            </div>
            Tablero de Atención
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm md:text-base pl-1">
            Hola <span className="text-emerald-700 font-bold">{user?.name}</span>, gestiona tus casos de hoy.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link href="/navegacion/atencion/importar" className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-xl text-sm font-bold shadow-sm transition-all">
            <FileSpreadsheet size={18}/> 
            Importar
          </Link>
          <button onClick={fetchData} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition-all">
            <ChartPie size={18} className={loading ? 'animate-spin' : ''}/> Refrescar
          </button>
          <Link href="/navegacion/atencion/nuevo" className="group flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all">
            <UserPlus size={20} className="group-hover:scale-110 transition-transform"/> 
            Nuevo Paciente
          </Link>
        </div>
      </div>

      {/* 2. KPIs OPERATIVOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiItem title="MIS PENDIENTES" value={stats?.pendientes || 0} sub="Prioridad Alta" color="orange" icon={<AlertCircle size={24}/>} />
        <KpiItem title="AGENDADOS" value={stats?.agendados || 0} sub="Citas confirmadas" color="blue" icon={<Calendar size={24}/>} />
        <KpiItem title="GESTIONADOS" value={stats?.realizados || 0} sub="Finalizados con éxito" color="green" icon={<CheckCircle2 size={24}/>} />
        <KpiItem title="TOTAL CARGA" value={stats?.total || 0} sub="Registros en sistema" color="purple" icon={<Layers size={24}/>} />
      </div>

      {/* 3. FILTROS AVANZADOS (RESTAURADOS) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Búsqueda Global */}
          <div className="md:col-span-12 lg:col-span-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Búsqueda Rápida</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por cédula, nombre o servicio..." 
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Filtros Básicos */}
          <div className="md:col-span-6 lg:col-span-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Filtro Estado</label>
             <div className="relative">
                <select className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 appearance-none cursor-pointer" value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})}>
                    {OPCIONES_ESTADO.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
             </div>
          </div>
          
           <div className="md:col-span-6 lg:col-span-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Filtro EPS</label>
             <div className="relative">
                <select className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 appearance-none cursor-pointer" value={filtros.eps} onChange={(e) => setFiltros({...filtros, eps: e.target.value})}>
                    <option value="TODAS">Todas las EPS</option>
                    {OPCIONES_EPS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
             </div>
          </div>

          <div className="md:col-span-12 lg:col-span-4 flex justify-end gap-2">
            <button 
                onClick={() => {
                   setBusqueda(''); 
                   setFiltros({ eps: "TODAS", cohorte: [], fechaIni: "", fechaFin: "", estado: "TODOS" });
                   setPage(1);
                }} 
                className="px-4 py-2.5 rounded-xl text-slate-400 text-xs font-bold hover:text-red-500 transition-colors"
            >
                Limpiar
            </button>
            <button 
                onClick={fetchData} 
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
                <Filter size={16}/> Filtrar
            </button>
          </div>

          {/* 🔥 FILTRO POR AGRUPADORES (RESTAURADO) */}
          <div className="md:col-span-12">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block flex justify-between">
                <span>Filtrar por Especialidad / Cohorte</span>
             </label>
             <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px] items-center">
                {filtros.cohorte.map((c) => (
                    <span key={c} className="bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                      {c.replace('=', '').replace('CAC ', '')}
                      <button onClick={() => setFiltros({ ...filtros, cohorte: filtros.cohorte.filter(item => item !== c) })} className="hover:bg-emerald-500 rounded-full p-0.5 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                ))}
                
                <select 
                  className="flex-1 bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer min-w-[200px] py-1"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !filtros.cohorte.includes(val)) {
                      setFiltros({ ...filtros, cohorte: [...filtros.cohorte, val] });
                    }
                  }}
                >
                  <option value="" disabled>+ Agregar filtro de grupo...</option>
                  <optgroup label="--- MODALIDADES ---">
                      {MODALIDADES.map(opt => <option key={opt} value={opt} disabled={filtros.cohorte.includes(opt)}>{opt}</option>)}
                  </optgroup>
                  <optgroup label="--- DIAGNÓSTICOS (CAC) ---">
                      {CAC_GROUPS.map(opt => <option key={opt} value={opt} disabled={filtros.cohorte.includes(opt)}>{opt}</option>)}
                  </optgroup>
                </select>
             </div>
          </div>
        </div>
      </div>

      {/* 4. TABLA OPERATIVA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 pt-2 gap-4 overflow-x-auto bg-slate-50/30">
            <TabButton label="Pendientes" active={tabEstado === 'PENDIENTE'} onClick={() => setTabEstado('PENDIENTE')} count={stats.pendientes} color="orange" />
            <TabButton label="Agendados" active={tabEstado === 'AGENDADO'} onClick={() => setTabEstado('AGENDADO')} count={stats.agendados} color="blue" />
            <TabButton label="Historial" active={tabEstado === 'REALIZADO'} onClick={() => setTabEstado('REALIZADO')} count={stats.realizados} color="green" />
            <TabButton label="Todo" active={tabEstado === 'TODOS'} onClick={() => setTabEstado('TODOS')} count={stats.total} color="gray" />
        </div>

        <div className="overflow-x-auto min-h-[300px] relative">
            {loading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center flex-col gap-3">
                    <Loader2 className="animate-spin text-emerald-600" size={40} />
                    <span className="text-slate-500 text-xs font-bold animate-pulse">CARGANDO...</span>
                </div>
            )}

            {!loading && patients.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Search size={32} className="text-slate-300"/>
                    </div>
                    <p className="text-slate-500 font-medium">No se encontraron casos.</p>
                </div>
            )}

            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10 text-slate-500 text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-12 text-center"><input type="checkbox" onChange={seleccionarTodo} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"/></th>
                        <th className="px-4 py-4">PACIENTE</th>
                        <th className="px-4 py-4">SERVICIO</th>
                        <th className="px-4 py-4 text-center">ESTADO</th>
                        <th className="px-4 py-4 text-center">TIEMPO</th>
                        <th className="px-6 py-4 text-right">ACCIÓN</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {patients.map((row) => (
                        <tr key={row.id} className={`group transition-all duration-150 ${getRowStyle(row.estado, row.dias, row.meta)}`}>
                            <td className="px-6 py-4 text-center">
                                <input type="checkbox" checked={seleccionados.includes(row.id)} onChange={() => toggleSeleccion(row.id)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"/>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-bold text-slate-800 text-xs group-hover:text-emerald-700 transition-colors">{row.paciente}</div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">{row.doc}</span>
                                    <WhatsAppActions tel={row.tel} nombre={row.paciente} />
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex flex-col gap-1">
                                    <div className="font-black text-slate-700 text-[11px] uppercase tracking-tight flex items-center gap-1.5">
                                        {getIconByModality(row.modalidad)}
                                        {row.modalidad}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <span className="bg-slate-100 px-1.5 rounded text-slate-500 font-bold">CUPS</span> {row.cups}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase shadow-sm ${getBadgeStyle(row.estado)}`}>
                                    {row.estado.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <span className={`text-[11px] font-black px-2 py-0.5 rounded ${row.dias > row.meta ? 'text-rose-600 bg-rose-50 ring-1 ring-rose-100' : 'text-slate-600 bg-slate-100'}`}>
                                    {row.dias} días
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/navegacion/atencion/casos/${row.id}`} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all flex items-center gap-1">
                                        <Edit size={14}/> Gestionar
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* PAGINACIÓN */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Pág {page} de {totalPages}</span>
            <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"><ChevronLeft size={16}/></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>
      </div>

      {/* FAB MASIVO */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <button 
                onClick={() => setShowMassModal(true)}
                className="bg-slate-900 text-white pl-6 pr-8 py-4 rounded-full shadow-2xl flex items-center gap-4 hover:bg-black transition-all font-bold group border border-slate-700/50"
            >
                <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                    {seleccionados.length}
                </div>
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acción Rápida</span>
                    <span className="text-sm">Cerrar Casos Seleccionados</span>
                </div>
                <Layers size={20} className="text-slate-400 group-hover:text-white transition-colors"/>
            </button>
        </div>
      )}

      {/* MODAL GESTIÓN MASIVA */}
      {showMassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-100">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Layers size={20} className="text-emerald-600"/> Gestión Múltiple</h3>
                    <button onClick={() => setShowMassModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Cambiar Estado</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer" onChange={(e) => setMassUpdateData({...massUpdateData, status: e.target.value})}>
                                <option value="">-- Mantener estado actual --</option>
                                <option value="EN_GESTION">🟡 En Gestión</option>
                                <option value="AGENDADO">🔵 Agendado</option>
                                <option value="REALIZADO">🟢 Realizado (Cerrar)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Nota de Bitácora</label>
                            <textarea rows={3} placeholder="Escribe una observación para todos..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" onChange={(e) => setMassUpdateData({...massUpdateData, observation: e.target.value})}></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-50">
                        <button onClick={() => setShowMassModal(false)} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button onClick={handleMassUpdate} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all transform active:scale-95">
                            <CheckCircle2 size={18}/> Aplicar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function KpiItem({ title, value, sub, color, icon }: any) {
    const colorStyles: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-amber-50 text-amber-600",
        purple: "bg-purple-50 text-purple-600"
    };

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorStyles[color]} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>
        </div>
    );
}

function TabButton({ label, active, onClick, color, count }: any) {
    const activeClass = ({ 
        orange: "text-amber-600 border-amber-500 bg-amber-50/50", 
        blue: "text-blue-600 border-blue-500 bg-blue-50/50", 
        green: "text-emerald-600 border-emerald-500 bg-emerald-50/50", 
        gray: "text-slate-800 border-slate-800 bg-slate-50" 
    } as Record<string, string>)[color] || "";

    const badgeColor = ({
        orange: "bg-amber-100 text-amber-700",
        blue: "bg-blue-100 text-blue-700",
        green: "bg-emerald-100 text-emerald-700",
        gray: "bg-slate-200 text-slate-700"
    } as Record<string, string>)[color] || "bg-slate-100";

    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold border-b-2 transition-all uppercase tracking-wide whitespace-nowrap ${active ? activeClass : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
            {label}
            {count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? badgeColor : 'bg-slate-100 text-slate-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// Icono faltante
function FolderOpenIcon({ size, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>
    )
}