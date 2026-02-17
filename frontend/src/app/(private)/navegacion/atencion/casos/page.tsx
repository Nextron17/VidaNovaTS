"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Plus, 
  CalendarCheck, 
  MessageSquare, 
  RefreshCcw, 
  AlertTriangle,
  Clock,
  ChevronRight,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';

// --- Tipado Estricto para la API ---
type CaseStatus = 'Abierto' | 'En Progreso' | 'Cita Programada' | 'Resuelto' | 'Cerrado';
type Priority = 'Baja' | 'Media' | 'Alta' | 'Urgente';

interface SupportCase {
  id: string;
  ticketId: string;
  subject: string;
  customer: {
    name: string;
    email: string;
  };
  status: CaseStatus;
  priority: Priority;
  updatedAt: string;
  category: string;
}

export default function CasosPage() {
  const router = useRouter();

  // --- Estados de Datos y Control ---
  const [casos, setCasos] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // --- Lógica de Conexión con la API ---
  // He encapsulado la petición en useCallback para permitir re-llamadas (refresh)
  const fetchCasos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulación de llamada a API Real
      // En producción sería: const res = await fetch('/api/v1/cases');
      const response = await new Promise<SupportCase[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: '881',
              ticketId: 'TK-2026-001',
              subject: 'Intermitencia en servicio de fibra',
              customer: { name: 'Roberto Gómez', email: 'r.gomez@mail.com' },
              status: 'Abierto',
              priority: 'Alta',
              updatedAt: new Date().toISOString(),
              category: 'Soporte Técnico'
            },
            {
              id: '882',
              ticketId: 'TK-2026-002',
              subject: 'Error en cargo de factura mensual',
              customer: { name: 'Lucia Fernández', email: 'lucia.f@empresa.com' },
              status: 'En Progreso',
              priority: 'Media',
              updatedAt: new Date().toISOString(),
              category: 'Facturación'
            },
            {
              id: '883',
              ticketId: 'TK-2026-003',
              subject: 'Traslado de equipo a nueva oficina',
              customer: { name: 'Andrés Castro', email: 'a.castro@startup.io' },
              status: 'Cita Programada',
              priority: 'Urgente',
              updatedAt: new Date().toISOString(),
              category: 'Operaciones'
            }
          ]);
        }, 1200);
      });

      setCasos(response);
    } catch (err) {
      setError('No se pudo sincronizar con el servidor de atención.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  // --- Lógica de Filtrado Local (Client Side Search) ---
  const filteredData = casos.filter(item => {
    const matchesSearch = 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- Helpers Visuales ---
  const getStatusBadge = (status: CaseStatus) => {
    const styles = {
      'Abierto': 'bg-blue-50 text-blue-700 border-blue-200',
      'En Progreso': 'bg-amber-50 text-amber-700 border-amber-200',
      'Cita Programada': 'bg-purple-50 text-purple-700 border-purple-200',
      'Resuelto': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Cerrado': 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return styles[status] || styles['Abierto'];
  };

  // --- Renderizado Condicional de Estados de API ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando APIs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-lg font-bold text-red-900">Error de Conexión</h2>
          <p className="text-red-700 text-sm mt-2">{error}</p>
          <button 
            onClick={fetchCasos}
            className="mt-6 flex items-center justify-center gap-2 w-full bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            <RefreshCcw size={18} /> Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Conectado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Mis Casos</h1>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase">Live API</span>
          </div>
          <p className="text-slate-500 font-medium">Gestiona solicitudes de soporte y coordina citas técnicas en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchCasos}
            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            title="Refrescar Datos"
          >
            <RefreshCcw size={20} />
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            <Plus size={20} /> Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por asunto, ID de ticket o cliente..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select 
            className="bg-slate-50 border border-transparent px-4 py-3 rounded-xl font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Abierto">Abiertos</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Cita Programada">Citas Agendadas</option>
            <option value="Resuelto">Resueltos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Datos Gorda */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-400 text-xs uppercase tracking-widest">
                <th className="px-8 py-5">Detalle del Caso</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Estado / Prioridad</th>
                <th className="px-8 py-5 text-right">Acción de Cita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item) => (
                <tr key={item.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-500 uppercase mb-1">{item.ticketId}</span>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{item.subject}</span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">{item.category}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} /> Actualizado hoy
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black text-xs border border-indigo-200 shadow-sm">
                        {item.customer.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{item.customer.name}</span>
                        <span className="text-[11px] text-slate-400">{item.customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <div className={`w-2 h-2 rounded-full ${item.priority === 'Urgente' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                        Prioridad {item.priority}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* CONEXIÓN CON AGENDAMIENTO: Enviamos el ID por URL */}
                      <button 
                        onClick={() => router.push(`/navegacion/atencion/agendamiento?caseId=${item.id}`)}
                        className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-700 hover:border-indigo-600 hover:text-indigo-600 shadow-sm transition-all group/btn"
                      >
                        <CalendarCheck size={16} className="text-slate-400 group-hover/btn:text-indigo-600" />
                        AGENDAR
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="py-24 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No hay resultados</h3>
              <p className="text-slate-500 text-sm">Prueba con otros filtros o términos de búsqueda.</p>
            </div>
          )}
        </div>

        {/* Footer Gorda de Paginación */}
        <div className="bg-slate-50/80 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Visualizando {filteredData.length} registros de la API
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter cursor-not-allowed">Anterior</button>
            <div className="flex gap-1">
              {[1].map(n => (
                <button key={n} className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold">{n}</button>
              ))}
            </div>
            <button className="px-4 py-2 text-[10px] font-black text-indigo-600 uppercase tracking-tighter hover:bg-indigo-50 rounded-lg transition-all">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}