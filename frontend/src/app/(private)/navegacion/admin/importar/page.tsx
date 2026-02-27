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

  // Asegurar renderizado solo en cliente para evitar errores de hidratación
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
      const droppedFile = e.dataTransfer.files[0];
      // Validación básica de extensión
      if (droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        setFile(droppedFile);
      } else {
        alert("Por favor sube solo archivos Excel o CSV.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // --- 🚀 NÚCLEO DE SUBIDA MASIVA ESCALABLE ---
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file); // El nombre "file" debe coincidir con el backend

    try {
      /**
       * 🛡️ ESTRATEGIA ANTI-CRASH:
       * Configuramos Axios con timeout: 0 (infinito). 
       * Esto permite que si el servidor tarda minutos procesando miles de filas
       * en lotes de 100, el navegador no corte la conexión ("Network Error").
       */
      const res = await api.post("/navegacion/patients/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0, 
      });

      if (res.data.success) {
        // Obtenemos los contadores del ImportService
        const stats = res.data.details;
        
        alert(
          `✅ ¡IMPORTACIÓN COMPLETADA EXITOSAMENTE!\n\n` +
          `• Pacientes Nuevos: ${stats.createdPatients || 0}\n` +
          `• Registros Actualizados: ${stats.updatedPatients || 0}\n` +
          `• Citas/Seguimientos: ${stats.createdFollowUps || 0}\n` +
          `• Errores en filas: ${stats.errors || 0}\n\n` +
          `La base de datos se ha sincronizado correctamente.`
        );
        
        setFile(null);
        // Redirigir al dashboard para ver los cambios
        router.push("/navegacion/admin"); 
        router.refresh(); 
      } else {
        throw new Error(res.data.error || "El servidor no pudo procesar el archivo.");
      }

    } catch (error: any) {
      console.error("❌ Error en la carga masiva:", error);
      const errorMessage = error.response?.data?.error || "Error de red: El servidor local tardó demasiado o el archivo bloqueó el hilo principal.";
      alert(`❌ ERROR DE IMPORTACIÓN:\n${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-slate-800 pb-24 bg-white p-8">
      
      {/* 1. NAVEGACIÓN Y TÍTULO */}
      <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
        <Link href="/navegacion/admin" className="p-2.5 -ml-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <ArrowLeft size={20}/>
        </Link>
        <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Carga Masiva de Datos</h1>
            <p className="text-slate-500 font-medium">Actualiza miles de pacientes y seguimientos mediante Excel.</p>
        </div>
      </div>

      {/* 2. ÁREA DE DROPZONE */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
            <div className="mx-auto w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                <UploadCloud size={40} />
            </div>
            <h2 className="text-xl font-bold">Cargador de Inteligencia de Datos</h2>
            <p className="text-blue-100/80 text-sm mt-1">Arrastra el reporte consolidado para iniciar el proceso.</p>
        </div>

        <div className="p-10">
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-500
                    ${isDragging 
                        ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-inner' 
                        : file 
                            ? 'border-emerald-500 bg-emerald-50/30'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
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
                        <div className="animate-in fade-in zoom-in duration-300">
                            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                              <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-xl font-black text-emerald-800">{file.name}</h3>
                            <p className="text-sm font-bold text-emerald-600/70 mt-1">
                              {(file.size / 1024).toFixed(2)} KB • Archivo validado y listo
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4 group-hover:text-blue-400 transition-colors">
                              <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Selecciona el archivo maestro</h3>
                            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                              Soporta múltiples hojas. El sistema normaliza automáticamente nombres y documentos.
                            </p>
                        </>
                    )}
                </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-center mt-10 gap-4">
                <Link href="/navegacion/admin" className={`px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 hover:text-slate-700 transition-all text-center ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    Volver al Panel
                </Link>
                <button 
                    onClick={handleUpload} 
                    disabled={!file || uploading}
                    className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3 transform active:scale-95"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={20} className="animate-spin text-blue-400"/> 
                            <div className="flex flex-col items-start leading-tight text-left">
                              <span className="text-sm">Procesando Base de Datos...</span>
                              <span className="text-[10px] font-medium text-slate-400">Esto puede tardar unos minutos</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={20}/> Ejecutar Importación Masiva
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* 3. BLOQUE INFORMATIVO DE SEGURIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Info size={18}/> Motor de Integridad
          </h4>
          <ul className="space-y-2 text-xs text-blue-800/70 font-medium">
              <li>• Procesamiento por lotes (Chunks de 100) para evitar saturación.</li>
              <li>• Sanitización XSS automática en cada campo de texto.</li>
              <li>• Normalización de tipos de documento (CC, TI, CE, etc).</li>
          </ul>
        </div>

        <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50">
          <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
              <AlertCircle size={18}/> Reglas de Actualización
          </h4>
          <ul className="space-y-2 text-xs text-amber-800/70 font-medium">
              <li>• No se crean pacientes duplicados (identificación única).</li>
              <li>• La prioridad de estados impide retrocesos en la gestión.</li>
              <li>• Los errores de fila se omiten sin detener la carga global.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Sub-componente de ayuda visual
function ColumnItem({ label, required }: { label: string, required?: boolean }) {
    return (
        <div className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
            {required ? (
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0"/>
            ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 flex-shrink-0" />
            )}
            <span className={required ? "font-bold text-slate-700" : "text-slate-400"}>
                {label}
            </span>
        </div>
    );
}