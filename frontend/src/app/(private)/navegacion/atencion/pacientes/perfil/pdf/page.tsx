"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, Activity, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import api from "@/src/app/services/api";

// --- UTILIDAD: Calcular Edad ---
const calculateAge = (dateString: string) => {
  if (!dateString) return "N/A";
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function PdfPreviewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null); // Datos del paciente + historial
  const [printDate, setPrintDate] = useState("");

  useEffect(() => {
    // Fecha de generación del reporte
    setPrintDate(new Date().toLocaleDateString('es-CO', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    }));

    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/navegacion/patients/pdf/${id}`);
        
        if (res.data.success) {
            setData(res.data.data);
        } else {
            setError("No se pudo cargar la información del paciente.");
        }
      } catch (err) {
        console.error(err);
        setError("Error de conexión al generar el PDF.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- LOADING STATE ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-500 text-white gap-4">
        <Loader2 className="animate-spin" size={40}/>
        <p>Generando vista previa...</p>
    </div>
  );

  // --- ERROR STATE ---
  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-8 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48}/>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Error Generando Documento</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-slate-800 text-white rounded-lg">
            Volver
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-500 p-8 flex flex-col items-center justify-start">
      
      {/* BOTONES (No salen en impresión) */}
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link 
            href={`/navegacion/admin/pacientes/perfil?id=${id}`} 
            className="flex items-center gap-2 text-white font-bold hover:text-slate-200 transition-colors"
        >
            <ArrowLeft size={20}/> Volver al Perfil
        </Link>
        <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
        >
            <Printer size={20}/> Imprimir
        </button>
      </div>

      {/* --- HOJA A4 --- */}
      <div id="print-area" className="bg-white width-[210mm] min-h-[297mm] p-[1.5cm] shadow-2xl relative text-slate-900 font-sans mx-auto">
        
        {/* MARCA DE AGUA (Fondo) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
            <Activity size={400} strokeWidth={1} />
        </div>

        {/* CONTENIDO (Z-Index encima de marca de agua) */}
        <div className="relative z-10">
            
            {/* 1. HEADER INSTITUCIONAL */}
            <header className="flex justify-between items-start border-b-4 border-blue-900 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-900 text-white p-2 rounded">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-blue-900 tracking-tight leading-none">VIDANOVA</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Navegación Oncológica</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-800">HISTORIA CLÍNICA</h2>
                    <p className="text-xs text-slate-500">Generado el: {printDate}</p>
                    <p className="text-xs text-slate-500">Folio No. #{data.id ? data.id.toString().padStart(6, '0') : '000000'}</p>
                </div>
            </header>

            {/* 2. DATOS DEL PACIENTE (Estilo Rejilla Médica) */}
            <section className="mb-8">
                <h3 className="text-xs font-bold text-blue-900 uppercase bg-blue-50 p-2 border-l-4 border-blue-900 mb-2">
                    I. Información del Paciente
                </h3>
                <div className="border border-slate-300">
                    {/* Fila 1 */}
                    <div className="flex border-b border-slate-300">
                        <div className="w-2/3 border-r border-slate-300 p-2">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Nombre Completo</label>
                            <div className="text-sm font-bold text-slate-900 uppercase">
                                {data.firstName} {data.lastName}
                            </div>
                        </div>
                        <div className="w-1/3 p-2">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Identificación</label>
                            <div className="text-sm font-bold text-slate-900">
                                {data.documentType} {data.documentNumber}
                            </div>
                        </div>
                    </div>
                    {/* Fila 2 */}
                    <div className="flex border-b border-slate-300">
                        <div className="w-1/4 border-r border-slate-300 p-2">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Edad</label>
                            <div className="text-xs text-slate-900">{calculateAge(data.birthDate)} Años</div>
                        </div>
                        <div className="w-1/4 border-r border-slate-300 p-2">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Género</label>
                            <div className="text-xs text-slate-900">{data.gender}</div>
                        </div>
                        <div className="w-1/4 border-r border-slate-300 p-2">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Teléfono</label>
                            <div className="text-xs text-slate-900">{data.phone || 'N/A'}</div>
                        </div>
                        <div className="w-1/4 p-2">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Régimen</label>
                            <div className="text-xs text-slate-900">{data.regimen || 'N/A'}</div>
                        </div>
                    </div>
                    {/* Fila 3 */}
                    <div className="flex">
                        <div className="w-full p-2 bg-slate-50">
                            <label className="block text-[9px] text-slate-500 uppercase font-bold">Entidad Aseguradora (EPS)</label>
                            <div className="text-sm font-bold text-blue-900 uppercase">{data.insurance || 'PARTICULAR'}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. HISTORIAL CLÍNICO (Tabla Limpia) */}
            <section className="mb-12">
                <h3 className="text-xs font-bold text-blue-900 uppercase bg-blue-50 p-2 border-l-4 border-blue-900 mb-4">
                    II. Evolución y Gestión
                </h3>
                
                {/* VALIDACIÓN: Si no hay historial */}
                {(!data.followups || data.followups.length === 0) ? (
                    <p className="text-center text-sm text-slate-400 italic py-10 border border-slate-200 border-dashed">
                        No se encontraron registros clínicos para este paciente.
                    </p>
                ) : (
                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="border-b-2 border-slate-800 text-left">
                                <th className="py-2 w-[15%] font-bold text-slate-800 uppercase">Fechas</th>
                                <th className="py-2 w-[35%] font-bold text-slate-800 uppercase">Procedimiento / CUPS</th>
                                <th className="py-2 w-[15%] font-bold text-slate-800 uppercase text-center">Estado</th>
                                <th className="py-2 w-[35%] font-bold text-slate-800 uppercase">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {data.followups.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td className="py-3 align-top">
                                        <div className="font-bold">
                                            Sol: {new Date(item.dateRequest).toLocaleDateString('es-CO')}
                                        </div>
                                        {item.dateAppointment && (
                                            <div className="text-blue-700 font-bold mt-1">
                                                Cita: {new Date(item.dateAppointment).toLocaleDateString('es-CO')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 align-top pr-2">
                                        <div className="font-bold text-slate-900 mb-1">
                                            {item.serviceName || 'PROCEDIMIENTO SIN NOMBRE'}
                                        </div>
                                        {item.cups && (
                                            <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">
                                                CUPS: {item.cups}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 align-top text-center">
                                        <span className={`inline-block px-2 py-1 rounded font-bold text-[9px] uppercase border ${
                                            item.status === 'REALIZADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            item.status === 'PENDIENTE' || item.status === 'EN_GESTION' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-3 align-top italic text-slate-600 text-justify">
                                        {item.observation || "Sin observaciones registradas."}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* 4. FIRMAS (Footer Institucional) */}
            <div className="mt-20 flex justify-between items-end break-inside-avoid">
                <div className="text-center w-64">
                    <div className="border-b border-slate-400 mb-2"></div>
                    <p className="font-bold text-xs text-slate-800">Firma del Profesional</p>
                    <p className="text-[9px] text-slate-500">TP. ___________________</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-400">Documento generado el {printDate}</p>
                    <p className="text-[9px] text-slate-400">Plataforma Vidanova &copy; {new Date().getFullYear()}</p>
                </div>
            </div>

            {/* Disclaimer Legal */}
            <div className="mt-8 border-t border-slate-100 pt-2 break-inside-avoid">
                <p className="text-[8px] text-slate-400 text-justify leading-tight">
                    ESTE DOCUMENTO CONTIENE INFORMACIÓN CONFIDENCIAL Y PRIVILEGIADA DE LA HISTORIA CLÍNICA. SU USO ESTÁ RESTRINGIDO EXCLUSIVAMENTE AL PERSONAL DE SALUD AUTORIZADO. CUALQUIER COPIA, REPRODUCCIÓN O USO NO AUTORIZADO ESTÁ PROHIBIDO POR LA LEY.
                </p>
            </div>

        </div>
      </div>

      {/* --- ESTILOS CORREGIDOS PARA EVITAR DOBLE PÁGINA --- */ }
      <style jsx global>{`
        @media print {
            body { visibility: hidden; background: white; }
            .min-h-screen { height: 0 !important; overflow: hidden !important; padding: 0 !important; margin: 0 !important; border: none !important; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; margin: 0; padding: 1.5cm; background: white; z-index: 99999; }
            @page { size: A4; margin: 0; }
            nav, header, footer, aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}