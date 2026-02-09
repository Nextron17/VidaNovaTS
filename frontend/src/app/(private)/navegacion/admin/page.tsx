"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, Filter, CheckSquare, ShieldAlert, 
  Users, Activity, X, ChartPie,
  Clock, CheckCircle, AlertTriangle, Download, 
  FileSpreadsheet, ArrowRight, ChevronLeft, ChevronRight,
  MoreHorizontal, Phone, Trash2, Edit, Eye, MessageCircle, Layers, Info, Building2, PenLine, CheckCircle2,
  Loader2, WifiOff 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';

// ✅ IMPORTAMOS TU INSTANCIA DE AXIOS (Que ya maneja el Token y la URL base)
import api from "@/src/app/services/api";

// --- 1. CONSTANTES Y OPCIONES DE FILTROS ---

const OPCIONES_ESTADO = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDIENTE", label: "🟠 Pendiente" },
  { value: "EN_GESTION", label: "🟡 En Gestión" },
  { value: "AGENDADO", label: "🔵 Agendado" },
  { value: "REALIZADO", label: "🟢 Realizado" },
  { value: "CANCELADO", label: "🔴 Cancelado" },
];

const OPCIONES_PROCEDIMIENTO = [
  "Consulta Externa", "Quimioterapia", "Radioterapia", "Cirugía", 
  "Imagenología", "Laboratorio", "Clínica del Dolor", "Estancia", "Oncología"
];

const OPCIONES_EPS = [
  "ASMET SALUD", "UNIVERSIDAD DEL CAUCA", "NUEVA EPS", "SANITAS", "SURA", "OTRA"
];

const OPCIONES_COHORTE = [
  "1= CAC Mama", "2= CAC Próstata", "3= CAC Cérvix", "4= CAC Colorectal", 
  "5= CAC Estómago", "6= CAC Melanoma", "7= CAC Pulmón", "8= CAC Linfoma Hodgkin",
  "9= CAC Linfoma No Hodgkin", "10= CAC Leucemia Linfocítica Aguda", 
  "11= CAC Leucemia Mielocítica Aguda", "12= Labio, cavidad bucal y faringe",
  "13= Otros órganos digestivos", "14= Otros órganos respiratorios e intratorácicos",
  "15= Huesos y cartílagos articulares", "16= Otros tumores de la piel",
  "17= Tejidos mesoteliales y blandos", "18= Otros órganos genitales femeninos",
  "19= Otros órganos genitales masculinos", "20= Vías urinarias (Riñón/Vejiga)",
  "21= Ojo, encéfalo y sistema nervioso central", "22= Glándulas tiroides y endocrinas",
  "23= Sitios mal definidos / No especificados", "24= Otros tumores tejido linfático/hematopoyético",
  "25= Tumores secundarios", "Otros Diagnósticos"
];

const COLORS_ESTADOS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']; 

// --- COMPONENTE WHATSAPP INTELIGENTE ---
const WhatsAppActions = ({ tel, nombre }: { tel: string, nombre: string }) => {
  const strTel = String(tel || "");
  if (!strTel || strTel.length < 5) return <span className="text-slate-300">-</span>;

  const numbers = strTel.split(/[\/\:\-\s]+/).map(n => n.replace(/\D/g, '')).filter(n => n.length >= 7);

  if (numbers.length === 0) return <span className="text-slate-300">-</span>;

  if (numbers.length === 1) {
    return (
      <a 
        href={`https://wa.me/57${numbers[0]}?text=Hola ${nombre}, nos comunicamos de Vidanova...`} 
        target="_blank" rel="noopener noreferrer"
        className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors border border-green-200"
        title={`Chat con ${numbers[0]}`}
      >
        <MessageCircle size={14} />
      </a>
    );
  }

  return (
    <div className="relative group">
      <button className="p-1.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors border border-green-200 flex items-center gap-1">
        <MessageCircle size={14} />
        <span className="text-[9px] font-bold bg-white px-1 rounded-full border border-green-200">{numbers.length}</span>
      </button>
      <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-slate-200 shadow-lg rounded-lg p-1 hidden group-hover:block z-50">
        {numbers.map((num, idx) => (
          <a key={idx} href={`https://wa.me/57${num}`} target="_blank" className="block px-2 py-1.5 text-xs text-slate-600 hover:bg-green-50 hover:text-green-700 rounded">
            📱 {num}
          </a>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pendientes: 0, realizados: 0, agendados: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Paginación y Filtros
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showMassModal, setShowMassModal] = useState(false);
  const [filtros, setFiltros] = useState({ 
  eps: "TODAS", 
  cohorte: [] as string[], // ✅ Ahora es un array para múltiples selecciones
  fechaIni: "", 
  fechaFin: "", 
  estado: "TODOS", 
  procedimiento: "TODOS" });
  
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [tabEstado, setTabEstado] = useState<'PENDIENTE' | 'AGENDADO' | 'REALIZADO' | 'TODOS'>('PENDIENTE');
  
  const [massUpdateData, setMassUpdateData] = useState({ status: "", observation: "" });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // --- FUNCIÓN DE CARGA (CORREGIDA SIN DUPLICACIÓN) ---
  // --- FUNCIÓN DE CARGA (Usando API con Token) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    
    try {
        const params: any = {
            page: page,
            limit: 10
        };
        
        // 1. Buscador de texto
        if (busqueda) params.search = busqueda;
        
        // 2. Filtros de un solo valor
        if (filtros.eps !== 'TODAS') params.eps = filtros.eps;
        if (filtros.fechaIni) params.startDate = filtros.fechaIni;
        if (filtros.fechaFin) params.endDate = filtros.fechaFin;
        if (filtros.procedimiento !== 'TODOS') params.procedure = filtros.procedimiento;
        
        // 3. 🔥 FILTRO MÚLTIPLE DE COHORTE
        // Convertimos el array ['Cérvix', 'Mama'] en un string "Cérvix,Mama"
        if (filtros.cohorte.length > 0) {
            params.cohorte = filtros.cohorte.join(',');
        }
        
        // 4. Lógica de Pestañas (Tabs)
        if (tabEstado !== 'TODOS') {
            params.status = tabEstado;
        } else if (filtros.estado !== 'TODOS') {
            params.status = filtros.estado;
        }

        // Petición al Backend
        const res = await api.get('/patients', { params });
        const data = res.data;

        if (data.success) {
            // Mapeo de pacientes para la tabla
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
                    tipo_proc: f.category || "GENERAL",
                    cups: f.cups || "N/A",
                    fecha_sol: f.dateRequest ? String(f.dateRequest).split('T')[0] : '',
                    fecha_cita: f.dateAppointment ? String(f.dateAppointment).split('T')[0] : null,
                    dias: dias,
                    meta: 15,
                    estado: f.status || "PENDIENTE",
                    obs: f.observation || ""
                };
            });

            // Actualizar Gráfica de Barras
            if (data.stats && data.stats.topProcedures) {
                setChartData(data.stats.topProcedures.map((item: any) => ({
                    name: item.name || 'OTROS',
                    cantidad: Number(item.cantidad)
                })));
            }

            setPatients(mappedData);
            setTotalPages(data.pagination?.totalPages || 1);
            setStats(data.stats || { total: 0, pendientes: 0, realizados: 0, agendados: 0 }); 
        }
    } catch (error: any) {
        console.error("❌ Error API:", error);
        setErrorMsg(error.response?.status === 401 ? "Sesión expirada." : "Error al conectar con el servidor.");
        setPatients([]);
    } finally {
        setLoading(false);
    }
  }, [page, busqueda, tabEstado, filtros]);
  
  useEffect(() => { fetchData(); }, [fetchData]);

  // --- GESTIÓN MASIVA ---
  const handleMassUpdate = async () => {
    if (!massUpdateData.status && !massUpdateData.observation) return;
    try {
        const res = await api.put('/patients/bulk-update', {
            ids: seleccionados,
            status: massUpdateData.status,
            observation: massUpdateData.observation
        });
        
        if (res.data.success) {
            alert("✅ Registros actualizados correctamente.");
            setShowMassModal(false);
            setSeleccionados([]);
            fetchData();
        }
    } catch (error) {
        alert("Error de conexión o permisos.");
    }
  };

  // --- HELPERS VISUALES ---
  const getRowStyle = (estado: string, dias: number, meta: number) => {
    if (estado === "REALIZADO") return "border-l-4 border-emerald-500 bg-emerald-50/10";
    if (estado === "CANCELADO") return "border-l-4 border-red-500 bg-red-50/10 opacity-60";
    if (dias > meta) return "border-l-4 border-red-500 bg-red-50/10";
    return "border-l-4 border-slate-200";
  };

  const getBadgeStyle = (estado: string) => {
    switch (estado) {
        case 'REALIZADO': return 'bg-white border border-emerald-500 text-emerald-600';
        case 'AGENDADO': return 'bg-white border border-blue-500 text-blue-600';
        case 'EN_GESTION': return 'bg-white border border-yellow-500 text-yellow-600';
        case 'CANCELADO': return 'bg-white border border-red-500 text-red-600';
        default: return 'bg-white border border-orange-400 text-orange-500';
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
    { name: 'Agendado', value: Number(stats?.agendados || 0) },
    { name: 'Realizado', value: Number(stats?.realizados || 0) },
  ];

    // Agrega una cohorte a la lista si no existe ya
    const handleCohorteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "TODAS") {
        setFiltros({ ...filtros, cohorte: [] });
    } else if (!filtros.cohorte.includes(val)) {
        setFiltros({ ...filtros, cohorte: [...filtros.cohorte, val] });
    }
    };

    // Quita una cohorte específica de la lista
    const removeCohorte = (val: string) => {
    setFiltros({ ...filtros, cohorte: filtros.cohorte.filter(c => c !== val) });
    };

  if (!isClient) return null;

  return (
    <div className="w-full max-w-full font-sans text-slate-800 pb-24 bg-white p-8">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldAlert className="text-blue-600" size={32}/> Torre de Control
          </h1>
          <p className="text-slate-500 text-base mt-1">Gestión integral de {stats.total || 0} pacientes.</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/navegacion/admin/importar" className="btn-action bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all">
            <FileSpreadsheet size={18} className="text-green-600"/> Cargar
          </Link>
          <button onClick={fetchData} className="btn-action bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 transition-all">
            <ChartPie size={18}/> Actualizar
          </button>
        </div>
      </div>

      {/* 2. FILTROS AVANZADOS */}
<div className="mb-10">
  <div className="flex items-center gap-2 mb-4 text-blue-600 font-extrabold text-xs uppercase tracking-widest">
    <Search size={14}/> Filtros de Búsqueda Avanzada
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
    
    <div className="md:col-span-12">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, cédula, CUPS o notas..." 
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
        />
      </div>
    </div>

    <div className="md:col-span-6 lg:col-span-2">
      <FilterSelect label="Fecha Desde" type="date" value={filtros.fechaIni} onChange={(e:any) => setFiltros({...filtros, fechaIni: e.target.value})} />
    </div>
    <div className="md:col-span-6 lg:col-span-2">
      <FilterSelect label="Fecha Hasta" type="date" value={filtros.fechaFin} onChange={(e:any) => setFiltros({...filtros, fechaFin: e.target.value})} />
    </div>
    <div className="md:col-span-6 lg:col-span-2">
      <FilterSelect label="Estado" options={OPCIONES_ESTADO} value={filtros.estado} onChange={(e:any) => setFiltros({...filtros, estado: e.target.value})} />
    </div>
    <div className="md:col-span-6 lg:col-span-2">
      <FilterSelect label="EPS" options={OPCIONES_EPS} value={filtros.eps} onChange={(e:any) => setFiltros({...filtros, eps: e.target.value})} />
    </div>
    <div className="md:col-span-12 lg:col-span-4">
      <FilterSelect label="Procedimiento" options={OPCIONES_PROCEDIMIENTO} value={filtros.procedimiento} onChange={(e:any) => setFiltros({...filtros, procedimiento: e.target.value})} />
    </div>

    {/* SECCIÓN CORREGIDA: Cohorte / Grupo con selección múltiple */}
    <div className="md:col-span-12 lg:col-span-8">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block pl-1">
        Cohorte / Grupo (Selección Múltiple)
      </label>
      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
        {/* Badges de cohortes seleccionadas */}
        {filtros.cohorte.map((c) => (
          <span 
            key={c} 
            className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm animate-in zoom-in duration-200"
          >
            {c}
            <button 
              onClick={() => setFiltros({ ...filtros, cohorte: filtros.cohorte.filter(item => item !== c) })}
              className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Selector incrustado */}
        <select 
          className="flex-1 bg-transparent text-sm text-slate-600 outline-none cursor-pointer min-w-[150px]"
          value=""
          onChange={(e) => {
            const val = e.target.value;
            if (val && !filtros.cohorte.includes(val)) {
              setFiltros({ ...filtros, cohorte: [...filtros.cohorte, val] });
            }
          }}
        >
          <option value="" disabled>+ Añadir cohorte...</option>
          {OPCIONES_COHORTE.map((opt) => (
            <option key={opt} value={opt} disabled={filtros.cohorte.includes(opt)}>
              {opt}
            </option>
          ))}
        </select>

        {filtros.cohorte.length > 0 && (
          <button 
            onClick={() => setFiltros({ ...filtros, cohorte: [] })}
            className="text-[9px] font-bold text-slate-400 hover:text-red-500 px-2 uppercase transition-colors"
          >
            Limpiar cohortes
          </button>
        )}
      </div>
    </div>

    <div className="md:col-span-12 lg:col-span-4 flex justify-end items-center gap-3 pb-1">
      <button 
        onClick={() => {
          setBusqueda(''); 
          // ✅ Se agregó cohorte: [] para limpiar la selección múltiple
          setFiltros({ eps: "TODAS", cohorte: [], fechaIni: "", fechaFin: "", estado: "TODOS", procedimiento: "TODOS" });
        }} 
        className="text-slate-400 hover:text-red-500 text-xs font-bold flex items-center gap-1 transition-colors px-2"
      >
        <X size={14}/> Limpiar Todo
      </button>
      <button onClick={fetchData} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow-md hover:bg-slate-900 transition-all flex items-center gap-2">
        <Filter size={14}/> Aplicar Filtros
      </button>
    </div>
  </div>
</div>

      {/* 3. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <KpiItem title="TOTAL REGISTROS" value={stats?.total || 0} sub="Base de datos" color="blue" />
        <KpiItem title="COMPLETADOS" value={stats?.realizados || 0} sub="Gestión finalizada" color="green" />
        <KpiItem title="PENDIENTES" value={stats?.pendientes || 0} sub="Requieren acción" color="orange" />
        <KpiItem title="AGENDADOS" value={stats?.agendados || 0} sub="Cita programada" color="purple" />
      </div>

      {/* 4. GRÁFICAS (Funcionales con Backend) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 border-t border-slate-100 pt-8">
        <div className="flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Estado de Solicitudes
            </h4>
            <div className="h-56 w-full border border-slate-100 rounded-2xl bg-slate-50/30 p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie data={DATA_ESTADOS} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {DATA_ESTADOS.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_ESTADOS[index]} />))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" iconType="circle"/>
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="col-span-2 flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Top Procedimientos (Tiempo Real)
            </h4>
            <div className="h-56 w-full border border-slate-100 rounded-2xl bg-slate-50/30 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 0, left: 0, bottom: 0}}>
                        <XAxis dataKey="name" tick={{fontSize: 10, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* 5. TABLA DINÁMICA */}
      <div>
        <div className="flex border-b border-slate-200 mb-0">
            <TabButton label="Pendientes" active={tabEstado === 'PENDIENTE'} onClick={() => setTabEstado('PENDIENTE')} color="orange" />
            <TabButton label="Agendados" active={tabEstado === 'AGENDADO'} onClick={() => setTabEstado('AGENDADO')} color="blue" />
            <TabButton label="Realizados" active={tabEstado === 'REALIZADO'} onClick={() => setTabEstado('REALIZADO')} color="green" />
            <TabButton label="Todos" active={tabEstado === 'TODOS'} onClick={() => setTabEstado('TODOS')} color="gray" />
        </div>

        <div className="overflow-x-auto border-x border-b border-slate-200 rounded-b-xl min-h-[300px] relative">
            {errorMsg && (
                <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center flex-col text-center p-4">
                    <WifiOff className="text-red-500 mb-2" size={40} />
                    <p className="text-red-600 font-bold text-lg">Error de Acceso</p>
                    <p className="text-slate-500 text-sm mb-4">{errorMsg}</p>
                    <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Reintentar</button>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            )}

            {!loading && !errorMsg && patients.length === 0 && (
                <div className="p-10 text-center text-slate-400">
                    <p>No hay registros para mostrar.</p>
                </div>
            )}

            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4 w-10 text-center"><input type="checkbox" onChange={seleccionarTodo} className="rounded border-slate-300"/></th>
                        <th className="px-4 py-4">PACIENTE</th>
                        <th className="px-4 py-4">SERVICIO / CUPS</th>
                        <th className="px-4 py-4 text-center">ESTADO & FECHAS</th>
                        <th className="px-4 py-4 text-center">ESTADO</th>
                        <th className="px-4 py-4 text-center">DIAS</th>
                        <th className="px-6 py-4 text-right">ACCIÓN</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {patients.map((row) => (
                        <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${getRowStyle(row.estado, row.dias, row.meta)}`}>
                            <td className="px-6 py-4 text-center">
                                <input type="checkbox" checked={seleccionados.includes(row.id)} onChange={() => toggleSeleccion(row.id)} className="rounded border-slate-300"/>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-bold text-slate-900 text-xs">{row.paciente}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{row.doc}</span>
                                    <WhatsAppActions tel={row.tel} nombre={row.paciente} />
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-bold text-slate-700 text-[11px] uppercase">{row.tipo_proc}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.cups}</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                    {row.fecha_sol && <span className="text-[10px] text-slate-500 font-bold uppercase">Sol: {row.fecha_sol}</span>}
                                    <span className="text-[10px] text-slate-400 font-mono">{row.fecha_cita || '--/--/--'}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${getBadgeStyle(row.estado)}`}>{row.estado}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-bold px-1.5 rounded ${row.dias > row.meta ? 'text-red-600 bg-red-50' : 'text-slate-600 bg-slate-100'}`}>{row.dias} días</span>
                                    <span className="text-[9px] text-slate-400">Meta: {row.meta}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/navegacion/admin/detalle?id=${row.id}`} className="p-1.5 text-slate-400 hover:text-blue-600"><Eye size={16}/></Link>
                                    <Link href={`/navegacion/admin/gestion?id=${row.id}`} className="p-1.5 text-slate-400 hover:text-orange-600"><Edit size={16}/></Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-3 bg-slate-50 border border-t-0 border-slate-200 rounded-b-xl flex justify-end items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-50"><ChevronLeft size={14}/></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-100 disabled:opacity-50"><ChevronRight size={14}/></button>
        </div>
      </div>

      {/* FAB (Botón flotante) */}
      {seleccionados.length > 0 && (
        <button 
            onClick={() => setShowMassModal(true)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 z-40 hover:bg-blue-700 transition-all font-bold scale-105"
        >
            <Layers size={20}/><span>GESTIONAR ({seleccionados.length}) SELECCIONADOS</span>
        </button>
      )}

      {/* MODAL GESTIÓN MASIVA */}
      {showMassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-50 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Layers size={24}/> Gestión Masiva</h3>
                    <button onClick={() => setShowMassModal(false)}><X size={24}/></button>
                </div>
                <div className="p-6">
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-8 flex items-start gap-4 shadow-sm">
                        <Info size={20} className="text-amber-600 mt-1"/>
                        <p className="text-amber-700 text-sm font-bold">Editando {seleccionados.length} registros al tiempo.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nuevo Estado</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setMassUpdateData({...massUpdateData, status: e.target.value})}>
                            <option value="">-- No cambiar --</option>
                            <option value="EN_GESTION">🟡 En Gestión</option>
                            <option value="AGENDADO">🔵 Agendado</option>
                            <option value="REALIZADO">🟢 Realizado</option>
                        </select>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nota de Seguimiento</label>
                        <textarea rows={3} placeholder="Escribe aquí..." className="w-full p-2.5 border border-slate-300 rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setMassUpdateData({...massUpdateData, observation: e.target.value})}></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowMassModal(false)} className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleMassUpdate} className="px-8 py-2.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"><CheckCircle2 size={18}/> CONFIRMAR</button>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block pl-1">{label}</label>
            {type === 'date' ? (
                <input type="date" className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-colors" value={value} onChange={onChange}/>
            ) : (
                <select className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-colors" value={value} onChange={onChange}>
                    <option value="TODAS">Todos</option>
                    {options?.map((opt: any, idx: number) => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        const lbl = typeof opt === 'object' ? opt.label : opt;
                        return <option key={idx} value={val}>{lbl}</option>;
                    })}
                </select>
            )}
        </div>
    );
}

function KpiItem({ title, value, sub, color }: any) {
    const styles: any = {
        blue: "bg-blue-50/50 border-blue-100 text-blue-700",
        green: "bg-emerald-50/50 border-emerald-100 text-emerald-700",
        orange: "bg-orange-50/50 border-orange-100 text-orange-700",
        purple: "bg-purple-50/50 border-purple-100 text-purple-700"
    };
    return (
        <div className={`p-5 rounded-2xl border ${styles[color]}`}>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black mb-1 text-slate-800">{value}</h3>
            <p className="text-[11px] font-bold opacity-80">{sub}</p>
        </div>
    );
}

function TabButton({ label, active, onClick, color }: any) {
    const activeClass = ({ orange: "text-orange-600 border-orange-500", blue: "text-blue-600 border-blue-500", green: "text-emerald-600 border-emerald-500", gray: "text-slate-800 border-slate-800" } as Record<string, string>)[color] || "";
    return (
        <button onClick={onClick} className={`flex-1 py-3 text-[11px] font-bold border-b-2 transition-all uppercase tracking-wide ${active ? activeClass : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
            {label}
        </button>
    );
}