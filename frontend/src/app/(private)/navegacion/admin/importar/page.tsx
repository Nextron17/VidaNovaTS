"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, UploadCloud, FileSpreadsheet, CheckCircle2, 
  AlertCircle, FileText, Info, Loader2 
} from "lucide-react";
import api from "@/src/app/services/api";

export default function ImportarDataPage() {
  const [isClient, setIsClient] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => { setIsClient(true); }, []);

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

  // --- 🚀 LÓGICA DE SUBIDA CORREGIDA ---
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    
    // ✅ CAMBIO 1: El campo debe llamarse 'file' para coincidir con upload.single('file') del backend
    formData.append("file", file); 

    try {
      // ✅ CAMBIO 2: La ruta correcta es /import
      const res = await api.post("/navegacion/patients/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const stats = res.data.details;
      
      alert(`✅ ¡Proceso Exitoso!\n\n📄 Total filas: ${stats.total}\n🆕 Nuevos pacientes: ${stats.created}\n🔄 Actualizados: ${stats.updated}`);
      
      setFile(null);
      router.push("/navegacion/admin"); 

    } catch (error: any) {
      console.error("Error subiendo archivo:", error);
      const msg = error.response?.data?.error || "Error de conexión al procesar el archivo.";
      alert(`❌ Ocurrió un error:\n${msg}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-slate-800 pb-24 bg-white p-8">
      
      {/* 1. HEADER */}
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <Link href="/navegacion/admin" className="p-2 -ml-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20}/>
        </Link>
        <div>
            <h1 className="text-2xl font-black text-slate-900">Carga Masiva</h1>
            <p className="text-slate-500 text-sm">Actualización de base de datos de pacientes.</p>
        </div>
      </div>

      {/* 2. ZONA DE CARGA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="bg-blue-600 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <UploadCloud size={32} />
            </div>
            <h2 className="text-lg font-bold">Sube tu archivo aquí</h2>
            <p className="text-blue-100 text-sm opacity-90">Formatos aceptados: .xlsx (Excel) o .csv</p>
        </div>

        <div className="p-8">
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer
                    ${isDragging 
                        ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                        : file 
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
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
                
                <label htmlFor="fileInput" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    {file ? (
                        <>
                            <FileSpreadsheet size={48} className="text-green-600 mb-3 animate-in zoom-in duration-300"/>
                            <h3 className="text-lg font-bold text-green-700">{file.name}</h3>
                            <p className="text-sm text-green-600">{(file.size / 1024).toFixed(2)} KB • Listo para procesar</p>
                        </>
                    ) : (
                        <>
                            <FileText size={48} className="text-slate-300 mb-3"/>
                            <h3 className="text-base font-bold text-slate-700">Arrastra tu archivo o haz clic para buscar</h3>
                            <p className="text-xs text-slate-400 mt-2">El sistema detectará duplicados automáticamente.</p>
                        </>
                    )}
                </label>
            </div>

            <div className="flex justify-center mt-8 gap-4">
                <Link href="/navegacion/admin" className={`px-6 py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    Cancelar
                </Link>
                <button 
                    onClick={handleUpload} 
                    disabled={!file || uploading}
                    className="px-8 py-3 rounded-full bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={18} className="animate-spin"/> Procesando...
                        </>
                    ) : (
                        <>
                            <UploadCloud size={18}/> Procesar Archivo
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* 3. GUÍA DE AYUDA */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Info size={18} className="text-blue-500"/> Estructura Recomendada
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
            <ColumnItem label="Identificación (Cédula)" required />
            <ColumnItem label="Nombre Completo" required />
            <ColumnItem label="Teléfono / Celular" />
            <ColumnItem label="EPS / Aseguradora" />
        </div>
      </div>
    </div>
  );
}

function ColumnItem({ label, required }: { label: string, required?: boolean }) {
    return (
        <div className="flex items-center gap-2 py-1.5 border-b border-slate-200/50 last:border-0">
            {required ? (
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0"/>
            ) : (
                <AlertCircle size={14} className="text-slate-400 flex-shrink-0"/>
            )}
            <span className={required ? "font-semibold text-slate-700" : "text-slate-500"}>
                {label}
            </span>
        </div>
    );
}