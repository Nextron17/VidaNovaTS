"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, Filter, ShieldAlert, X, ChartPie,
  MessageCircle, Layers, Info, CheckCircle2,
  Loader2, WifiOff, FileSpreadsheet, ChevronLeft, ChevronRight, Eye, Edit,
  Calendar, Clock4, AlertCircle, FileText
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';

import api from "@/src/app/services/api";

// --- 1. CONSTANTES ---

const OPCIONES_ESTADO = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDIENTE", label: "🟠 Pendiente" },
  { value: "EN_GESTION", label: "🟡 En Gestión" },
  { value: "AGENDADO", label: "🔵 Agendado" },
  { value: "REALIZADO", label: "🟢 Realizado" },
  { value: "CANCELADO", label: "🔴 Cancelado" },
];

// 🔥 NUEVA LISTA DE PROCEDIMIENTOS (SOLICITADA)
const OPCIONES_PROCEDIMIENTO = [
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
  "25= Tumores secundarios", "Otros Diagnósticos",
  "CONSULTA", "PROCEDIMIENTOS", "LABORATORIO", "IMAGENES", "CIRUGIA", 
  "QUIMIOTERAPIA", "RADIOTERAPIA", "ESTANCIA", "OTROS", "PENDIENTE"
];

const COLORS_ESTADOS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']; 

// --- HELPER: DETECTOR DE MODALIDAD (PARA LA TABLA) ---
const getServiceType = (name: string) => {
  const n = (name || '').toUpperCase();
  if (n.includes('QUIMIO') || n.includes('INFUSION') || n.includes('BEVACIZUMAB')) return 'QUIMIOTERAPIA';
  if (n.includes('RADIOTERAPIA') || n.includes('TELETERAPIA') || n.includes('ACELERADOR')) return 'RADIOTERAPIA';
  if (n.includes('CONSULTA') || n.includes('VALORACION') || n.includes('CONTROL')) return 'CONSULTA EXTERNA';
  if (n.includes('RADIOGRAFIA') || n.includes('TAC') || n.includes('RESONANCIA') || n.includes('ECOGRAFIA') || n.includes('GAMAGRAFIA')) return 'IMAGENOLOGÍA';
  if (n.includes('LABORATORIO') || n.includes('HEMOGRAMA') || n.includes('SANGRE') || n.includes('PATOLOGIA')) return 'LABORATORIO';
  if (n.includes('CIRUGIA') || n.includes('RESECCION') || n.includes('ECTOMIA')) return 'CIRUGÍA';
  if (n.includes('INTERNACION') || n.includes('HOSPITAL') || n.includes('ESTANCIA')) return 'ESTANCIA';
  if (n.includes('DOLOR') || n.includes('PALIATIVO')) return 'CLÍNICA DEL DOLOR';
  return 'PROCEDIMIENTO / OTRO';
};

// --- COMPONENTE WHATSAPP ---
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
        className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors border border-green-200 shadow-sm"
        title={`Chat con ${numbers[0]}`}
      >
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
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
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
    estado: "TODOS", 
    procedimiento: "TODOS" 
  });
  
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [tabEstado, setTabEstado] = useState<'PENDIENTE' | 'AGENDADO' | 'REALIZADO' | 'TODOS'>('PENDIENTE');
  const [massUpdateData, setMassUpdateData] = useState({ status: "", observation: "" });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // --- LOGICA DE CARGA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
        const params: any = { page: page, limit: 10 };
        if (busqueda) params.search = busqueda;
        if (filtros.eps !== 'TODAS') params.eps = filtros.eps;
        if (filtros.fechaIni) params.startDate = filtros.fechaIni;
        if (filtros.fechaFin) params.endDate = filtros.fechaFin;
        if (filtros.procedimiento !== 'TODOS') params.procedure = filtros.procedimiento;
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
                    tipo_proc: f.category || "PENDIENTE", // La Cohorte (1= CAC Mama)
                    servicio: f.serviceName || "",        // El nombre real del servicio
                    cups: f.cups || "N/A",                // El código
                    fecha_sol: f.dateRequest ? String(f.dateRequest).split('T')[0] : '',
                    fecha_cita: f.dateAppointment ? String(f.dateAppointment).split('T')[0] : null,
                    dias: dias,
                    meta: 15,
                    estado: f.status || "PENDIENTE",
                    obs: f.observation || ""
                };
            });

            // Procesar Gráfica
            if (data.stats && data.stats.topProcedures) {
                // Filtramos o mapeamos para intentar coincidir con los grupos deseados si es posible
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

  const handleFixCategories = async () => {
    if(!confirm("¿Deseas normalizar las categorías antiguas a los 25 Grupos CAC oficiales?")) return;
    setLoading(true);
    try {
        const res = await api.post('/patients/fix-categories');
        alert(res.data.message);
        fetchData();
    } catch (error) {
        alert("Error ejecutando la reparación.");
    } finally {
        setLoading(false);
    }
  };

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

  // --- ESTILOS VISUALES ---
  const getRowStyle = (estado: string, dias: number, meta: number) => {
    if (estado === "REALIZADO") return "border-l-4 border-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20";
    if (estado === "CANCELADO") return "border-l-4 border-red-500 bg-red-50/10 opacity-70 hover:opacity-100";
    if (dias > meta) return "border-l-4 border-red-500 bg-red-50/10 hover:bg-red-50/20";
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

  const DATA_ESTADOS = [
    { name: 'Pendiente', value: Number(stats?.pendientes || 0) },
    { name: 'Agendado', value: Number(stats?.agendados || 0) },
    { name: 'Realizado', value: Number(stats?.realizados || 0) },
  ];

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-slate-800 p-6 md:p-8">
      
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
            <FilterSelect label="Procedimiento" options={OPCIONES_PROCEDIMIENTO} value={filtros.procedimiento} onChange={(e:any) => setFiltros({...filtros, procedimiento: e.target.value})} />
          </div>

          <div className="md:col-span-12 lg:col-span-8">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block flex justify-between">
                <span>Cohorte / Grupo (Selección Múltiple)</span>
                {filtros.cohorte.length > 0 && (
                    <button onClick={() => setFiltros({ ...filtros, cohorte: [] })} className="text-red-500 hover:underline text-[10px]">Borrar selección</button>
                )}
            </label>
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 items-center">
              {filtros.cohorte.map((c) => (
                <span key={c} className="bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                  {c}
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
                <option value="" disabled>+ Añadir filtro...</option>
                {OPCIONES_COHORTE.map((opt) => (
                  <option key={opt} value={opt} disabled={filtros.cohorte.includes(opt)}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-4 flex justify-end gap-3 pt-2">
            <button 
              onClick={() => {
                setBusqueda(''); 
                setFiltros({ eps: "TODAS", cohorte: [], fechaIni: "", fechaFin: "", estado: "TODOS", procedimiento: "TODOS" });
              }} 
              className="text-slate-500 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors px-4 py-3"
            >
              <X size={16}/> Limpiar
            </button>
            <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
              <Filter size={18}/> Filtrar Resultados
            </button>
          </div>
        </div>
      </div>

      {/* 3. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiItem title="TOTAL REGISTROS" value={stats?.total || 0} sub="Base de datos global" color="blue" icon={<Layers size={24}/>} />
        <KpiItem title="GESTIÓN COMPLETA" value={stats?.realizados || 0} sub="Pacientes atendidos" color="green" icon={<CheckCircle2 size={24}/>} />
        <KpiItem title="PENDIENTES" value={stats?.pendientes || 0} sub="Requieren gestión" color="orange" icon={<AlertCircle size={24}/>} />
        <KpiItem title="AGENDADOS" value={stats?.agendados || 0} sub="Cita programada" color="purple" icon={<Calendar size={24}/>} />
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
      </div>

      {/* 5. TABLA DE DATOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* TABS */}
        <div className="flex border-b border-slate-100 px-6 pt-4 gap-6 overflow-x-auto">
            <TabButton label="Pendientes" active={tabEstado === 'PENDIENTE'} onClick={() => setTabEstado('PENDIENTE')} count={stats.pendientes} color="orange" />
            <TabButton label="Agendados" active={tabEstado === 'AGENDADO'} onClick={() => setTabEstado('AGENDADO')} count={stats.agendados} color="blue" />
            <TabButton label="Realizados" active={tabEstado === 'REALIZADO'} onClick={() => setTabEstado('REALIZADO')} count={stats.realizados} color="green" />
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
                    <p className="text-slate-500 font-medium">No se encontraron registros.</p>
                    <p className="text-slate-400 text-xs mt-1">Intenta ajustar los filtros de búsqueda.</p>
                </div>
            )}

            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10 text-slate-500 text-[11px] uppercase font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-12 text-center"><input type="checkbox" onChange={seleccionarTodo} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/></th>
                        <th className="px-4 py-4">PACIENTE</th>
                        <th className="px-4 py-4">SERVICIO / CUPS</th>
                        <th className="px-4 py-4 text-center">ESTADO & FECHAS</th>
                        <th className="px-4 py-4 text-center">ESTADO</th>
                        <th className="px-4 py-4 text-center">TIEMPO</th>
                        <th className="px-6 py-4 text-right">ACCIÓN</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {patients.map((row) => (
                        <tr key={row.id} className={`group transition-all duration-150 ${getRowStyle(row.estado, row.dias, row.meta)}`}>
                            <td className="px-6 py-4 text-center">
                                <input type="checkbox" checked={seleccionados.includes(row.id)} onChange={() => toggleSeleccion(row.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-bold text-slate-800 text-xs group-hover:text-blue-700 transition-colors">{row.paciente}</div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">{row.doc}</span>
                                    <WhatsAppActions tel={row.tel} nombre={row.paciente} />
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                {/* 🔥 FILA MULTINIVEL RENOVADA */}
                                <div className="flex flex-col gap-1">
                                    {/* 1. Modalidad (Inferida) */}
                                    <div className="font-black text-slate-800 text-[11px] uppercase tracking-tight flex items-center gap-1.5">
                                        <FileText size={12} className="text-slate-400"/>
                                        {getServiceType(row.servicio)}
                                    </div>
                                    
                                    {/* 2. Cohorte / Categoría */}
                                    <div className="w-fit">
                                        <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                                            {row.tipo_proc}
                                        </span>
                                    </div>

                                    {/* 3. CUPS */}
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                        <span className="bg-slate-100 px-1 rounded text-slate-500 font-bold border border-slate-200">CUPS</span>
                                        {row.cups}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                    {row.fecha_sol && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                            <Clock4 size={10}/> {row.fecha_sol}
                                        </div>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">{row.fecha_cita || '--/--/--'}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase shadow-sm ${getBadgeStyle(row.estado)}`}>
                                    {row.estado.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center">
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded ${row.dias > row.meta ? 'text-red-600 bg-red-50 ring-1 ring-red-100' : 'text-slate-600 bg-slate-100'}`}>
                                        {row.dias} días
                                    </span>
                                    <span className="text-[9px] text-slate-400 mt-0.5">Meta: {row.meta}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/navegacion/admin/pacientes/perfil?id=${row.id}`} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all" title="Ver Perfil"><Eye size={16}/></Link>
                                    <Link href={`/navegacion/admin/gestion/nuevo?patientId=${row.id}`} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:shadow-sm transition-all" title="Gestionar"><Edit size={16}/></Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* PAGINACIÓN */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Mostrando página {page} de {totalPages}</span>
            <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"><ChevronLeft size={16}/></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>
      </div>

      {/* FAB (Botón Flotante) */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <button 
                onClick={() => setShowMassModal(true)}
                className="bg-slate-900 text-white pl-6 pr-8 py-4 rounded-full shadow-2xl flex items-center gap-4 hover:bg-black transition-all font-bold group border border-slate-700/50"
            >
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                    {seleccionados.length}
                </div>
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acción Masiva</span>
                    <span className="text-sm">Gestionar Seleccionados</span>
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
                                <option value="EN_GESTION">🟡 En Gestión</option>
                                <option value="AGENDADO">🔵 Agendado</option>
                                <option value="REALIZADO">🟢 Realizado</option>
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
                <input type="date" className="w-full py-3 px-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={value} onChange={onChange}/>
            ) : (
                <div className="relative">
                    <select className="w-full py-3 px-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer" value={value} onChange={onChange}>
                        <option value="TODAS">Todos</option>
                        {options?.map((opt: any, idx: number) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const lbl = typeof opt === 'object' ? opt.label : opt;
                            return <option key={idx} value={val}>{lbl}</option>;
                        })}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={14} className="rotate-90"/>
                    </div>
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
        orange: "text-orange-600 border-orange-500 bg-orange-50/50", 
        blue: "text-blue-600 border-blue-500 bg-blue-50/50", 
        green: "text-emerald-600 border-emerald-500 bg-emerald-50/50", 
        gray: "text-slate-800 border-slate-800 bg-slate-50" 
    } as Record<string, string>)[color] || "";

    const badgeColor = ({
        orange: "bg-orange-100 text-orange-700",
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