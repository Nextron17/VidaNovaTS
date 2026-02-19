"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, Filter, Activity, X, ChartPie,
  MessageCircle, Layers, Info, CheckCircle2,
  Loader2, FileSpreadsheet, ChevronLeft, ChevronRight, Eye, Edit,
  Calendar, Clock4, AlertCircle, FileText, Syringe, Stethoscope, FlaskConical, Scissors
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';

import api from "@/src/app/services/api";

// --- 1. CONSTANTES DE ESTADO ---
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

const MODALIDADES = [
  "Consulta Externa", "Quimioterapia", "Radioterapia", "Cirugía", 
  "Imagenología", "Laboratorio", "Clínica del Dolor", "Estancia", "Oncología"
];

const CAC_GROUPS = [
    "1= CAC Mama", "2= CAC Próstata", "3= CAC Cérvix", "4= CAC Colorectal", 
    "5= CAC Estómago", "6= CAC Melanoma", "7= CAC Pulmón", 
    "8= CAC Linfoma Hodgkin", "9= CAC Linfoma No Hodgkin", "10= CAC Leucemia"
];

// Colores Operativos: Azul, Celeste, Esmeralda, Ámbar
const COLORS_OPERATIVOS = ['#3b82f6', '#0ea5e9', '#10b981', '#f59e0b']; 

// --- HELPERS ---
const getIconByModality = (modality: string) => {
    const m = (modality || '').toUpperCase();
    if (m.includes('QUIMIO')) return <Syringe size={12}/>;
    if (m.includes('RADIO') || m.includes('IMAGEN')) return <Activity size={12}/>;
    if (m.includes('CONSULTA')) return <Stethoscope size={12}/>;
    if (m.includes('LAB')) return <FlaskConical size={12}/>;
    if (m.includes('CIRUGIA')) return <Scissors size={12}/>;
    return <FileText size={12}/>;
};

const extractCohort = (obs: string) => {
    if (!obs) return "General";
    const match = obs.match(/(?:COHORTE|DX SUGERIDO):\s*([^|]+)/i);
    const txt = match ? match[1].trim() : "General";
    return txt.replace("= CAC", "").replace("=", " "); 
};

const WhatsAppActions = ({ tel }: { tel: string, nombre: string }) => {
  const strTel = String(tel || "");
  if (!strTel || strTel.length < 5) return <span className="text-slate-300">-</span>;
  const numbers = strTel.split(/[\/\:\-\s]+/).map(n => n.replace(/\D/g, '')).filter(n => n.length >= 7);
  if (numbers.length === 0) return <span className="text-slate-300">-</span>;

  return (
    <div className="relative group inline-block">
      <a href={`https://wa.me/57${numbers[0]}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors border border-emerald-200 shadow-sm">
        <MessageCircle size={14} />
      </a>
    </div>
  );
};

export default function AtencionDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pendientes: 0, realizados: 0, agendados: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showMassModal, setShowMassModal] = useState(false);
  const [filtros, setFiltros] = useState({ 
    eps: "TODAS", 
    cohorte: [] as string[], 
    fechaIni: "", 
    fechaFin: "", 
    estado: "TODOS" 
  });
  
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [tabEstado, setTabEstado] = useState<'PENDIENTE' | 'AGENDADO' | 'REALIZADO' | 'TODOS'>('PENDIENTE');
  const [massUpdateData, setMassUpdateData] = useState({ status: "", observation: "" });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const seleccionarTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSeleccionados(patients.map(c => c.id));
    else setSeleccionados([]);
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const params: any = { page: page, limit: 10 };
        if (busqueda) params.search = busqueda;
        if (filtros.eps !== 'TODAS') params.eps = filtros.eps;
        if (filtros.fechaIni) params.startDate = filtros.fechaIni;
        if (filtros.fechaFin) params.endDate = filtros.fechaFin;
        if (filtros.cohorte.length > 0) params.cohorte = filtros.cohorte.join(','); 
        if (tabEstado !== 'TODOS') params.status = tabEstado;
        else if (filtros.estado !== 'TODOS') params.status = filtros.estado;

        const res = await api.get('/patients', { params });
        if (res.data.success) {
            const mappedData = (res.data.data || []).map((p: any) => {
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
            setTotalPages(res.data.pagination?.totalPages || 1);
            setStats(res.data.stats || { total: 0, pendientes: 0, realizados: 0, agendados: 0 });
            if (res.data.stats?.topProcedures) setChartData(res.data.stats.topProcedures);
        }
    } catch (error: any) {
        console.error("Error fetching data");
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
            setShowMassModal(false);
            setSeleccionados([]);
            fetchData();
        }
    } catch (error) { alert("Error en gestión masiva."); }
  };

  const getRowStyle = (estado: string, dias: number, meta: number) => {
    if (estado === "REALIZADO") return "border-l-4 border-emerald-500 bg-emerald-50/5 hover:bg-emerald-50/10";
    if (estado === "CANCELADO") return "border-l-4 border-rose-300 opacity-60";
    if (dias > meta) return "border-l-4 border-rose-500 bg-rose-50/10 hover:bg-rose-50/20";
    return "border-l-4 border-slate-200 hover:bg-slate-50";
  };

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
        case 'REALIZADO': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20';
        case 'AGENDADO': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20';
        case 'EN_GESTION': return 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20';
        case 'CANCELADO': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20';
        default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20';
    }
  };

  const DATA_ESTADOS = [
    { name: 'Pendiente', value: Number(stats?.pendientes || 0) },
    { name: 'Agendado', value: Number(stats?.agendados || 0) },
    { name: 'Realizado', value: Number(stats?.realizados || 0) },
  ];

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-24 font-sans text-slate-800 p-6 md:p-8">
      
      {/* 1. HEADER (Atención Azul) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
                <Activity size={28}/>
            </div>
            Panel de Atención
          </h1>
          <p className="text-slate-500 font-medium mt-2">Seguimiento operativo de <span className="text-blue-600 font-extrabold">{stats.total || 0}</span> pacientes en navegación.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/navegacion/atencion/pacientes" className="group flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl text-sm font-bold transition-all shadow-sm">
            <Layers size={18} className="text-blue-500"/> Directorio
          </Link>
          <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl text-sm font-bold shadow-lg transition-all">
            <ChartPie size={18} className={loading ? 'animate-spin' : ''}/> Sincronizar
          </button>
        </div>
      </div>

      {/* 2. FILTROS */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-12 lg:col-span-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Búsqueda Rápida</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input type="text" placeholder="Buscar por nombre, cédula o CUPS..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="📅 Desde" type="date" value={filtros.fechaIni} onChange={(e:any) => setFiltros({...filtros, fechaIni: e.target.value})} />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="📅 Hasta" type="date" value={filtros.fechaFin} onChange={(e:any) => setFiltros({...filtros, fechaFin: e.target.value})} />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="Estado Actual" options={OPCIONES_ESTADO} value={filtros.estado} onChange={(e:any) => setFiltros({...filtros, estado: e.target.value})} />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="Aseguradora" options={OPCIONES_EPS} value={filtros.eps} onChange={(e:any) => setFiltros({...filtros, eps: e.target.value})} />
          </div>

          <div className="md:col-span-12 lg:col-span-12 flex justify-end">
            <button type="button" onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl text-sm font-black shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
              <Filter size={18}/> Filtrar Resultados
            </button>
          </div>
        </div>
      </div>

      {/* 3. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiItem title="EN NAVEGACIÓN" value={stats?.total || 0} sub="Pacientes asignados" color="blue" icon={<Layers size={22}/>} />
        <KpiItem title="GESTIÓN EXITOSA" value={stats?.realizados || 0} sub="Procedimientos realizados" color="green" icon={<CheckCircle2 size={22}/>} />
        <KpiItem title="PENDIENTES" value={stats?.pendientes || 0} sub="Requieren atención" color="orange" icon={<AlertCircle size={22}/>} />
        <KpiItem title="CITAS" value={stats?.agendados || 0} sub="Próximos agendamientos" color="purple" icon={<Calendar size={22}/>} />
      </div>

      {/* 4. GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Estado de la Población
            </h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie data={DATA_ESTADOS} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                            {DATA_ESTADOS.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_OPERATIVOS[index]} stroke="none" />))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '11px', fontWeight: 'bold'}}/>
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Carga por Modalidad
            </h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        <XAxis dataKey="name" tick={{fontSize: 10, fill:'#94a3b8', fontWeight:700}} axisLine={false} tickLine={false} dy={10} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="cantidad" fill="#10b981" radius={[4, 4, 4, 4]} barSize={35} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* 5. TABLA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 pt-4 gap-6 overflow-x-auto bg-slate-50/30">
            <TabButton label="Prioridad Pendiente" active={tabEstado === 'PENDIENTE'} onClick={() => setTabEstado('PENDIENTE')} count={stats.pendientes} color="orange" />
            <TabButton label="Agendados" active={tabEstado === 'AGENDADO'} onClick={() => setTabEstado('AGENDADO')} count={stats.agendados} color="blue" />
            <TabButton label="Realizados" active={tabEstado === 'REALIZADO'} onClick={() => setTabEstado('REALIZADO')} count={stats.realizados} color="green" />
            <TabButton label="Ver Todos" active={tabEstado === 'TODOS'} onClick={() => setTabEstado('TODOS')} count={stats.total} color="gray" />
        </div>

        <div className="overflow-x-auto min-h-[350px] relative">
            {loading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center flex-col gap-3 backdrop-blur-[2px]">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <span className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Actualizando Datos...</span>
                </div>
            )}

            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-12 text-center"><input type="checkbox" onChange={seleccionarTodo} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/></th>
                        <th className="px-4 py-4">Paciente / Documento</th>
                        <th className="px-4 py-4">Trámite y Cohorte</th>
                        <th className="px-4 py-4 text-center">Solicitud</th>
                        <th className="px-4 py-4 text-center">Estado</th>
                        <th className="px-4 py-4 text-center">Días</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {patients.map((row) => (
                        <tr key={row.id} className={`group transition-all duration-150 ${getRowStyle(row.estado, row.dias, row.meta)}`}>
                            <td className="px-6 py-4 text-center">
                                <input type="checkbox" checked={seleccionados.includes(row.id)} onChange={() => toggleSeleccion(row.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors uppercase">{row.paciente}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{row.doc}</span>
                                    <WhatsAppActions tel={row.tel} nombre={row.paciente} />
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-tight flex items-center gap-1.5">
                                        {getIconByModality(row.modalidad)} {row.modalidad}
                                    </div>
                                    <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md w-fit">{row.cohorte}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                    {row.fecha_sol && <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{row.fecha_sol}</div>}
                                    <span className="text-[9px] text-slate-400 font-mono italic">{row.fecha_cita ? `Cita: ${row.fecha_cita}` : 'Sin agenda'}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${getBadgeStyle(row.estado)}`}>
                                    {row.estado.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded ${row.dias > row.meta ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100'}`}>{row.dias} d</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/navegacion/atencion/pacientes/perfil?id=${row.id}`} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"><Eye size={16}/></Link>
                                    <Link href={`/navegacion/atencion/gestion?id=${row.id}`} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"><Edit size={16}/></Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* PAGINACIÓN */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-400">
            <span>REGISTROS {patients.length} | PÁGINA {page} DE {totalPages}</span>
            <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-all"><ChevronLeft size={16}/></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-all"><ChevronRight size={16}/></button>
            </div>
        </div>
      </div>

      {/* FAB MASIVO OPERATIVO */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setShowMassModal(true)} className="bg-slate-900 text-white pl-6 pr-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:bg-blue-700 transition-all font-bold border border-white/10 group">
                <div className="bg-emerald-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">{seleccionados.length}</div>
                <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">Gestión de Grupo</span>
                    <span className="text-sm">Actualizar Seleccionados</span>
                </div>
                <Layers size={20} className="text-slate-400 group-hover:text-white ml-2"/>
            </button>
        </div>
      )}

      {/* MODAL GESTIÓN MASIVA ATENCIÓN */}
      {showMassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                    <h3 className="font-black text-lg flex items-center gap-2 tracking-tight uppercase"><Layers size={20}/> Actualización Operativa</h3>
                    <button onClick={() => setShowMassModal(false)} className="text-blue-200 hover:text-white transition-colors"><X size={24}/></button>
                </div>
                <div className="p-8">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex items-start gap-4">
                        <Info size={20} className="text-blue-600 mt-0.5 shrink-0"/>
                        <span className="text-blue-900 text-sm font-bold leading-tight">Vas a registrar un avance en la navegación de {seleccionados.length} expedientes. Esta acción quedará firmada con tu usuario.</span>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nuevo Estado de Atención</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" onChange={(e) => setMassUpdateData({...massUpdateData, status: e.target.value})}>
                                <option value="">-- Sin cambios de estado --</option>
                                <option value="EN_GESTION">🟡 Iniciar Gestión</option>
                                <option value="AGENDADO">🔵 Citar Pacientes</option>
                                <option value="REALIZADO">🟢 Confirmar Realización</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nota de Evolución</label>
                            <textarea rows={4} placeholder="Describe el avance realizado para este grupo de pacientes..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium resize-none outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" onChange={(e) => setMassUpdateData({...massUpdateData, observation: e.target.value})}></textarea>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-10">
                        <button onClick={() => setShowMassModal(false)} className="flex-1 py-4 rounded-2xl text-slate-500 font-black hover:bg-slate-50 transition-colors uppercase text-xs">Cancelar</button>
                        <button onClick={handleMassUpdate} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest">
                            <CheckCircle2 size={18}/> Guardar Cambios
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
function FilterSelect({ label, options, type = "text", value, onChange }: any) {
    return (
        <div className="w-full">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block pl-1">{label}</label>
            {type === 'date' ? (
                <input type="date" className="w-full py-3 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" value={value} onChange={onChange}/>
            ) : (
                <div className="relative">
                    <select className="w-full py-3 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none appearance-none cursor-pointer" value={value} onChange={onChange}>
                        <option value="TODAS">Todos</option>
                        {options?.map((opt: any, idx: number) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const lbl = typeof opt === 'object' ? opt.label : opt;
                            return <option key={idx} value={val}>{lbl}</option>;
                        })}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronRight size={14} className="rotate-90"/></div>
                </div>
            )}
        </div>
    );
}

function KpiItem({ title, value, sub, color, icon }: any) {
    const colorStyles: any = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", orange: "bg-amber-50 text-amber-600", purple: "bg-indigo-50 text-indigo-600" };
    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
            <div className={`p-3 rounded-xl ${colorStyles[color]} w-fit mb-5 shadow-inner`}>{icon}</div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{value}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{title}</p>
            <p className="text-xs text-slate-500 mt-4 font-bold">{sub}</p>
        </div>
    );
}

function TabButton({ label, active, onClick, color, count }: any) {
    const activeClass = ({ orange: "text-amber-600 border-amber-500 bg-amber-50/30", blue: "text-blue-600 border-blue-500 bg-blue-50/30", green: "text-emerald-600 border-emerald-500 bg-emerald-50/30", gray: "text-slate-800 border-slate-800 bg-slate-100" } as any)[color];
    const badgeColor = ({ orange: "bg-amber-100 text-amber-700", blue: "bg-blue-100 text-blue-700", green: "bg-emerald-100 text-emerald-700", gray: "bg-slate-200 text-slate-700" } as any)[color];
    return (
        <button onClick={onClick} className={`flex items-center gap-3 px-6 py-4 text-[11px] font-black border-b-2 transition-all uppercase tracking-[0.1em] whitespace-nowrap ${active ? activeClass : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            {label} {count !== undefined && <span className={`px-2 py-0.5 rounded text-[10px] font-black ${active ? badgeColor : 'bg-slate-100 text-slate-400'}`}>{count}</span>}
        </button>
    );
}