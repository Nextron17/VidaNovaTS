"use client";

import React, { Suspense, useEffect, useState, useRef } from "react"; 
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Edit, User, MapPin, 
  Calendar, Clock, CheckCircle2, FileText, Activity,
  ShieldCheck, Loader2, Phone, MessageCircle, ChevronDown, ExternalLink, X
} from "lucide-react";
import api from "@/src/app/services/api";

// --- UTILIDAD PARA FECHAS SEGURA ---
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return null; 
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  return date.toLocaleDateString('es-CO', { 
    timeZone: 'UTC', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
};

function DetalleContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
        try {
            const res = await api.get(`/followups/${id}`); 
            setData(res.data);
        } catch (error) {
            console.error("Error loading detail:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-slate-400 font-bold">Cargando detalles...</p>
    </div>
  );

  if (!data) return <div className="p-10 text-center">No se encontró información.</div>;

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('REALIZADO')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s.includes('AGENDADO')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s.includes('CANCELADO')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const patientData = data.patient || {};

  // --- LÓGICA DE VISUALIZACIÓN DE FECHA DE CITA ---
  const renderCitaDate = () => {
    const fecha = formatDate(data.dateAppointment);
    if (fecha) return <span className="text-emerald-700 font-bold">{fecha}</span>;

    if (data.status === 'REALIZADO') {
        const fechaRegistro = formatDate(data.updatedAt);
        return (
            <div className="flex flex-col">
                <span className="text-emerald-600 font-bold">{fechaRegistro}*</span>
                <span className="text-[10px] text-slate-400 font-normal uppercase">(Fecha registro)</span>
            </div>
        );
    }

    if (data.status === 'CANCELADO') return <span className="text-red-400 font-bold">Cancelado</span>;

    return <span className="text-slate-400 italic">Por asignar</span>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans text-slate-800 pb-24 bg-slate-50/50 p-6 md:p-10 min-h-screen">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-6 gap-4">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${getStatusColor(data.status)}`}>
                    {data.status}
                </span>
                <span className="text-slate-400 text-xs font-mono font-bold">ID: #{data.id}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">
                {data.serviceName || "Procedimiento General"}
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <Clock size={14}/> Actualizado: <strong>{formatDate(data.updatedAt) || 'Reciente'}</strong>
            </p>
        </div>
        
        <div className="flex gap-3">
            <Link href={`/navegacion/admin/gestion?id=${data.id}`} className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                <Edit size={16}/> Editar Gestión
            </Link>
            <Link href={`/navegacion/admin/pacientes/perfil?id=${data.patientId}`} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                <ArrowLeft size={16}/> Volver al Paciente
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* 2. DATOS PACIENTE */}
        <div className="md:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden sticky top-6">
                <div className="bg-slate-900 p-4 text-white flex items-center gap-3">
                    <User size={18} className="text-blue-400"/> 
                    <span className="font-bold tracking-wide text-sm uppercase">Datos del Paciente</span>
                </div>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3 font-black text-2xl border border-slate-200 shadow-inner">
                            {patientData.firstName?.charAt(0) || "P"}
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                            {patientData.firstName} {patientData.lastName}
                        </h3>
                        <div className="text-xs font-bold text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200 mt-1">
                            {patientData.documentType} {patientData.documentNumber}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <InfoCardMini icon={<ShieldCheck/>} label="EPS" value={data.eps || patientData.insurance}/>
                        <InfoCardMini icon={<MapPin/>} label="Ubicación" value={`${patientData.city || ''}, ${patientData.department || ''}`}/>
                        <InfoCardContact value={patientData.phone} />
                    </div>
                </div>
            </div>
        </div>

        {/* 3. DETALLES DEL TRÁMITE */}
        <div className="md:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6 font-bold text-slate-800 border-b border-slate-100 pb-4">
                    <Activity size={20} className="text-blue-600"/> Detalles Operativos
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Servicio</p>
                        <p className="font-bold text-slate-800 text-lg leading-snug">{data.serviceName}</p>
                        {data.category && <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded mt-2 inline-block uppercase">{data.category}</span>}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Código CUPS</p>
                        <p className="font-mono font-bold text-slate-800 text-lg">{data.cups || "---"}</p>
                    </div>
                </div>

                {/* TIMELINE HORIZONTAL */}
                <div className="relative py-6 px-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -z-10 rounded-full"></div>
                    <div className="flex justify-between items-center text-center">
                        
                        {/* Hito 1: Solicitud */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-white border-4 border-slate-300 rounded-full flex items-center justify-center text-slate-400 shadow-sm z-10">
                                <Calendar size={16}/>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Solicitud</p>
                                {/* ✅ CORREGIDO: Ya no muestra la fecha de hoy si está vacío */}
                                <p className="text-xs font-bold text-slate-700">
                                    {formatDate(data.dateRequest) || 'No registrada'}
                                </p>
                            </div>
                        </div>

                        {/* Hito 2: Cita */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 border-4 rounded-full flex items-center justify-center shadow-sm z-10 
                                ${data.dateAppointment || data.status === 'REALIZADO' ? 'bg-white border-emerald-500 text-emerald-600' : 'bg-white border-slate-300 text-slate-300'}`}>
                                <CheckCircle2 size={16}/>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Cita Asignada</p>
                                <div className="text-xs">
                                    {renderCitaDate()}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6 font-bold text-slate-800 border-b border-slate-100 pb-4">
                    <FileText size={20} className="text-amber-500"/> Notas y Observaciones
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {data.observation || "No hay observaciones registradas."}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- UTILS ---
function InfoCardMini({ icon, label, value }: any) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 mt-0.5">{React.cloneElement(icon, { size: 16 })}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-sm font-bold text-slate-700 leading-tight">{value || '---'}</p>
            </div>
        </div>
    )
}

function InfoCardContact({ value }: { value: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const getNumbers = () => {
        if (!value) return [];
        return value.toString().split(/[\/\-,]+/).map((n: string) => n.trim().replace(/\D/g, '')).filter((n: string) => n.length > 6);
    };
    const numbers = getNumbers();
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    if (numbers.length === 0) return <InfoCardMini icon={<Phone/>} label="Contacto" value="Sin número"/>;
    
    return (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 relative" ref={dropdownRef}>
            <div className="flex items-start gap-3 mb-2">
                <div className="text-emerald-500 mt-0.5"><MessageCircle size={16}/></div>
                <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Contacto</p>
                    <p className="text-sm font-bold text-emerald-800 leading-tight">{value}</p>
                </div>
            </div>
            {numbers.length > 1 ? (
                <>
                    <button onClick={() => setIsOpen(!isOpen)} className="w-full py-1.5 bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 shadow-sm">
                        WhatsApp <ChevronDown size={12}/>
                    </button>
                    {isOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-lg shadow-xl z-50 overflow-hidden">
                            {numbers.map((num: string, idx: number) => (
                                <a key={idx} href={`https://wa.me/57${num}`} target="_blank" rel="noreferrer" className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors flex items-center justify-between">
                                    {num} <ExternalLink size={10}/>
                                </a>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <a href={`https://wa.me/57${numbers[0]}`} target="_blank" rel="noreferrer" className="w-full block py-1.5 bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 shadow-sm text-center">
                    WhatsApp
                </a>
            )}
        </div>
    );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
      <DetalleContent />
    </Suspense>
  );
}