"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link"; 
import { 
  Search, Plus, Filter, ChevronLeft, ChevronRight, 
  Users, FileSpreadsheet, Phone, MapPin, 
  Activity, BadgeCheck, Trash2, RefreshCw, AlertCircle
} from "lucide-react";
import api from "@/src/app/services/api";
import axios from "axios"; // ✅ 1. IMPORTAR AXIOS AQUÍ

// --- TIPOS DE DATOS ---
interface Patient {
  id: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  insurance?: string;
  city?: string;
  department?: string;
  status: 'ACTIVO' | 'INACTIVO' | 'FALLECIDO';
  stage?: string;
  updatedAt?: string;
}

// --- UTILS ---
const formatPhone = (phone: string | null | undefined) => {
  const str = String(phone || "").trim();
  if (!str || str.length < 5) return 'Sin contacto';
  
  let raw = str.replace(/[^0-9+]/g, '');
  if (str.includes('/') || str.includes('-')) return str;
  
  const regex = /(?:(?:\+?57)?3\d{9})|(?:\d{7,10})/g;
  const matches = raw.match(regex);
  
  if (!matches) return str; 
  const cleanNumbers = matches.map(num => num.replace(/^(\+?57)/, ''));
  return [...new Set(cleanNumbers)].join(' / ');
};

export default function PacientesPage() {
  // --- ESTADOS ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Referencia para cancelar peticiones anteriores
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- FETCH DE DATOS ROBUSTO ---
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await api.get(`/patients`, {
        params: { page, limit: 12, search: searchTerm },
        signal: controller.signal
      });
      
      const lista = res.data.patients || res.data.data || []; 
      setPatients(Array.isArray(lista) ? lista : []);
      
      setTotalPages(res.data.totalPages || res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.total || res.data.pagination?.total || 0);

    } catch (err: any) {
      // ✅ 2. CORRECCIÓN AQUÍ: Usar axios.isCancel en lugar de api.isCancel
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        return; // Ignorar errores por cancelación manual
      }
      console.error("Error fetching patients:", err);
      setError("No se pudo conectar con el servidor. Intenta nuevamente.");
      setPatients([]);
    } finally {
      // Solo quitamos el loading si la petición no fue cancelada
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 400); 
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!confirm(`⚠️ ELIMINAR PACIENTE\n\n¿Estás seguro de eliminar a ${name}?\nSe borrará todo su historial clínico.\n\nEsta acción NO se puede deshacer.`)) {
        return;
    }

    try {
        await api.delete(`/patients/${id}`);
        fetchPatients(); 
    } catch (error) {
        alert("❌ Error al eliminar. Verifica que el paciente no tenga citas activas.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Pacientes</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            Base de datos clínica
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold">{totalRecords} registros</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/navegacion/admin/importar" className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <FileSpreadsheet size={18}/><span className="hidden sm:inline">Importar Excel</span>
          </Link>
          
          <Link 
            href="/navegacion/admin/pacientes/nuevo" 
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
          >
            <Plus size={18}/><span>Nuevo Paciente</span>
          </Link>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="sticky top-4 z-30 mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
            <input 
              type="text" 
              placeholder="Buscar por nombre, cédula, EPS o ciudad..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-700 font-bold outline-none placeholder:font-medium placeholder:text-slate-400" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <span className="sr-only">Borrar</span>✕
              </button>
            )}
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <button 
            onClick={fetchPatients} 
            title="Recargar lista"
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors hidden md:block"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-red-100">
          <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4"><AlertCircle size={32}/></div>
          <h3 className="text-lg font-bold text-slate-800">Ocurrió un error</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={fetchPatients} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all">
            Reintentar
          </button>
        </div>
      ) : loading && patients.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 h-48 animate-pulse flex flex-col justify-between">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-50 rounded w-full"></div>
                <div className="h-3 bg-slate-50 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Users size={40}/>
            </div>
            {searchTerm ? (
              <>
                <h3 className="text-xl font-bold text-slate-800">Sin resultados para "{searchTerm}"</h3>
                <p className="text-slate-400 font-medium mb-6">Verifica la ortografía o intenta con la cédula.</p>
                <button onClick={() => setSearchTerm('')} className="text-blue-600 font-bold hover:underline">
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-800">Aún no hay pacientes</h3>
                <p className="text-slate-400 font-medium mb-6">Comienza creando la primera historia clínica.</p>
                <Link href="/navegacion/admin/pacientes/nuevo" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all">
                  Crear Primer Paciente
                </Link>
              </>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {patients.map((patient) => (
            <Link 
              key={patient.id} 
              href={`/navegacion/admin/pacientes/perfil?id=${patient.id}`} 
              className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-100 transition-all duration-300 relative overflow-hidden block"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 overflow-hidden">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md transition-transform group-hover:scale-105 ${
                    patient.status === 'INACTIVO' ? 'bg-slate-400' : 
                    patient.status === 'FALLECIDO' ? 'bg-slate-800' : 
                    'bg-gradient-to-br from-blue-600 to-indigo-600'
                  }`}>
                    {patient.firstName ? patient.firstName.charAt(0) : 'P'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-blue-700 transition-colors" title={`${patient.firstName} ${patient.lastName}`}>
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 tracking-wide font-mono">
                          {patient.documentType} {patient.documentNumber}
                        </span>
                        {patient.status === 'ACTIVO' && <BadgeCheck size={14} className="text-blue-500" fill="currentColor" color="white"/>}
                    </div>
                  </div>
                </div>
                
                <button 
                    onClick={(e) => handleDelete(e, patient.id, patient.firstName)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar Paciente"
                >
                    <Trash2 size={18}/>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Activity size={16} className="text-blue-400 shrink-0"/>
                  <span className="font-medium truncate flex-1" title={patient.insurance}>
                    {patient.insurance || 'Sin aseguradora'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-emerald-400 shrink-0"/>
                  <span className="font-medium truncate flex-1" title={patient.phone}>
                    {formatPhone(patient.phone)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-purple-400 shrink-0"/>
                  <span className="font-medium truncate flex-1">
                    {[patient.city, patient.department].filter(Boolean).join(', ') || 'Ubicación pendiente'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    patient.status === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {patient.stage || 'EN SEGUIMIENTO'}
                  </span>
                </div>
                
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  Abrir Historia <ChevronRight size={14}/>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* PAGINACIÓN */}
      {patients.length > 0 && (
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <span className="text-sm font-bold text-slate-400">
            Página <span className="text-slate-800">{page}</span> de {totalPages}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-white hover:shadow-md disabled:opacity-50 disabled:shadow-none disabled:bg-slate-50 transition-all"
            >
              <ChevronLeft size={18}/>
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0} 
              className="p-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-white hover:shadow-md disabled:opacity-50 disabled:shadow-none disabled:bg-slate-50 transition-all"
            >
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}