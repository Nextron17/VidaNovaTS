"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation"; 
import Link from "next/link"; 
import { 
  ArrowLeft, MapPin, Clock, CheckCircle2, AlertCircle, 
  Loader2, ShieldCheck, MessageCircle, ChevronDown, ExternalLink,
  FileText, Pencil, Plus, User, FileDown, Trash2,
  Stethoscope, Building2, UserCog, CalendarClock, Ban,
  Edit, Eye
} from "lucide-react";
import api from "@/src/app/services/api";

// --- UTILIDAD 1: Abreviatura de Documento ---
const getDocType = (type: string) => {
  if (!type) return 'CC'; 
  const t = type.toUpperCase().trim();
  if (t.includes('CIUDADANIA') || t === 'CC') return 'CC';
  if (t.includes('EXTRANJERIA') || t === 'CE') return 'CE';
  if (t.includes('IDENTIDAD') || t === 'TI') return 'TI';
  if (t.includes('CIVIL') || t === 'RC') return 'RC';
  if (t.includes('PASAPORTE') || t === 'PA') return 'PA';
  if (t.includes('PERMISO') || t.includes('PPT') || t.includes('PEP')) return 'PEP';
  return t.length > 4 ? 'DOC' : t; 
};

// --- UTILIDAD 2: Parsear la Observación "Rica" ---
// Extrae metadatos usando Regex para ser más flexible con formatos sucios
const parseMetadata = (fullObs: string) => {
    if (!fullObs) return { text: '', meta: {} as any };
    
    // 1. Extraer la nota limpia (todo lo que está antes del primer pipe | o tag conocido)
    const cleanTextMatch = fullObs.match(/^([^|]+)/);
    const text = cleanTextMatch ? cleanTextMatch[1].trim() : '';

    // 2. Extraer metadatos usando Regex global
    const meta: any = {};
    
    // Función helper para extraer valor de un tag
    const extract = (tag: string) => {
        const regex = new RegExp(`(?:\\||\\n)\\s*${tag}:\\s*([^|\\n]+)`, 'i');
        const match = fullObs.match(regex);
        return match ? match[1].trim() : null;
    };

    meta.PROF = extract('PROF');
    meta.LUGAR = extract('LUGAR');
    meta.RESP = extract('RESP');
    meta.BARRERA = extract('BARRERA');
    meta.DX = extract('DX') || extract('DX SUGERIDO');
    meta['F.NOTA'] = extract('F.NOTA');

    return { text, meta };
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id'); 
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return; 
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/navegacion/patients/${id}`);
        if (res.data.success) {
            // Ordenar historial por fecha descendente (más reciente primero)
            const sortedData = res.data.data;
            if (sortedData.followups) {
                sortedData.followups.sort((a: any, b: any) => new Date(b.dateRequest).getTime() - new Date(a.dateRequest).getTime());
            }
            setPatient(sortedData);
        }
      } catch (error) {
        console.error(error);
        alert("Error cargando paciente");
        router.push("/navegacion/admin/pacientes");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm(`⚠️ ¿Eliminar a ${patient.firstName}?\n\nSe borrará todo el historial.`)) return;
    try {
        await api.delete(`/patients/${id}`);
        router.push("/navegacion/admin/pacientes"); 
    } catch (error) {
        alert("Error al eliminar.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-slate-400 font-bold">Cargando historia clínica...</p>
    </div>
  );

  if (!patient) return <div className="p-10 text-center">No encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* 1. HEADER */}
      <div className="mb-8">
        <Link href="/navegacion/admin/pacientes" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm mb-4">
            <ArrowLeft size={16}/> Volver al Directorio
        </Link>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="w-full lg:w-auto">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
                    {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
                        <User size={18} className="text-blue-400"/>
                        <div className="font-mono text-sm md:text-base font-bold tracking-wide flex items-center gap-2">
                            <span className="text-slate-400 border-r border-slate-600 pr-2">{getDocType(patient.documentType)}</span>
                            <span>{patient.documentNumber}</span>
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${patient.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                        {patient.status || 'SIN ESTADO'}
                    </span>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <button onClick={handleDelete} className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all">
                    <Trash2 size={16}/>
                </button>
                <Link href={`/navegacion/admin/pacientes/perfil/editar?id=${patient.id}`} className="px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex gap-2 items-center">
                    <Pencil size={16}/> Editar
                </Link>
                <Link href={`/navegacion/admin/pacientes/perfil/pdf?id=${patient.id}`} className="px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex gap-2 items-center">
                    <FileDown size={16}/> PDF
                </Link>
                
                {/* Botón Nuevo Seguimiento (Envía patientId correctamente) */}
                <Link href={`/navegacion/admin/gestion/nuevo?patientId=${patient.id}`} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex gap-2 items-center">
                    <Plus size={18}/> Nuevo Seguimiento
                </Link>
            </div>
        </div>
      </div>

      {/* 2. TARJETAS INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <InfoCard icon={<ShieldCheck/>} color="blue" label="Aseguradora" value={patient.insurance || 'No registrada'} sub="Régimen Contributivo"/>
        <InfoCard icon={<MapPin/>} color="orange" label="Ubicación" value={patient.city || 'Desconocida'} sub={patient.department}/>
        <InfoCard icon={<MessageCircle/>} color="green" label="Contacto" value={patient.phone} sub={patient.email || 'Sin email'} isContact/>
      </div>

      {/* 3. TIMELINE DETALLADO */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-4">
            <Clock className="text-blue-600"/> 
            <h4 className="text-xl font-black text-slate-900">Historia Clínica & Gestión</h4>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{patient.followups?.length || 0} Registros</span>
        </div>

        {!patient.followups || patient.followups.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">No hay registros clínicos aún.</div>
        ) : (
            <div className="relative pl-8 border-l-2 border-slate-200 ml-4 space-y-10">
                {patient.followups.map((h: any) => {
                    const { text, meta } = parseMetadata(h.observation);
                    
                    return (
                        <div key={h.id} className="relative group">
                            {/* Bolita de tiempo */}
                            <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 bg-white shadow-sm z-10 ${h.status.includes('REALIZADO') ? 'border-emerald-500' : 'border-slate-300'}`} />
                            
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                {h.dateRequest ? new Date(h.dateRequest).toLocaleDateString('es-CO') : 'Sin Fecha'}
                            </div>

                            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all relative">
                                
                                {/* CABECERA DE LA TARJETA */}
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 border-b border-slate-50 pb-4 pr-10">
                                    <div>
                                        <h6 className="font-bold text-slate-900 text-base leading-tight">{h.serviceName || 'Procedimiento General'}</h6>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {h.cups && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">CUPS: {h.cups}</span>}
                                            {h.eps && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">{h.eps}</span>}
                                            {h.category && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">{h.category}</span>}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black border uppercase whitespace-nowrap ${getStatusColor(h.status)}`}>
                                        {h.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* BOTÓN DE ACCIÓN (VER DETALLE) */}
                                <Link 
                                    href={`/navegacion/admin/gestion?id=${h.id}`} 
                                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" 
                                    title="Ver Detalle Completo"
                                >
                                    <ExternalLink size={20}/>
                                </Link>

                                {/* DETALLES RICOS (Metadatos) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                                    {meta.PROF && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <Stethoscope size={14} className="text-blue-500"/> <span className="truncate">{meta.PROF}</span>
                                        </div>
                                    )}
                                    {meta.LUGAR && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <Building2 size={14} className="text-orange-500"/> <span className="truncate">{meta.LUGAR}</span>
                                        </div>
                                    )}
                                    {meta.RESP && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <UserCog size={14} className="text-purple-500"/> <span className="truncate">Resp: {meta.RESP}</span>
                                        </div>
                                    )}
                                    {meta['F.NOTA'] && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <CalendarClock size={14} className="text-emerald-500"/> <span>Nota: {meta['F.NOTA']}</span>
                                        </div>
                                    )}
                                    {meta.DX && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 md:col-span-2">
                                            <FileText size={14} className="text-pink-500"/> <span className="truncate font-bold">{meta.DX}</span>
                                        </div>
                                    )}
                                </div>

                                {/* ALERTAS (Barreras) */}
                                {meta.BARRERA && (
                                    <div className="mb-4 bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3">
                                        <Ban size={16} className="text-red-500 mt-0.5 shrink-0"/>
                                        <div>
                                            <p className="text-xs font-black text-red-700 uppercase mb-0.5">Barrera Detectada</p>
                                            <p className="text-xs text-red-600 font-medium">{meta.BARRERA}</p>
                                        </div>
                                    </div>
                                )}

                                {/* NOTA LIMPIA (Texto Humano) */}
                                {text && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                            <FileText size={12}/> Observación Clínica
                                        </p>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">"{text}"</p>
                                    </div>
                                )}

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

// --- COMPONENTES AUXILIARES ---
function InfoCard({ icon, color, label, value, sub, isContact = false }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const colors: any = { blue: "bg-blue-50 text-blue-600", orange: "bg-orange-50 text-orange-600", green: "bg-emerald-50 text-emerald-600" };
    const numbers = isContact && value ? value.toString().split(/[\/\-,]+/).map((n: string) => n.trim().replace(/\D/g, '')).filter((n: string) => n.length > 6) : [];
    return (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-all relative">
            <div className={`p-4 rounded-2xl ${colors[color]}`}>{React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}</div>
            <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
                <div className="text-sm font-bold text-slate-800 truncate mb-1" title={value}>{value}</div>
                <div className="text-xs text-slate-400 font-medium truncate" title={sub}>{sub}</div>
                {isContact && numbers.length > 0 && (
                    <div className="mt-3 relative" ref={dropdownRef}>
                        <button onClick={() => setIsOpen(!isOpen)} className="w-full py-2 bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">WhatsApp <ChevronDown size={14}/></button>
                        {isOpen && (<div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">{numbers.map((num: string, idx: number) => (<a key={idx} href={`https://wa.me/57${num}`} target="_blank" className="block px-4 py-3 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex justify-between">{num} <ExternalLink size={12}/></a>))}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    const s = (status || '').toUpperCase();
    if (s.includes('REALIZADO') || s.includes('FINALIZA')) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s.includes('CANCEL') || s.includes('NO ASISTE')) return "bg-red-50 text-red-700 border-red-100";
    if (s.includes('AGENDADO')) return "bg-blue-50 text-blue-700 border-blue-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}