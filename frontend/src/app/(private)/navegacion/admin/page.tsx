"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, Filter, ShieldAlert, X, ChartPie,
  MessageCircle, Layers, Info, CheckCircle2,
  Loader2, WifiOff, FileSpreadsheet, ChevronLeft, ChevronRight, Eye, Edit,
  Calendar, Clock4, AlertCircle, FileText, Syringe, Activity, Stethoscope, FlaskConical, Scissors, Plus, Ban
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';

import api from "@/src/app/services/api";
import { getFechaLocal } from "@/src/app/core/utils/dateUtils"; 

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

// --- 2. MODALIDADES (Servicios) ---
const MODALIDADES = [
  "Consulta Externa", 
  "Quimioterapia", 
  "Radioterapia", 
  "Cirugía", 
  "Imagenología", 
  "Laboratorio", 
  "Clínica del Dolor", 
  "Estancia", 
  "Oncología"
];

// --- 3. GRUPOS CAC (Diagnósticos) ---
const CAC_GROUPS = [
    "1= CAC Mama",
    "2= CAC Próstata",
    "3= CAC Cérvix",
    "4= CAC Colorectal",
    "5= CAC Estómago",
    "6= CAC Melanoma",
    "7= CAC Pulmón",
    "8= CAC Linfoma Hodgkin",
    "9= CAC Linfoma No Hodgkin",
    "10= CAC Leucemia Linfocítica Aguda",
    "11= CAC Leucemia Mielocítica Aguda",
    "12= Labio, cavidad bucal y faringe",
    "13= Otros órganos digestivos",
    "14= Otros órganos respiratorios",
    "15= Huesos y cartílagos articulares",
    "16= Otros tumores de la piel",
    "17= Tejidos mesoteliales y blandos",
    "18= Otros órganos genitales femeninos",
    "19= Otros órganos genitales masculinos",
    "20= Vías urinarias",
    "21= Ojo, encéfalo y sistema nervioso central",
    "22= Glándulas tiroides y endocrinas",
    "23= Sitios mal definidos / No especificados",
    "24= Otros tumores tejido linfático/hematopoyético",
    "25= Tumores secundarios"
];

// 🚀 FIX: AÑADIDOS LOS 5 COLORES PARA QUE LA GRÁFICA NO COLAPSE
const COLORS_ESTADOS = [
    '#f97316', // Naranja (Pendiente)
    '#eab308', // Amarillo (En Gestión)
    '#3b82f6', // Azul (Agendado)
    '#10b981', // Verde (Realizado)
    '#ef4444'  // Rojo (Cancelado)
]; 

// --- HELPER CORREGIDO: EXTRAER COHORTE ---
const extractCohort = (obs: string) => {
    if (!obs || typeof obs !== 'string') return "Sin Cohorte";
    const match = obs.match(/(?:COHORTE|DX SUGERIDO|CAC):\s*([^|]+)/i);
    if (match) return match[1].trim().replace("= CAC", "").replace("=", " "); 
    if (obs.length > 3) return obs.substring(0, 20) + (obs.length > 20 ? "..." : "");
    return "Sin Cohorte";
};

// --- COMPONENTE WHATSAPP ---
const WhatsAppActions = ({ tel, nombre }: { tel: string, nombre: string }) => {
  const strTel = String(tel || "");
  if (!strTel || strTel.length < 5) return <span className="text-slate-300">-</span>;
  const numbers = strTel.split(/[\/\:\-\s]+/).map(n => n.replace(/\D/g, '')).filter(n => n.length >= 7);
  if (numbers.length === 0) return <span className="text-slate-300">-</span>;

  if (numbers.length === 1) {
    return (
      <a href={`https://wa.me/57${numbers[0]}?text=Hola ${nombre}, nos comunicamos de Vidanova...`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors border border-green-200 shadow-sm" title={`Chat con ${numbers[0]}`}>
        <MessageCircle size={14} />
      </a>
    );
  }
  return (
    <div className="relative group inline-block">
      <button className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors border border-green-200 shadow-sm">
        <MessageCircle size={12} />
        <span className="text-[10px] font-bold">{numbers.length}</span>
      </button>
      <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-slate-100 shadow-xl rounded-lg p-1 hidden group-hover:block z-50">
        {numbers.map((num, idx) => (
          <a key={idx} href={`https://wa.me/57${num}`} target="_blank" className="block px-3 py-2 text-xs text-slate-600 hover:bg-green-50 hover:text-green-700 rounded transition-colors flex items-center gap-2">
            <MessageCircle size={12}/> {num}
          </a>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  
  const [stats, setStats] = useState<any>({ total: 0, pendientes: 0, en_gestion: 0, agendados: 0, realizados: 0, cancelados: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [barrerasData, setBarrerasData] = useState<any[]>([]);
  
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showMassModal, setShowMassModal] = useState(false);
  const [filtros, setFiltros] = useState({ eps: "TODAS", cohorte: [] as string[], fechaIni: "", fechaFin: "", estado: "TODOS" });
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  
  const [tabEstado, setTabEstado] = useState<'PENDIENTE' | 'EN_GESTION' | 'AGENDADO' | 'REALIZADO' | 'CANCELADO' | 'TODOS'>('PENDIENTE');
  const [massUpdateData, setMassUpdateData] = useState({ status: "", observation: "" });

  const [isClient, setIsClient] = useState(false);

  // 🚀 ESTADO Y FUNCIÓN DE LA MINI PANTALLA (TOAST)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ show: true, message: msg, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500); 
  };

  useEffect(() => { setIsClient(true); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
        const params: any = { page: page, limit: 10 };
        if (busqueda) params.search = busqueda;
        if (filtros.eps !== 'TODAS') params.eps = filtros.eps;
        if (filtros.fechaIni) params.startDate = filtros.fechaIni;
        if (filtros.fechaFin) params.endDate = filtros.fechaFin;
        if (filtros.cohorte.length > 0) params.cohorte = filtros.cohorte.join(','); 
        if (tabEstado !== 'TODOS') params.status = tabEstado;
        else if (filtros.estado !== 'TODOS') params.status = filtros.estado;

        const [resData, resStats] = await Promise.all([
            api.get('/navegacion/patients', { params }),
            api.get('/navegacion/patients', { params: { ...params, onlyStats: 'true' } }) 
        ]);

        const data = resData.data;
        const statsData = resStats.data;

        if (data.success) {
            const rawData = data.data || [];
            const mappedData = rawData.map((p: any) => {
                const f = (p.followups && p.followups.length > 0) ? p.followups[0] : {}; 
                const fechaSolStr = f.dateRequest || p.createdAt || getFechaLocal();
                const fechaSol = new Date(fechaSolStr);
                const hoy = new Date();
                const dias = Math.ceil(Math.abs(hoy.getTime() - fechaSol.getTime()) / (1000 * 60 * 60 * 24)); 

                return {
                    id: p.id,
                    patientId: p.id,
                    followUpId: f.id,
                    paciente: `${p.firstName || ''} ${p.lastName || ''}`.trim() || "PACIENTE SIN NOMBRE",
                    doc: p.documentNumber || "S.N",
                    eps: p.insurance || "SIN EPS",
                    tel: p.phone || "---",
                    modalidad: f.category || "PENDIENTE", 
                    cups: f.cups || "N/A",                
                    cohorte: extractCohort(f.observation), 
                    fecha_sol: f.dateRequest ? String(f.dateRequest).split('T')[0] : '---',
                    fecha_cita: f.dateAppointment ? String(f.dateAppointment).split('T')[0] : '---',
                    dias: isNaN(dias) ? 0 : dias,
                    meta: 15,
                    estado: f.status || "PENDIENTE",
                    obs: f.observation || ""
                };
            });

            setPatients(mappedData);
            setTotalPages(data.pagination?.totalPages || 1);
        }

        if (statsData.success && statsData.stats) {
            setStats({
                total: statsData.stats.total || 0,
                pendientes: statsData.stats.pendientes || 0,
                en_gestion: statsData.stats.en_gestion || statsData.stats.enGestion || 0, 
                agendados: statsData.stats.agendados || 0,
                realizados: statsData.stats.realizados || 0,
                cancelados: statsData.stats.cancelados || 0 
            });
            
            if (statsData.stats.topProcedures) {
                const safeStats = statsData.stats.topProcedures.map((item: any) => ({
                    name: item.name || 'SIN DEFINIR',
                    cantidad: Number(item.cantidad || item.count || item.value || 0)
                }));
                const validStats = safeStats.filter((item: any) => {
                    const nombreBD = String(item.name).toUpperCase();
                    return MODALIDADES.some(m => nombreBD.includes(m.toUpperCase()));
                });
                setChartData(validStats.length > 0 ? validStats : safeStats);
            }
            if (statsData.stats.topBarreras) setBarrerasData(statsData.stats.topBarreras);
        }

    } catch (error: any) {
        setErrorMsg(error.response?.status === 401 ? "Sesión expirada." : "Error al conectar con el servidor.");
        setPatients([]);
    } finally {
        setLoading(false);
    }
  }, [page, busqueda, tabEstado, filtros]);
  
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFixCategories = async () => {
    if(!confirm("¿Deseas normalizar la base de datos a las 9 Modalidades Oficiales?")) return;
    setLoading(true);
    try {
        const res = await api.post('/navegacion/patients/fix-categories');
        showToast(res.data.message || "Base de datos normalizada con éxito.", "success"); // 🚀 TOAST AQUÍ
        fetchData();
    } catch (error) {
        showToast("Error ejecutando la reparación.", "error"); // 🚀 TOAST AQUÍ
    } finally {
        setLoading(false);
    }
  };

  const handleMassUpdate = async () => {
    if (!massUpdateData.status && !massUpdateData.observation) return;
    try {
        const res = await api.put('/navegacion/patients/bulk-update', {
            ids: seleccionados,
            status: massUpdateData.status,
            observation: massUpdateData.observation
        });
        
        if (res.data.success) {
            showToast("¡Realizado! Registros actualizados correctamente.", "success"); // 🚀 TOAST AQUÍ
            setShowMassModal(false);
            setSeleccionados([]);
            fetchData();
        }
    } catch (error) {
        showToast("Error de conexión o permisos.", "error"); // 🚀 TOAST AQUÍ
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const seleccionarTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSeleccionados(patients.map(c => c.id));
    else setSeleccionados([]);
  };

  const DATA_ESTADOS = [
    { name: 'Pendiente', value: Number(stats?.pendientes || 0) },
    { name: 'En Gestión', value: Number(stats?.en_gestion || 0) },
    { name: 'Agendado', value: Number(stats?.agendados || 0) },
    { name: 'Realizado', value: Number(stats?.realizados || 0) },
    { name: 'Cancelado', value: Number(stats?.cancelados || 0) }
  ];

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800 p-6 md:p-8 relative">
      
      {/* 🚀 TOAST NOTIFICATION (MINI PANTALLA FLOTANTE) */}
      <div className={`fixed top-8 right-8 z-[9999] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 
              toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 
              'bg-blue-600 border-blue-500 text-white'
          }`}>
              {toast.type === 'success' && <CheckCircle2 size={24} />}
              {toast.type === 'error' && <X size={24} />}
              {toast.type === 'info' && <Info size={24} />}
              <p className="font-bold text-sm tracking-wide">{toast.message}</p>
          </div>
      </div>
      {/* FIN DEL TOAST */}

      {/* 1. HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
                <ShieldAlert size={28}/>
            </div>
            Torre de Control
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm md:text-base pl-1">
            Gestión integral de <span className="text-slate-900 font-bold">{stats.total || 0}</span> pacientes oncológicos.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link href="/navegacion/admin/importar" className="group flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl text-sm font-bold shadow-sm transition-all">
            <FileSpreadsheet size={18} className="text-green-600 group-hover:scale-110 transition-transform"/> 
            Importar Excel
          </Link>
          <button onClick={handleFixCategories} className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-xl text-sm font-bold shadow-sm transition-all">
            <CheckCircle2 size={18}/> Normalizar DB
          </button>
          <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:shadow-blue-600/30 transition-all">
            <ChartPie size={18} className={loading ? 'animate-spin' : ''}/> Actualizar
          </button>
        </div>
      </div>

      {/* 2. FILTROS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Filter size={16}/> 
          </div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Motor de Búsqueda</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          
          <div className="md:col-span-12 lg:col-span-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Búsqueda Global</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Nombre, Cédula, CUPS, Nota..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="📅 Desde" type="date" value={filtros.fechaIni} onChange={(e:any) => setFiltros({...filtros, fechaIni: e.target.value})} />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="📅 Hasta" type="date" value={filtros.fechaFin} onChange={(e:any) => setFiltros({...filtros, fechaFin: e.target.value})} />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="Estado" options={OPCIONES_ESTADO} value={filtros.estado} onChange={(e:any) => setFiltros({...filtros, estado: e.target.value})} />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
            <FilterSelect label="EPS" options={OPCIONES_EPS} value={filtros.eps} onChange={(e:any) => setFiltros({...filtros, eps: e.target.value})} />
          </div>

          <div className="md:col-span-12 lg:col-span-8">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block flex justify-between">
                <span>Filtro por Modalidad / Diagnóstico (CAC)</span>
                {filtros.cohorte.length > 0 && (
                    <button onClick={() => setFiltros({ ...filtros, cohorte: [] })} className="text-red-500 hover:underline text-[10px]">Borrar selección</button>
                )}
            </label>
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 items-center">
              {filtros.cohorte.map((c) => (
                <span key={c} className="bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                  {c.replace('=', '').replace('CAC ', '')} 
                  <button onClick={() => setFiltros({ ...filtros, cohorte: filtros.cohorte.filter(item => item !== c) })} className="hover:bg-slate-600 rounded-full p-0.5 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <select 
                className="flex-1 bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer min-w-[180px] py-1"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !filtros.cohorte.includes(val)) {
                    setFiltros({ ...filtros, cohorte: [...filtros.cohorte, val] });
                  }
                }}
              >
                <option value="" disabled>+ Seleccionar...</option>
                <optgroup label="--- MODALIDADES ---">
                    {MODALIDADES.map(opt => (
                        <option key={opt} value={opt} disabled={filtros.cohorte.includes(opt)}>{opt}</option>
                    ))}
                    <option value="OTROS">OTROS</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                </optgroup>
                <optgroup label="--- DIAGNÓSTICOS (CAC) ---">
                    {CAC_GROUPS.map(opt => (
                        <option key={opt} value={opt} disabled={filtros.cohorte.includes(opt)}>{opt}</option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-4 flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setBusqueda(''); 
                setFiltros({ eps: "TODAS", cohorte: [], fechaIni: "", fechaFin: "", estado: "TODOS" });
              }} 
              className="text-slate-500 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors px-4 py-3"
            >
              <X size={16}/> Limpiar
            </button>
            <button 
                type="button" 
                onClick={fetchData} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Filter size={18}/> Filtrar Resultados
            </button>
          </div>
        </div>
      </div>

      {/* 3. KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiItem title="TOTALES" value={stats?.total || 0} sub="Base de datos" color="gray" icon={<Layers size={24}/>} />
        <KpiItem title="PENDIENTES" value={stats?.pendientes || 0} sub="Sin gestionar" color="orange" icon={<AlertCircle size={24}/>} />
        <KpiItem title="EN GESTIÓN" value={stats?.en_gestion || 0} sub="Trámite activo" color="yellow" icon={<Clock4 size={24}/>} />
        <KpiItem title="AGENDADOS" value={stats?.agendados || 0} sub="Cita programada" color="blue" icon={<Calendar size={24}/>} />
        <KpiItem title="REALIZADOS" value={stats?.realizados || 0} sub="Atendidos" color="green" icon={<CheckCircle2 size={24}/>} />
      </div>

      {/* 4. GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Estado de Solicitudes
            </h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie data={DATA_ESTADOS} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                            {DATA_ESTADOS.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_ESTADOS[index]} stroke="none" />))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Legend verticalAlign="bottom" iconType="circle" iconSize={8}/>
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Top Procedimientos
            </h4>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 0, left: 0, bottom: 0}}>
                        <XAxis dataKey="name" tick={{fontSize: 11, fill:'#64748b', fontWeight:500}} axisLine={false} tickLine={false} dy={10} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="cantidad" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="col-span-1 lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-red-600 mb-6 flex items-center gap-2">
                Barreras Frecuentes
            </h4>
            <div className="h-72 w-full">
                {barrerasData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                        No hay barreras registradas aún.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barrerasData} layout="vertical" margin={{top: 0, right: 30, left: 0, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#64748b'}} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#64748b'}} width={180} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="cantidad" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
      </div>

      {/* 5. TABLA DE DATOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 pt-4 gap-6 overflow-x-auto no-scrollbar">
            <TabButton label="Pendientes" active={tabEstado === 'PENDIENTE'} onClick={() => setTabEstado('PENDIENTE')} count={stats.pendientes} color="orange" />
            <TabButton label="En Gestión" active={tabEstado === 'EN_GESTION'} onClick={() => setTabEstado('EN_GESTION')} count={stats.en_gestion} color="yellow" />
            <TabButton label="Agendados" active={tabEstado === 'AGENDADO'} onClick={() => setTabEstado('AGENDADO')} count={stats.agendados} color="blue" />
            <TabButton label="Realizados" active={tabEstado === 'REALIZADO'} onClick={() => setTabEstado('REALIZADO')} count={stats.realizados} color="green" />
            <TabButton label="Cancelados" active={tabEstado === 'CANCELADO'} onClick={() => setTabEstado('CANCELADO')} count={stats.cancelados} color="red" />
            <TabButton label="Todos" active={tabEstado === 'TODOS'} onClick={() => setTabEstado('TODOS')} count={stats.total} color="gray" />
        </div>

        <div className="overflow-x-auto min-h-[300px] relative">
            {errorMsg && (
                <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center flex-col text-center p-4">
                    <WifiOff className="text-red-500 mb-3" size={48} />
                    <p className="text-slate-800 font-bold text-lg">Error de Conexión</p>
                    <p className="text-slate-500 text-sm mb-4 max-w-xs">{errorMsg}</p>
                    <button onClick={fetchData} className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-black font-bold text-sm">Reintentar</button>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center flex-col gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <span className="text-slate-500 text-xs font-bold animate-pulse">CARGANDO DATOS...</span>
                </div>
            )}

            {!loading && !errorMsg && patients.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Search size={32} className="text-slate-300"/>
                    </div>
                    <p className="text-slate-500 font-medium">No se encontraron registros en esta categoría.</p>
                </div>
            )}

            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10 text-slate-500 text-[11px] uppercase font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-12 text-center"><input type="checkbox" onChange={seleccionarTodo} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/></th>
                        <th className="px-4 py-4">PACIENTE</th>
                        <th className="px-4 py-4">SERVICIO / CUPS</th>
                        <th className="px-4 py-4 text-center">ESTADO</th>
                        <th className="px-4 py-4 text-left">FECHAS</th>
                        <th className="px-4 py-4 text-center">TIEMPO</th>
                        <th className="px-4 py-4">OBSERVACIÓN</th>
                        <th className="px-6 py-4 text-center">ACCIÓN</th>
                    </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100 text-sm">
                    {patients.map((row) => (
                        <tr key={row.id} className={`transition-all duration-150 hover:bg-slate-50 ${row.estado === 'CANCELADO' ? 'opacity-70' : ''}`}>
                            <td className="px-6 py-4 text-center">
                                <input type="checkbox" checked={seleccionados.includes(row.id)} onChange={() => toggleSeleccion(row.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                            </td>
                            
                            <td className="px-4 py-4">
                                <div className="font-bold text-slate-800 text-xs uppercase">{row.paciente}</div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                    {row.doc}
                                    <WhatsAppActions tel={row.tel} nombre={row.paciente} />
                                </div>
                            </td>
                            
                            <td className="px-4 py-4">
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                                    {row.modalidad.includes('=') || row.modalidad.includes('CAC') ? 'ONCOLOGÍA' : row.modalidad}
                                </div>
                                {row.cups !== "---" && row.cups !== "SIN CUPS" && (
                                    <div className="text-[11px] text-blue-600 font-mono font-bold mt-0.5">
                                        {row.cups}
                                    </div>
                                )}
                            </td>
                            
                            <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap ${
                                    row.estado.includes('REALIZADO') ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                                    row.estado.includes('EN_GESTION') ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 
                                    row.estado.includes('AGENDADO') ? 'bg-blue-50 text-blue-600 border border-blue-200' : 
                                    row.estado.includes('CANCELADO') ? 'bg-red-50 text-red-600 border border-red-200' : 
                                    'bg-orange-50 text-orange-600 border border-orange-200'
                                }`}>
                                    {row.estado.replace('_', ' ')}
                                </span>
                            </td>
                            
                            <td className="px-4 py-4 text-left">
                                <div className="text-[11px] text-slate-600 font-medium whitespace-nowrap">
                                    <div>Sol: {row.fecha_sol}</div>
                                    {row.fecha_cita !== '---' && <div className="mt-0.5 text-blue-600">Cita: {row.fecha_cita}</div>}
                                </div>
                            </td>
                            
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${row.dias > row.meta ? 'text-red-600 bg-red-50 ring-1 ring-red-100' : 'text-slate-600 bg-slate-100'}`}>
                                        {row.dias} días
                                    </span>
                                </div>
                            </td>
                            
                            <td className="px-4 py-4">
                                <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={row.obs}>
                                    {row.obs || '-'}
                                </div>
                            </td>
                            
                            <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                    <Link href={`/navegacion/admin/pacientes/perfil?id=${row.patientId}`} className="text-slate-400 hover:text-blue-600 transition-all" title="Ver Perfil">
                                        <Eye size={16}/>
                                    </Link>
                                    
                                    {row.followUpId ? (
                                        <Link href={`/navegacion/admin/gestion?id=${row.followUpId}`} className="text-slate-400 hover:text-orange-500 transition-all" title="Gestionar">
                                            <Edit size={16}/>
                                        </Link>
                                    ) : (
                                        <Link href={`/navegacion/admin/gestion/nuevo?patientId=${row.patientId}`} className="text-slate-400 hover:text-emerald-500 transition-all" title="Nueva Gestión">
                                            <Plus size={16}/>
                                        </Link>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Mostrando página {page} de {totalPages}</span>
            <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"><ChevronLeft size={16}/></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>
      </div>

      {showMassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-100">
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Layers size={20} className="text-blue-600"/> Gestión Masiva</h3>
                    <button onClick={() => setShowMassModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>
                <div className="p-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-start gap-4">
                        <Info size={20} className="text-blue-600 mt-0.5 shrink-0"/>
                        <div>
                            <p className="text-blue-800 text-sm font-bold">Editando {seleccionados.length} registros.</p>
                            <p className="text-blue-600 text-xs mt-1">Los cambios se aplicarán a todos los pacientes seleccionados.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Cambiar Estado</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" onChange={(e) => setMassUpdateData({...massUpdateData, status: e.target.value})}>
                                <option value="">-- Mantener estado actual --</option>
                                <option value="PENDIENTE">🟠 Pendiente</option>
                                <option value="EN_GESTION">🟡 En Gestión</option>
                                <option value="AGENDADO">🔵 Agendado</option>
                                <option value="REALIZADO">🟢 Realizado</option>
                                <option value="CANCELADO">🔴 Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Agregar Nota de Seguimiento</label>
                            <textarea rows={3} placeholder="Escribe una observación para todos..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" onChange={(e) => setMassUpdateData({...massUpdateData, observation: e.target.value})}></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-50">
                        <button onClick={() => setShowMassModal(false)} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button onClick={handleMassUpdate} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all transform active:scale-95">
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
function FilterSelect({ label, options, type = "text", value, onChange }: any) {
    return (
        <div className="w-full">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block pl-1">{label}</label>
            {type === 'date' ? (
                <input type="date" className="w-full py-3 px-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all" value={value} onChange={onChange}/>
            ) : (
                <div className="relative">
                    <select className="w-full py-3 px-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none appearance-none cursor-pointer" value={value} onChange={onChange}>
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
    const colorStyles: any = { 
        blue: "bg-blue-50 text-blue-600", 
        green: "bg-emerald-50 text-emerald-600", 
        orange: "bg-orange-50 text-orange-600", 
        yellow: "bg-yellow-50 text-yellow-600",
        purple: "bg-indigo-50 text-indigo-600",
        gray: "bg-slate-100 text-slate-700"
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
        orange: "text-orange-600 border-orange-500 bg-orange-50/50", 
        blue: "text-blue-600 border-blue-500 bg-blue-50/50", 
        green: "text-emerald-600 border-emerald-500 bg-emerald-50/50", 
        red: "text-red-600 border-red-500 bg-red-50/50", 
        yellow: "text-yellow-600 border-yellow-500 bg-yellow-50/50", 
        gray: "text-slate-800 border-slate-800 bg-slate-50" 
    } as Record<string, string>)[color] || "";

    const badgeColor = ({
        orange: "bg-orange-100 text-orange-700",
        blue: "bg-blue-100 text-blue-700",
        green: "bg-emerald-100 text-emerald-700",
        red: "bg-red-100 text-red-700",
        yellow: "bg-yellow-100 text-yellow-700",
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