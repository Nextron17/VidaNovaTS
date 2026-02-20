"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  Plus, X, CheckCircle2, Clock, Loader2,
  Stethoscope, Activity, FileText, ChevronRight, Search, MapPin,
  Phone, Mail, Filter, Zap, Target
} from "lucide-react";
import api from "@/src/app/services/api";
import axios from "axios"; 

// --- TIPOS ---
type EventType = 'CONSULTA' | 'QUIMIOTERAPIA' | 'RADIOTERAPIA' | 'CIRUGIA' | 'IMAGEN' | 'LABORATORIO' | 'OTROS';
type EventStatus = 'REALIZADO' | 'PENDIENTE' | 'AGENDADO' | 'CANCELADO';

interface CalendarEvent {
    id: string;
    title: string;
    start: string | Date;
    end?: string | Date;
    allDay?: boolean;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    classNames?: string[];
    color?: string; 
    extendedProps: {
        type: EventType;
        patientId?: string;
        patientName?: string;
        serviceName?: string;
        status: EventStatus;
        description?: string;
        cups?: string;
        eps?: string;
        phone?: string;
        email?: string;
    };
}

// --- ESTILOS (TEMA AZUL / ADMIN) ---
const EVENT_STYLES: { [key: string]: { bg: string, border: string, text: string, icon: any, label: string, hex: string } } = {
    'CONSULTA':      { bg: 'bg-blue-50',      border: 'border-blue-600',    text: 'text-blue-800',    icon: Stethoscope, label: 'Consulta',      hex: '#2563eb' }, 
    'QUIMIOTERAPIA': { bg: 'bg-indigo-50',    border: 'border-indigo-600',  text: 'text-indigo-800',  icon: Activity,    label: 'Quimioterapia', hex: '#4f46e5' }, 
    'RADIOTERAPIA':  { bg: 'bg-violet-50',    border: 'border-violet-600',  text: 'text-violet-800',  icon: Zap,         label: 'Radioterapia',  hex: '#7c3aed' },   
    'CIRUGIA':       { bg: 'bg-rose-50',      border: 'border-rose-600',    text: 'text-rose-800',    icon: Activity,    label: 'Cirugía',       hex: '#e11d48' },          
    'IMAGEN':        { bg: 'bg-cyan-50',      border: 'border-cyan-600',    text: 'text-cyan-800',    icon: FileText,    label: 'Imágenes',      hex: '#0891b2' },           
    'LABORATORIO':   { bg: 'bg-sky-50',       border: 'border-sky-600',     text: 'text-sky-800',     icon: FileText,    label: 'Laboratorio',   hex: '#0ea5e9' },   
    'OTROS':         { bg: 'bg-slate-50',     border: 'border-slate-600',   text: 'text-slate-800',   icon: CalendarIcon,label: 'Otros',         hex: '#64748b' }                
};

const STATUS_STYLES: { [key in EventStatus]: { color: string, bg: string, icon: any, label: string } } = {
    'REALIZADO': { color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2, label: 'Realizado' },
    'PENDIENTE': { color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock, label: 'Pendiente' },
    'AGENDADO': { color: 'text-indigo-600', bg: 'bg-indigo-100', icon: CalendarIcon, label: 'Agendado' },
    'CANCELADO': { color: 'text-rose-600', bg: 'bg-rose-100', icon: X, label: 'Cancelado' }
};

export default function AgendaAtencionPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Estado de datos
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [selectedTypes, setSelectedTypes] = useState<string[]>(Object.keys(EVENT_STYLES));
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // UI
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 🛡️ CONTROLADORES PARA EVITAR CONGELAMIENTO (Refs)
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedRange = useRef({ start: '', end: '' }); // Evita peticiones repetidas

  useEffect(() => { setIsClient(true); }, []);

  // Debounce para el input de búsqueda
  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- ⚡ FUNCIÓN DE CARGA SEGURA ---
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    const startStr = start.toISOString();
    const endStr = end.toISOString();

    // 1. Evitar llamar si es el mismo rango que ya tenemos cargado
    if (lastFetchedRange.current.start === startStr && lastFetchedRange.current.end === endStr) {
        return; 
    }

    // 2. Cancelar petición anterior si existe
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);

    try {
        const res = await api.get('/navegacion/patients', {
            params: {
                page: 1, limit: 1500, 
                startDate: startStr, 
                endDate: endStr
            },
            signal: controller.signal
        });

        if (res.data.success) {
            setRawEvents(res.data.data || []);
            // Guardamos el rango solo si fue exitoso
            lastFetchedRange.current = { start: startStr, end: endStr };
        }
    } catch (error: any) { 
        // 3. Silenciar TOTALMENTE los errores de cancelación
        if (axios.isCancel(error) || error.message === 'canceled' || error.name === 'CanceledError') {
            return;
        }
        console.error("Error fetching events:", error); 
    } finally { 
        if (abortControllerRef.current === controller) {
            setLoading(false); 
        }
    }
  }, []);

  // --- 🛡️ MANEJADOR DEL CALENDARIO CON RETRASO (DEBOUNCE) ---
  const handleDatesSet = useCallback((dateInfo: any) => {
      // Si hay una petición pendiente de salir, la cancelamos (esperamos a que el usuario deje de scrollear)
      if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
      }

      // Esperamos 500ms antes de llamar a la API para evitar el bucle infinito
      fetchTimeoutRef.current = setTimeout(() => {
          fetchEvents(dateInfo.start, dateInfo.end);
      }, 500); 
  }, [fetchEvents]);

  // --- PROCESAMIENTO MEMOIZADO (Rápido) ---
  const processedEvents = useMemo(() => {
      const allEvents: any[] = [];
      const lowerSearch = debouncedSearch.toLowerCase();

      rawEvents.forEach((p: any) => {
          if (!p.followups?.length) return;

          p.followups.forEach((f: any) => {
              let typeKey = (f.category || 'OTROS').toUpperCase().trim();
              if (typeKey.includes('IMAGEN')) typeKey = 'IMAGEN';
              else if (typeKey.includes('QUIMIO')) typeKey = 'QUIMIOTERAPIA';
              else if (typeKey.includes('RADIO')) typeKey = 'RADIOTERAPIA';
              else if (typeKey.includes('CIRUGIA')) typeKey = 'CIRUGIA';
              else if (typeKey.includes('LAB')) typeKey = 'LABORATORIO';
              if (!EVENT_STYLES[typeKey]) typeKey = 'OTROS';

              if (!selectedTypes.includes(typeKey)) return;

              const eventDate = f.dateAppointment || f.dateRequest;
              if (!eventDate) return;

              const serviceName = f.serviceName || f.cups || 'Trámite de Navegación';
              const patientName = `${p.firstName} ${p.lastName}`;

              if (debouncedSearch && 
                  !patientName.toLowerCase().includes(lowerSearch) && 
                  !serviceName.toLowerCase().includes(lowerSearch)) {
                  return;
              }

              const style = EVENT_STYLES[typeKey];
              const dateObj = new Date(eventDate);
              const isAllDay = dateObj.getHours() === 0 && dateObj.getMinutes() === 0;
              const endDateObj = new Date(dateObj);
              endDateObj.setMinutes(dateObj.getMinutes() + 45); 

              allEvents.push({
                  id: f.id.toString(),
                  title: patientName,
                  start: eventDate,
                  end: isAllDay ? undefined : endDateObj.toISOString(),
                  allDay: isAllDay,
                  backgroundColor: 'transparent', 
                  borderColor: 'transparent',
                  textColor: '#1e3a8a', // Texto Azul Oscuro
                  color: style.hex,
                  extendedProps: {
                      type: typeKey,
                      patientId: p.id,
                      patientName: patientName,
                      serviceName: serviceName,
                      status: (f.status || 'PENDIENTE'),
                      description: f.observation,
                      cups: f.cups,
                      eps: p.insurance,
                      phone: p.phone,
                      email: p.email
                  }
              });
          });
      });
      return allEvents;
  }, [rawEvents, selectedTypes, debouncedSearch]);

  const toggleType = (type: string) => {
      setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleEventClick = useCallback((info: any) => {
    info.jsEvent.preventDefault();
    setSelectedEvent({
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        backgroundColor: info.event.backgroundColor,
        borderColor: info.event.borderColor,
        textColor: info.event.textColor,
        extendedProps: info.event.extendedProps
    });
    setIsDetailOpen(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="flex w-full h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR (AZUL) ================= */}
      <aside className="hidden md:flex w-80 bg-white border-r border-slate-200 flex-col shrink-0 z-20 shadow-lg h-full">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-blue-600/5">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-xl shadow-blue-200">
                <CalendarIcon size={22} strokeWidth={2.5}/>
            </div>
            <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Mi Agenda</h1>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Modo Operativo</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar en agenda..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-2xl">
                <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={12}/> Rendimiento de Hoy
                </h3>
                <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-black">{processedEvents.length}</span>
                    <span className="text-xs font-bold text-slate-400">Total citas</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[65%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                    <span><Filter size={12} className="inline mr-1"/> Categorías</span>
                    <button onClick={() => setSelectedTypes(Object.keys(EVENT_STYLES))} className="text-blue-600 hover:underline">Ver todas</button>
                </h3>
                <div className="flex flex-col gap-2">
                    {Object.keys(EVENT_STYLES).map((type) => {
                        const isActive = selectedTypes.includes(type);
                        const style = EVENT_STYLES[type];
                        return (
                            <button
                                key={type}
                                onClick={() => toggleType(type)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black border transition-all duration-200 w-full text-left group ${isActive ? `bg-white border-slate-200 text-slate-700 shadow-md` : 'bg-transparent border-transparent text-slate-400 hover:bg-blue-50/50'}`}
                            >
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-4 ring-slate-50 transition-transform" style={{ backgroundColor: style.hex }}></div>
                                <span className="flex-1 uppercase tracking-tight">{style.label}</span>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button 
                onClick={() => router.push('/navegacion/atencion/directorio')}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
                <Plus size={18}/> Agendar Paciente
            </button>
        </div>
      </aside>

      {/* ================= ÁREA DE CALENDARIO ================= */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-white">
        {loading && (
            <div className="absolute top-6 right-6 z-50 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 pointer-events-none">
                <Loader2 className="animate-spin text-blue-600" size={18}/>
                <span className="text-xs font-black text-slate-900 tracking-widest uppercase">Sincronizando...</span>
            </div>
        )}

        <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden p-2">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    datesSet={handleDatesSet} // ⚠️ AQUI ESTÁ LA CLAVE DEL ANTI-CONGELAMIENTO
                    events={processedEvents} 
                    eventClick={handleEventClick}
                    height="100%"
                    dayMaxEvents={3} 
                    slotMinTime="06:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    navLinks={true}
                    eventDisplay="block"
                    
                    eventContent={(eventInfo) => {
                        const type = eventInfo.event.extendedProps.type;
                        const style = EVENT_STYLES[type] || EVENT_STYLES['OTROS'];
                        
                        if (eventInfo.view.type === 'listWeek') {
                             return (
                                <div className="flex flex-col py-1">
                                    <span className="font-black text-slate-800 uppercase text-[11px]">{eventInfo.event.title}</span>
                                    <span className="text-[10px] font-bold text-blue-600">{eventInfo.event.extendedProps.serviceName}</span>
                                </div>
                             );
                        }

                        return (
                            <div className={`w-full h-full px-2 py-1.5 flex flex-col justify-center ${style.bg} border-l-[4px] ${style.border} hover:scale-[1.02] transition-all cursor-pointer rounded-r-xl overflow-hidden shadow-sm`}>
                                <div className="flex items-center justify-between gap-1 leading-none mb-0.5">
                                    <span className={`text-[8px] font-black ${style.text} bg-white/60 px-1.5 py-0.5 rounded-lg uppercase`}>
                                        {eventInfo.timeText}
                                    </span>
                                </div>
                                <div className={`text-[10px] font-black ${style.text} truncate uppercase tracking-tighter`}>
                                    {eventInfo.event.title}
                                </div>
                                <div className={`text-[8px] font-bold text-slate-500 truncate`}>
                                    {eventInfo.event.extendedProps.serviceName}
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
      </main>

      {/* ================= MODAL DETALLE ================= */}
      {isDetailOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity animate-in fade-in" 
                onClick={() => setIsDetailOpen(false)}
              ></div>

              <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-blue-100">
                  <div className={`p-8 border-b border-slate-100 shrink-0 ${EVENT_STYLES[selectedEvent.extendedProps.type].bg}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border ${EVENT_STYLES[selectedEvent.extendedProps.type].border.replace('border-', 'text-')} shadow-sm`}>
                            {React.createElement(EVENT_STYLES[selectedEvent.extendedProps.type].icon, { size: 14 })}
                            {selectedEvent.extendedProps.type}
                        </span>
                        <button onClick={() => setIsDetailOpen(false)} className="p-2 bg-white/80 hover:bg-white rounded-full transition-all text-slate-400 hover:text-rose-500 shadow-sm"><X size={20}/></button>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                          {selectedEvent.extendedProps.patientName}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 text-blue-700 text-xs font-black uppercase">
                          <MapPin size={12}/> {selectedEvent.extendedProps.eps || 'PARTICULAR'}
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 rounded-[2rem] border border-slate-100 bg-slate-50 shadow-inner">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Agenda</span>
                              <div className="flex items-center gap-2 font-black text-slate-700 text-xs uppercase">
                                  <Clock size={16} className="text-blue-500"/>
                                  {new Date(selectedEvent.start).toLocaleString()}
                              </div>
                          </div>
                          <div className={`p-5 rounded-[2rem] border ${STATUS_STYLES[selectedEvent.extendedProps.status as EventStatus].bg.replace('100', '200')} ${STATUS_STYLES[selectedEvent.extendedProps.status as EventStatus].bg} shadow-inner`}>
                              <span className="block text-[9px] font-black opacity-60 uppercase tracking-widest mb-2">Estado</span>
                              <div className={`flex items-center gap-2 font-black text-xs uppercase ${STATUS_STYLES[selectedEvent.extendedProps.status as EventStatus].color}`}>
                                  {React.createElement(STATUS_STYLES[selectedEvent.extendedProps.status as EventStatus].icon, { size: 16 })}
                                  {STATUS_STYLES[selectedEvent.extendedProps.status as EventStatus].label}
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Datos del Procedimiento</label>
                          <div className="p-6 rounded-[2.5rem] border border-blue-100 bg-blue-50/20 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500"><Activity size={64}/></div>
                              <p className="font-black text-blue-900 text-base leading-tight uppercase relative z-10">
                                  {selectedEvent.extendedProps.serviceName}
                              </p>
                              {selectedEvent.extendedProps.cups && (
                                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-mono font-black text-blue-600">
                                      CUPS: {selectedEvent.extendedProps.cups}
                                  </div>
                              )}
                          </div>
                      </div>

                      {(selectedEvent.extendedProps.phone || selectedEvent.extendedProps.email) && (
                          <div className="space-y-4">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Contacto de Paciente</label>
                              <div className="grid grid-cols-1 gap-2">
                                  {selectedEvent.extendedProps.phone && (
                                      <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group">
                                          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all"><Phone size={18}/></div>
                                          <div>
                                              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest">Móvil</span>
                                              <span className="block text-sm font-black text-slate-800">{selectedEvent.extendedProps.phone}</span>
                                          </div>
                                      </div>
                                  )}
                                  {selectedEvent.extendedProps.email && (
                                      <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group">
                                          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm"><Mail size={18}/></div>
                                          <div className="min-w-0 flex-1">
                                              <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest">Email</span>
                                              <span className="block text-sm font-black text-slate-800 truncate">{selectedEvent.extendedProps.email}</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {selectedEvent.extendedProps.description && (
                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Observaciones</label>
                              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 text-slate-600 text-sm italic relative">
                                  <span className="absolute top-3 left-3 text-amber-200 text-5xl font-serif leading-none">“</span>
                                  <p className="relative z-10 pl-4 pt-2">{selectedEvent.extendedProps.description}</p>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
                      <button 
                          onClick={() => router.push(`/navegacion/atencion/casos/${selectedEvent.extendedProps.patientId}`)}
                          className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-blue-600 transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                      >
                          <span>Ir al Expediente Clínico</span>
                          <ChevronRight size={18}/>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ESTILOS GLOBALES - TEMA AZUL */}
      <style jsx global>{`
        .fc { height: 100%; width: 100%; font-family: inherit; border: none !important; }
        .fc-header-toolbar { margin-bottom: 2rem !important; padding: 1rem 1rem 0 1rem; }
        .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 900 !important; color: #1e3a8a; text-transform: capitalize; letter-spacing: -0.05em; }
        .fc-button { border-radius: 1rem !important; font-weight: 800 !important; text-transform: uppercase !important; padding: 0.6rem 1.2rem !important; font-size: 0.7rem !important; border: 1px solid #f1f5f9 !important; background: white !important; color: #64748b !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 0.05em; }
        .fc-button:hover { background: #f8fafc !important; color: #1e3a8a !important; transform: translateY(-2px); shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .fc-button-active { background: #1e3a8a !important; border-color: #1e3a8a !important; color: white !important; shadow: 0 10px 20px -5px rgba(30, 58, 138, 0.4) !important; }
        .fc-col-header-cell { padding: 16px 0 !important; background: transparent !important; border: 0 !important; }
        .fc-col-header-cell-cushion { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #94a3b8; text-decoration: none !important; letter-spacing: 0.15em; }
        .fc-daygrid-day { border: 1px solid #f8fafc !important; transition: all 0.2s ease; }
        .fc-day-today { background-color: #eff6ff !important; }
        .fc-day-today .fc-daygrid-day-number { background-color: #2563eb; color: white; border-radius: 12px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; shadow: 0 4px 10px rgba(37, 99, 235, 0.3); }
        .fc-daygrid-day-number { font-size: 0.8rem; font-weight: 800; color: #64748b; padding: 12px !important; text-decoration: none !important; }
        .fc-event { border: none !important; background: transparent !important; margin: 2px 4px !important; }
        .fc-list-event:hover td { background-color: #f0fdf4 !important; cursor: pointer; }
        .fc-list-day-cushion { background-color: #f8fafc !important; font-weight: 900 !important; font-size: 0.7rem !important; text-transform: uppercase !important; color: #64748b !important; letter-spacing: 0.1em; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2563eb/20; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2563eb/40; }
      `}</style>

    </div>
  );
}