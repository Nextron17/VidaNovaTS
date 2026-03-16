"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, UploadCloud, FileSpreadsheet, CheckCircle2, 
  AlertCircle, FileText, Info, Loader2, Trash2 // 🚀 Agregué Trash2
} from "lucide-react";
import api from "@/src/app/services/api";

export default function ImportarDataAtencionPage() {
  const [isClient, setIsClient] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => { setIsClient(true); }, []);

  // --- MANEJO DEL DRAG & DROP ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 🚀 NUEVO: Función para limpiar el archivo si el usuario se equivoca
  const clearFile = (e: React.MouseEvent) => {
      e.preventDefault(); // Evita que se abra el selector de archivos al hacer clic en borrar
      setFile(null);
  };

  // --- LÓGICA DE SUBIDA ---
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file); 

    try {
      const res = await api.post("/navegacion/patients/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 🚀 BLINDAJE: Si el backend no envía details, no se rompe la app
      const stats = res.data.details || { total: 'Varios', created: 'N/A', updated: 'N/A' };
      
      alert(`✅ ¡Importación Finalizada!\n\n📄 Filas procesadas: ${stats.total}\n🆕 Nuevos ingresos: ${stats.created}\n🔄 Registros actualizados: ${stats.updated}`);
      
      setFile(null);
      router.push("/navegacion/atencion/pacientes"); 

    } catch (error: any) {
      console.error("Error subiendo archivo:", error);
      const msg = error.response?.data?.error || "Error de red al procesar el archivo Excel.";
      alert(`❌ Error en la carga:\n${msg}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 pb-24 p-6 md:p-10">
      
      {/* 1. HEADER OPERATIVO */}
      <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
        <Link href="/navegacion/atencion/pacientes" className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
        </Link>
        <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Carga Masiva</h1>
            <p className="text-slate-500 font-medium text-sm">Importación masiva de expedientes desde Excel o CSV.</p>
        </div>
      </div>

      {/* 2. ZONA DE CARGA */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden mb-10 transition-all">
        <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileSpreadsheet size={120} />
            </div>
            
            <div className="relative z-10">
                <div className="mx-auto w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-5 backdrop-blur-md shadow-inner">
                    <UploadCloud size={40} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest">Sincronización de Datos</h2>
                <p className="text-emerald-100 text-sm font-medium mt-2">Arrastra el archivo maestro de navegación aquí.</p>
            </div>
        </div>

        <div className="p-10">
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-500 
                    ${isDragging 
                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01] shadow-lg' 
                        : file 
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-inner'
                            : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50 shadow-sm cursor-pointer'
                    }
                `}
            >
                <input 
                    type="file" 
                    id="fileInput" 
                    className="hidden" 
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                
                {/* 🚀 LÓGICA SEPARADA PARA EVITAR ABRIR EL INPUT AL QUERER BORRAR */}
                {file ? (
                    <div className="animate-in zoom-in duration-500 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm relative">
                            <FileSpreadsheet size={40}/>
                            {/* Botón flotante para eliminar el archivo */}
                            {!uploading && (
                                <button 
                                    onClick={clearFile}
                                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 hover:scale-110 transition-all shadow-md"
                                    title="Quitar archivo"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">{file.name}</h3>
                        <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-widest">
                            {(file.size / 1024).toFixed(2)} KB • Preparado para proceso
                        </p>
                    </div>
                ) : (
                    <label htmlFor="fileInput" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                            <FileText size={40}/>
                        </div>
                        <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">Seleccionar archivo local</h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest leading-loose">
                            .xlsx, .xls o .csv admitidos <br/>
                            <span className="text-emerald-500">Detección inteligente de duplicados activada</span>
                        </p>
                    </label>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center mt-10 gap-4">
                <Link href="/navegacion/atencion/pacientes" className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all text-center ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    Regresar
                </Link>
                <button 
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="px-12 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-slate-900 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={18} className="animate-spin text-white"/> PROCESANDO...
                        </>
                    ) : (
                        <>
                            <UploadCloud size={18}/> Iniciar Carga Masiva
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* 3. GUÍA DE ESTRUCTURA */}
      <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                <Info size={18}/>
            </div>
            <h4 className="font-black text-white uppercase tracking-widest text-sm">Protocolo de Importación</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            <ColumnItem label="Cédula / ID" required />
            <ColumnItem label="Nombres y Apellidos" required />
            <ColumnItem label="Teléfono de Contacto" />
            <ColumnItem label="EPS o Aseguradora" />
            
            <ColumnItem label="Email de Paciente" />
            <ColumnItem label="Fecha de Nacimiento" />
            <ColumnItem label="Ciudad de Residencia" />
            <ColumnItem label="Género" />
        </div>
      </div>
    </div>
  );
}

function ColumnItem({ label, required }: { label: string, required?: boolean }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0 group">
            {required ? (
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0"/>
            ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0"></div>
            )}
            <span className={`text-xs uppercase tracking-tight ${required ? "font-black text-slate-200" : "font-bold text-slate-500"}`}>
                {label}
            </span>
        </div>
    );
}