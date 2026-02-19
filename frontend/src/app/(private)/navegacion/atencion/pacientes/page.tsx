"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link"; 
import { 
  Search, Plus, ChevronLeft, ChevronRight, 
  Users, FileSpreadsheet, Phone, MapPin, 
  Activity, BadgeCheck, RefreshCw, AlertCircle,
  ChevronRight as ChevronIcon
} from "lucide-react";
import api from "@/src/app/services/api";
import axios from "axios";

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

export default function PacientesAtencionPage() {
  // --- ESTADOS ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- FETCH DE DATOS ---
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

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
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        return;
      }
      console.error("Error fetching patients:", err);
      setError("Error de conexión con el servidor central.");
      setPatients([]);
    } finally {
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

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Directorio</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            Base de datos operativa
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">{totalRecords} Pacientes</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/navegacion/atencion/importar" className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm">
            <FileSpreadsheet size={18}/><span className="hidden sm:inline">Importar Excel</span>
          </Link>
          
          <Link 
            href="/navegacion/atencion/nuevo" 
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
          >
            <Plus size={18}/><span>Registrar Paciente</span>
          </Link>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="sticky top-4 z-30 mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-300">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20}/>
            <input 
              type="text" 
              placeholder="Buscar por nombre, cédula, EPS o ubicación..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-700 font-bold outline-none placeholder:font-medium placeholder:text-slate-400" 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                ✕
              </button>
            )}
          </div>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <button 
            onClick={fetchPatients} 
            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors hidden md:block"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm">
          <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4"><AlertCircle size={32}/></div>
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Error de servidor</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={fetchPatients} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all">
            Reintentar
          </button>
        </div>
      ) : loading && patients.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 h-52 animate-pulse flex flex-col justify-between shadow-sm">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
                <div className="flex-1 space-y-3 mt-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2.5 bg-slate-50 rounded w-full"></div>
                <div className="h-2.5 bg-slate-50 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 shadow-inner">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Users size={40}/>
            </div>
            {searchTerm ? (
              <>
                <h3 className="text-xl font-bold text-slate-800">Sin hallazgos para "{searchTerm}"</h3>
                <p className="text-slate-400 font-medium mb-6">Verifica el dato ingresado o intenta con otro campo.</p>
                <button onClick={() => setSearchTerm('')} className="text-emerald-600 font-bold hover:underline uppercase text-xs tracking-widest">
                  Limpiar Búsqueda
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Directorio Vacío</h3>
                <p className="text-slate-400 font-medium mb-6">Aún no se han registrado pacientes en el módulo operativo.</p>
                <Link href="/navegacion/atencion/nuevo" className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200">
                  Iniciar Registro
                </Link>
              </>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {patients.map((patient) => (
            <Link 
              key={patient.id} 
              href={`/navegacion/atencion/pacientes/perfil?id=${patient.id}`} 
              className="group bg-white rounded-[2rem] p-7 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-500 relative overflow-hidden block"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 overflow-hidden">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg transition-transform group-hover:scale-105 ${
                    patient.status === 'INACTIVO' ? 'bg-slate-400' : 
                    patient.status === 'FALLECIDO' ? 'bg-slate-900' : 
                    'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {patient.firstName ? patient.firstName.charAt(0) : 'P'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-lg leading-tight truncate group-hover:text-emerald-700 transition-colors uppercase" title={`${patient.firstName} ${patient.lastName}`}>
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 tracking-tighter font-mono">
                          {patient.documentType} {patient.documentNumber}
                        </span>
                        {patient.status === 'ACTIVO' && <BadgeCheck size={14} className="text-emerald-500" fill="currentColor" color="white"/>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-tight">
                  <Activity size={16} className="text-emerald-500 shrink-0"/>
                  <span className="truncate flex-1" title={patient.insurance}>
                    {patient.insurance || 'Sin aseguradora'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                  <Phone size={16} className="text-emerald-400 shrink-0"/>
                  <span className="truncate flex-1" title={patient.phone}>
                    {formatPhone(patient.phone)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase tracking-tight">
                  <MapPin size={16} className="text-emerald-300 shrink-0"/>
                  <span className="truncate flex-1">
                    {[patient.city, patient.department].filter(Boolean).join(', ') || 'Sin ubicación'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    patient.status === 'ACTIVO' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {patient.stage || 'EN SEGUIMIENTO'}
                  </span>
                </div>
                
                <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 uppercase tracking-widest">
                  Gestionar <ChevronIcon size={14}/>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* PAGINACIÓN */}
      {patients.length > 0 && (
        <div className="flex justify-between items-center pt-8 border-t border-slate-200">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Página <span className="text-emerald-600">{page}</span> de {totalPages}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="p-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-white hover:border-emerald-200 hover:text-emerald-600 hover:shadow-xl hover:shadow-emerald-900/5 disabled:opacity-30 disabled:hover:shadow-none transition-all"
            >
              <ChevronLeft size={20}/>
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0} 
              className="p-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-white hover:border-emerald-200 hover:text-emerald-600 hover:shadow-xl hover:shadow-emerald-900/5 disabled:opacity-30 disabled:hover:shadow-none transition-all"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}