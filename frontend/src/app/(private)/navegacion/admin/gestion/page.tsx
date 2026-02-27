"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Save, UserCog, MessageCircle, 
  Stethoscope, AlertTriangle, Loader2, Ban, Clock 
} from "lucide-react";
import api from "@/src/app/services/api";

// --- LISTAS DE SELECCIÓN ---
const LISTAS = {
  estados: ["PENDIENTE", "EN_GESTION", "AGENDADO", "REALIZADO", "CANCELADO"],
  tipos_paciente: ["INCIDENTE", "PREVALENTE"],
  prestadores: ["Vidanova", "Clínica Imbanaco", "Clínica La Estancia", "Dumian", "Otro"],
  barreras: ["Ninguna / Sin Barrera", "No contesta", "Teléfono apagado", "Orden vencida", "Sin autorización", "No hay agenda"],
  procedimientos: ["Consulta Externa", "Quimioterapia", "Radioterapia", "Cirugía", "Imagenología", "Laboratorio", "Estancia", "Oncología", "Clínica del Dolor", "Otros"],
  opciones_anestesia: ["NO", "SI", "NO REQUIERE"]
};

// --- HELPER: FORMATEO SEGURO DE FECHAS ---
const formatDateForInput = (dateString: any) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split('T')[0];
    } catch (e) {
        return "";
    }
};

function GestionEdicionDetalle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    patientId: "" as string | number,
    paciente_nombre: "",
    paciente_doc: "",
    paciente_eps: "",
    
    estado: "EN_GESTION",
    tipo_paciente: "INCIDENTE",
    prestador: "Vidanova",
    barrera: "Ninguna / Sin Barrera",
    
    procedimiento: "Consulta Externa",
    cups_codigo: "",
    cups_nombre: "", 
    
    val_preanestesica: "NO",
    fecha_solicitud: "",
    fecha_cita: "",
    
    nueva_nota: "",
    historial_raw: "" 
  });

  // 1. CARGA DE DATOS (Sin AbortController para evitar el "canceled")
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsFetching(true);
      
      try {
        const res = await api.get(`/navegacion/followups/${id}`);
        const data = res.data.data || res.data;

        if (data) {
          const getTag = (tag: string) => {
            if (!data.observation) return "";
            const match = data.observation.match(new RegExp(`${tag}:\\s*([^|]+)`, 'i'));
            return match ? match[1].trim() : "";
          };
          
          const cleanNote = (data.observation || "").split('|')[0].trim();

          setFormData({
            patientId: data.patientId || "",
            paciente_nombre: data.patient ? `${data.patient.firstName || ''} ${data.patient.lastName || ''}`.trim() : "PACIENTE SIN NOMBRE",
            paciente_doc: data.patient?.documentNumber || "---",
            paciente_eps: data.patient?.insurance || data.eps || "SIN EPS",
            
            estado: data.status || "EN_GESTION",
            tipo_paciente: getTag("TIPO") || "INCIDENTE",
            prestador: getTag("LUGAR") || data.prestador || "Vidanova",
            barrera: getTag("BARRERA") || "Ninguna / Sin Barrera",
            
            procedimiento: data.category || "Consulta Externa",
            cups_codigo: data.cups || "",
            cups_nombre: data.serviceName || "",
            
            val_preanestesica: getTag("VAL_PREANESTESICA") || "NO",
            fecha_solicitud: formatDateForInput(data.dateRequest || data.createdAt),
            fecha_cita: formatDateForInput(data.dateAppointment),
            
            nueva_nota: cleanNote === 'Sin detalles de gestión.' ? '' : cleanNote,
            historial_raw: data.observation || ""
          });
        }
      } catch (error: any) {
        console.error("❌ Error cargando gestión:", error);
        setErrorMsg("No se pudo cargar la información del registro.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const agregarNotaRapida = (texto: string) => {
    setFormData(prev => ({
        ...prev,
        nueva_nota: prev.nueva_nota ? `${prev.nueva_nota}. ${texto}` : texto
    }));
  };

  // 2. GUARDAR CAMBIOS DE FORMA SEGURA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
        alert("Error: Faltan datos de la URL.");
        return;
    }

    setIsLoading(true);
    try {
        const dxPrevio = formData.historial_raw.match(/DX SUGERIDO:\s*([^|]+)/i);
        const strDx = dxPrevio ? ` | DX SUGERIDO: ${dxPrevio[1].trim()}` : '';

        const richObservation = `
            ${formData.nueva_nota.trim() || 'Gestión actualizada sin observaciones.'} | 
            BARRERA: ${formData.barrera} | 
            LUGAR: ${formData.prestador} | 
            TIPO: ${formData.tipo_paciente} | 
            VAL_PREANESTESICA: ${formData.val_preanestesica} 
            ${strDx}
        `.replace(/\s+/g, ' ').trim();

        const payload = {
            status: formData.estado,
            category: formData.procedimiento,
            cups: formData.cups_codigo,
            serviceName: formData.cups_nombre,
            observation: richObservation,
            dateRequest: formData.fecha_solicitud || new Date().toISOString().split('T')[0],
            dateAppointment: formData.fecha_cita || null,
        };

        await api.put(`/navegacion/followups/${id}`, payload);
        
        if (formData.patientId) {
            router.push(`/navegacion/admin/pacientes/perfil?id=${formData.patientId}`);
        } else {
            router.push(`/navegacion/admin`);
        }
        
    } catch (error) {
        alert("❌ Error al actualizar la gestión. Por favor intenta de nuevo.");
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetching) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Cargando Gestión...</p>
    </div>
  );

  if (errorMsg) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Ban size={48} className="text-red-400 mb-4"/>
        <h2 className="text-xl font-black text-slate-800">{errorMsg}</h2>
        <button onClick={() => router.back()} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
            Volver atrás
        </button>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto font-sans text-slate-800 pb-24 bg-slate-50/50 min-h-screen p-4 md:p-8">
      
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm group w-fit">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Volver
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
                <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                    <UserCog size={28} className="text-white"/>
                </div>
                <div>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Editor de Gestión Clínica</p>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">{formData.paciente_nombre}</h1>
                </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 px-6 border border-white/10 flex items-center gap-6">
                <div className="text-center border-r border-white/10 pr-6">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Documento</p>
                    <p className="font-mono text-sm font-bold tracking-tighter">{formData.paciente_doc}</p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Entidad (EPS)</p>
                    <p className="text-xs font-black text-blue-400">{formData.paciente_eps}</p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                <div className="space-y-8">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">
                            <Clock size={16} className="text-blue-600"/> Estado & Prioridad
                        </h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Estado de la Solicitud</label>
                                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                                    {LISTAS.estados.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Tipo de Paciente</label>
                                    <select name="tipo_paciente" value={formData.tipo_paciente} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                                        {LISTAS.tipos_paciente.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">IPS Destino</label>
                                    <select name="prestador" value={formData.prestador} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                                        {LISTAS.prestadores.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 bg-red-50/50 rounded-[2rem] border border-red-100/50">
                                <label className="text-[10px] font-black text-red-600 uppercase mb-3 block flex items-center gap-2">
                                    <AlertTriangle size={14}/> Barrera de Acceso Detectada
                                </label>
                                <select name="barrera" value={formData.barrera} onChange={handleChange} className="w-full p-4 bg-white border border-red-100 rounded-2xl text-sm font-bold text-red-700 focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm shadow-red-100/50 cursor-pointer">
                                    {LISTAS.barreras.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">
                            <Stethoscope size={16} className="text-blue-600"/> Datos del Procedimiento
                        </h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Servicio / Categoría</label>
                                <select name="procedimiento" value={formData.procedimiento} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                                    {LISTAS.procedimientos.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                            <div className="bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block ml-1">CUPS</label>
                                        <input type="text" name="cups_codigo" value={formData.cups_codigo} onChange={handleChange} placeholder="Código" className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm font-mono font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm shadow-blue-100/50"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block ml-1">Descripción de Actividad</label>
                                        <input type="text" name="cups_nombre" value={formData.cups_nombre} onChange={handleChange} placeholder="Nombre del procedimiento" className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm shadow-blue-100/50"/>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-purple-50/50 rounded-[2rem] border border-purple-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <label className="text-[10px] font-black text-purple-700 uppercase flex items-center gap-2 shrink-0">
                                    <Stethoscope size={16}/> ¿Preanestésica?
                                </label>
                                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-purple-100/50 w-full md:w-auto overflow-x-auto">
                                    {LISTAS.opciones_anestesia.map(opt => (
                                        <button 
                                            key={opt}
                                            type="button"
                                            onClick={() => setFormData(p => ({...p, val_preanestesica: opt}))}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex-1 md:flex-none whitespace-nowrap ${formData.val_preanestesica === opt ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Fecha de Solicitud</label>
                                    <input type="date" name="fecha_solicitud" value={formData.fecha_solicitud} onChange={handleChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-emerald-600 uppercase mb-2 block ml-1">Fecha de la Cita</label>
                                    <input type="date" name="fecha_cita" value={formData.fecha_cita} onChange={handleChange} className="w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[3rem] border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest">
                            <MessageCircle size={16} className="text-blue-600"/> Nota de Seguimiento
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {["No contesta", "Cita OK", "Envió WA"].map(tag => (
                                <button key={tag} type="button" onClick={() => agregarNotaRapida(tag)} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea 
                        name="nueva_nota" 
                        value={formData.nueva_nota} 
                        onChange={handleChange} 
                        rows={5} 
                        placeholder="Describa el progreso de la gestión o los hallazgos importantes..." 
                        className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner resize-none"
                    ></textarea>
                </div>
            </div>

            <div className="mt-12 flex flex-col-reverse md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
                <button type="button" onClick={() => router.back()} className="w-full md:w-auto px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors">
                    Cancelar Cambios
                </button>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all flex justify-center items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isLoading ? 'Guardando...' : 'Actualizar Gestión'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}>
      <GestionEdicionDetalle />
    </Suspense>
  );
}