"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X,
  CheckCircle2,
  Clock,
  Loader2,
  Stethoscope,
  Activity,
  FileText,
  ChevronRight,
  Search,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import api from "@/src/app/services/api";

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

// --- ESTILOS PREMIUM (COLORES POR TIPO) ---
const EVENT_STYLES: { [key: string]: { bg: string, border: string, text: string, icon: any, label: string } } = {
    'CONSULTA': { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', icon: Stethoscope, label: 'Consulta' },       
    'QUIMIOTERAPIA': { bg: 'bg-violet-50', border: 'border-violet-500', text: 'text-violet-700', icon: Activity, label: 'Quimio' }, 
    'RADIOTERAPIA': { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', icon: Activity, label: 'Radio' },   
    'CIRUGIA': { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', icon: Activity, label: 'Cirugía' },          
    'IMAGEN': { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', icon: FileText, label: 'Imagen' },           
    'LABORATORIO': { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', icon: FileText, label: 'Lab' },   
    'OTROS': { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-700', icon: CalendarIcon, label: 'Otro' }                
};

// --- ESTILOS POR ESTADO ---
const STATUS_STYLES: { [key in EventStatus]: { color: string, bg: string, icon: any, label: string } } = {
    'REALIZADO': { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2, label: 'Realizado' },
    'PENDIENTE': { color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock, label: 'Pendiente' },
    'AGENDADO': { color: 'text-blue-600', bg: 'bg-blue-100', icon: CalendarIcon, label: 'Agendado' },
    'CANCELADO': { color: 'text-rose-600', bg: 'bg-rose-100', icon: X, label: 'Cancelado' }
};

export default function AgendaPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // ESTADOS
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(Object.keys(EVENT_STYLES));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { setIsClient(true); }, []);

  // --- CARGA DE DATOS ---
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
        const res = await api.get('/patients', {
            params: {
                page: 1, limit: 1000, // Traemos suficientes para llenar el mes
                startDate: start.toISOString(), 
                endDate: end.toISOString()
            }
        });

        if (res.data.success) {
            const mappedEvents: CalendarEvent[] = [];
            (res.data.data || []).forEach((p: any) => {
                if (p.followups?.length > 0) {
                    p.followups.forEach((f: any) => {
                        // Determinar tipo de evento basado en categoría o nombre
                        let typeKey = (f.category || 'OTROS').toUpperCase().trim();
                        if (typeKey.includes('IMAGEN')) typeKey = 'IMAGEN';
                        if (typeKey.includes('QUIMIO')) typeKey = 'QUIMIOTERAPIA';
                        if (typeKey.includes('RADIO')) typeKey = 'RADIOTERAPIA';
                        if (!EVENT_STYLES[typeKey]) typeKey = 'OTROS';

                        // Priorizar fecha de cita, si no existe usar fecha de solicitud
                        const eventDate = f.dateAppointment ? f.dateAppointment : f.dateRequest;
                        const dateObj = new Date(eventDate);
                        const isAllDay = dateObj.getHours() === 0 && dateObj.getMinutes() === 0;

                        mappedEvents.push({
                            id: f.id.toString(),
                            title: `${p.firstName} ${p.lastName}`,
                            start: eventDate,
                            allDay: isAllDay,
                            backgroundColor: 'white',
                            borderColor: 'transparent',
                            textColor: '#1e293b',
                            classNames: ['shadow-sm', 'border-l-4', 'rounded-md', 'overflow-hidden'],
                            extendedProps: {
                                type: typeKey as EventType,
                                patientId: p.id,
                                patientName: `${p.firstName} ${p.lastName}`,
                                serviceName: f.serviceName,
                                status: (f.status || 'PENDIENTE') as EventStatus,
                                description: f.observation,
                                cups: f.cups,
                                eps: p.insurance,
                                phone: p.phone,
                                email: p.email
                            }
                        });
                    });
                }
            });
            setEvents(mappedEvents);
        }
    } catch (error) { 
        console.error("Error fetching events:", error); 
    } finally { 
        setLoading(false); 
    }
  }, []);

  const handleDatesSet = (dateInfo: any) => {
      setCurrentDate(dateInfo.start); 
      fetchEvents(dateInfo.start, dateInfo.end);
  };

  const filteredEvents = useMemo(() => {
      return events.filter(evt => {
          const matchType = selectedTypes.includes(evt.extendedProps.type);
          const matchSearch = searchTerm === "" || 
                              evt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              evt.extendedProps.serviceName?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchType && matchSearch;
      });
  }, [events, selectedTypes, searchTerm]);

  const toggleType = (type: string) => {
      setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleEventClick = (info: any) => {
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
  };

  if (!isClient) return null;

  return (
    <div className="w-full h-screen bg-[#f8fafc] font-sans text-slate-800 flex overflow-hidden">
      
      {/* ================= SIDEBAR PREMIUM (IZQUIERDA) ================= */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-lg">
        
        {/* LOGO AREA */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20">
                <CalendarIcon size={20} strokeWidth={3}/>
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">Agenda Médica</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* MINI BUSCADOR */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar cita..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* MINI DASHBOARD DEL DÍA */}
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumen del Mes</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center group hover:bg-blue-100 transition-colors cursor-default">
                        <span className="block text-2xl font-black text-blue-700 group-hover:scale-110 transition-transform duration-200">{filteredEvents.length}</span>
                        <span className="text-[10px] font-bold text-blue-600/70 uppercase">Citas</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center group hover:bg-emerald-100 transition-colors cursor-default">
                        <span className="block text-2xl font-black text-emerald-700 group-hover:scale-110 transition-transform duration-200">
                            {filteredEvents.filter(e => e.extendedProps.status === 'REALIZADO').length}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Atendidos</span>
                    </div>
                </div>
            </div>

            {/* FILTROS TIPO "TAGS" */}
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                    Categorías
                    <button onClick={() => setSelectedTypes(Object.keys(EVENT_STYLES))} className="text-[9px] text-blue-600 hover:underline">Ver todas</button>
                </h3>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(EVENT_STYLES).map((type) => {
                        const isActive = selectedTypes.includes(type);
                        const style = EVENT_STYLES[type];
                        return (
                            <button
                                key={type}
                                onClick={() => toggleType(type)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all duration-200
                                    ${isActive 
                                        ? `bg-white border-slate-200 text-slate-700 shadow-sm ring-1 ring-slate-100` 
                                        : 'bg-slate-50 border-transparent text-slate-400 opacity-60 hover:opacity-100'
                                    }
                                `}
                            >
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-current' : 'bg-slate-300'}`} style={{ color: isActive ? style.border.replace('border-', 'text-') : undefined }}></div>
                                {style.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* BOTÓN AGENDAR (FIXED BOTTOM) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button 
                onClick={() => router.push('/navegacion/admin/pacientes')}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
                <Plus size={18}/> Nueva Cita
            </button>
        </div>
      </aside>

      {/* ================= CALENDARIO (DERECHA) ================= */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {loading && (
            <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Loader2 className="animate-spin text-blue-600" size={16}/>
                <span className="text-xs font-bold text-slate-600">Actualizando...</span>
            </div>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-hidden">
            <div className="h-full bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    datesSet={handleDatesSet}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek'
                    }}
                    buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' }}
                    events={filteredEvents}
                    eventClick={handleEventClick}
                    height="100%"
                    dayMaxEvents={3}
                    slotMinTime="07:00:00"
                    slotMaxTime="19:00:00"
                    allDaySlot={false}
                    // 🔥 RENDERIZADO PERSONALIZADO DE EVENTOS
                    eventContent={(eventInfo) => {
                        const type = eventInfo.event.extendedProps.type;
                        const style = EVENT_STYLES[type] || EVENT_STYLES['OTROS'];
                        const borderClass = style.border; 
                        const bgClass = style.bg;
                        const textClass = style.text;

                        return (
                            <div className={`
                                w-full h-full px-2 py-1 flex flex-col justify-center
                                ${bgClass} border-l-[3px] ${borderClass}
                                hover:brightness-95 transition-all cursor-pointer rounded-r-md
                            `}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-[10px] font-bold ${textClass} opacity-80`}>
                                        {eventInfo.timeText}
                                    </span>
                                </div>
                                <div className={`text-xs font-bold ${textClass} truncate leading-tight`}>
                                    {eventInfo.event.title}
                                </div>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
      </main>

      {/* ================= MODAL DETALLE (SLIDE-OVER) ================= */}
      {isDetailOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsDetailOpen(false)}
              ></div>

              {/* Panel Lateral */}
              <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                      <div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide mb-3 ${EVENT_STYLES[selectedEvent.extendedProps.type].bg} ${EVENT_STYLES[selectedEvent.extendedProps.type].text} border ${EVENT_STYLES[selectedEvent.extendedProps.type].border}`}>
                              {React.createElement(EVENT_STYLES[selectedEvent.extendedProps.type].icon, { size: 12 })}
                              {selectedEvent.extendedProps.type}
                          </span>
                          <h2 className="text-xl font-black text-slate-900 leading-tight">
                              {selectedEvent.extendedProps.patientName}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs font-medium">
                              <MapPin size={12}/> {selectedEvent.extendedProps.eps || 'Particular'}
                          </div>
                      </div>
                      <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                          <X size={20}/>
                      </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Estado y Fecha */}
                      <div className="flex gap-4">
                          <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</span>
                              <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                  <Clock size={16} className="text-blue-500"/>
                                  {new Date(selectedEvent.start).toLocaleDateString()}
                              </div>
                          </div>
                          <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado</span>
                              <div className={`flex items-center gap-2 font-bold text-sm ${STATUS_STYLES[selectedEvent.extendedProps.status].color}`}>
                                  {React.createElement(STATUS_STYLES[selectedEvent.extendedProps.status].icon, { size: 16 })}
                                  {STATUS_STYLES[selectedEvent.extendedProps.status].label}
                              </div>
                          </div>
                      </div>

                      {/* Servicio */}
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Procedimiento</label>
                          <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                              <p className="font-bold text-slate-800 text-sm leading-relaxed">
                                  {selectedEvent.extendedProps.serviceName}
                              </p>
                              {selectedEvent.extendedProps.cups && (
                                  <div className="mt-2 inline-block px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500">
                                      CUPS: {selectedEvent.extendedProps.cups}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Contacto */}
                      {(selectedEvent.extendedProps.phone || selectedEvent.extendedProps.email) && (
                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contacto</label>
                              <div className="space-y-2">
                                  {selectedEvent.extendedProps.phone && (
                                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Phone size={14}/></div>
                                          {selectedEvent.extendedProps.phone}
                                      </div>
                                  )}
                                  {selectedEvent.extendedProps.email && (
                                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Mail size={14}/></div>
                                          <span className="truncate">{selectedEvent.extendedProps.email}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* Observaciones */}
                      {selectedEvent.extendedProps.description && (
                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notas Clínicas</label>
                              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-slate-600 text-sm italic relative">
                                  <span className="absolute top-2 left-2 text-amber-200 text-4xl font-serif">“</span>
                                  <p className="relative z-10 pl-2">{selectedEvent.extendedProps.description}</p>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                      <button 
                          onClick={() => router.push(`/navegacion/admin/pacientes/perfil?id=${selectedEvent.extendedProps.patientId}`)}
                          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                          <span>Ver Historia Clínica Completa</span>
                          <ChevronRight size={16}/>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ESTILOS GLOBALES FINOS */}
      <style jsx global>{`
        .fc-header-toolbar { margin-bottom: 1.5rem !important; padding: 0 0.5rem; }
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; color: #0f172a; text-transform: capitalize; }
        .fc-button { border-radius: 0.75rem !important; font-weight: 700 !important; text-transform: capitalize !important; padding: 0.4rem 1rem !important; font-size: 0.85rem !important; }
        .fc-button-primary { background-color: white !important; border-color: #e2e8f0 !important; color: #475569 !important; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
        .fc-button-primary:hover { background-color: #f8fafc !important; border-color: #cbd5e1 !important; color: #1e293b !important; }
        .fc-button-active { background-color: #1e293b !important; border-color: #1e293b !important; color: white !important; }
        
        .fc-col-header-cell { padding: 12px 0 !important; background-color: #fff !important; border: 0 !important; border-bottom: 1px solid #f1f5f9 !important; }
        .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; text-decoration: none !important; letter-spacing: 0.05em; }
        
        .fc-daygrid-day { border: 1px solid #f8fafc !important; }
        .fc-daygrid-day-top { flex-direction: row; padding: 8px; }
        .fc-daygrid-day-number { font-size: 0.75rem; font-weight: 700; color: #64748b; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 99px; transition: all 0.2s; text-decoration: none !important; }
        .fc-day-today { background-color: #f8fafc !important; }
        .fc-day-today .fc-daygrid-day-number { background-color: #2563eb; color: white; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3); }
        
        .fc-event { border: none !important; background: transparent !important; margin-bottom: 4px !important; }
        
        /* Scrollbar bonito */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

    </div>
  );
}