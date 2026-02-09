"use client";

import React, { useState } from "react";
import { Database, Loader2, DownloadCloud } from "lucide-react";
import api from "@/src/app/services/api";

interface DownloadBackupItemProps {
  collapsed?: boolean; // Opcional: si tu sidebar se colapsa
}

export default function DownloadBackupItem({ collapsed = false }: DownloadBackupItemProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return; // Evitar doble clic
    
    try {
      setLoading(true);
      
      // 1. Petición al backend (Blob = Archivo binario)
      const response = await api.get('/backup/download', {
        responseType: 'blob', 
      });

      // 2. Crear URL temporal
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 3. Nombre del archivo con fecha
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Vidanova_Full_Backup_${date}.xlsx`);
      
      // 4. Forzar descarga
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error descargando backup:", error);
      alert("Error al generar la copia de seguridad. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        text-slate-400 hover:text-white hover:bg-slate-800
        ${loading ? "cursor-wait opacity-70" : "cursor-pointer"}
      `}
      title="Descargar copia completa de la base de datos"
    >
      {/* ÍCONO: Cambia a Spinner si está cargando */}
      <div className="flex-shrink-0 transition-transform group-hover:scale-110">
        {loading ? (
          <Loader2 size={20} className="animate-spin text-blue-400" />
        ) : (
          <Database size={20} className="group-hover:text-emerald-400 transition-colors" />
        )}
      </div>

      {/* TEXTO: Se oculta si el sidebar está colapsado (opcional) */}
      {!collapsed && (
        <div className="flex flex-col items-start text-sm font-medium">
          <span className="group-hover:translate-x-1 transition-transform">
            {loading ? "Generando Excel..." : "Base de Datos"}
          </span>
          {/* Pequeña etiqueta extra */}
          {!loading && (
            <span className="text-[9px] uppercase tracking-widest text-slate-600 group-hover:text-emerald-500/80">
              Descargar Todo
            </span>
          )}
        </div>
      )}
      
      {/* Indicador visual extra si está descargando */}
      {!collapsed && loading && (
        <DownloadCloud size={14} className="ml-auto text-blue-500 animate-bounce" />
      )}
    </button>
  );
}