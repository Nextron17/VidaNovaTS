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
  Mail,
  Filter
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
    color?: string; // Importante para la vista de Lista
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

// --- CONFIGURACIÓN DE ESTILOS "GORDA" ---
// hex: Color para los puntos de FullCalendar (Vista Lista)
// bg/border/text: Clases de Tailwind para las tarjetas personalizadas
const EVENT_STYLES: { [key: string]: { bg: string, border: string, text: string, icon: any, label: string, hex: string } } = {
    'CONSULTA':      { bg: 'bg-blue-50',      border: 'border-blue-600',    text: 'text-blue-800',    icon: Stethoscope, label: 'Consulta',      hex: '#2563eb' }, 
    'QUIMIOTERAPIA': { bg: 'bg-purple-50',    border: 'border-purple-600',  text: 'text-purple-800',  icon: Activity,    label: 'Quimioterapia', hex: '#9333ea' }, 
    'RADIOTERAPIA':  { bg: 'bg-orange-50',    border: 'border-orange-600',  text: 'text-orange-800',  icon: Activity,    label: 'Radioterapia',  hex: '#ea580c' },   
    'CIRUGIA':       { bg: 'bg-rose-50',      border: 'border-rose-600',    text: 'text-rose-800',    icon: Activity,    label: 'Cirugía',       hex: '#e11d48' },          
    'IMAGEN':        { bg: 'bg-emerald-50',   border: 'border-emerald-600', text: 'text-emerald-800', icon: FileText,    label: 'Imágenes',      hex: '#059669' },           
    'LABORATORIO':   { bg: 'bg-cyan-50',      border: 'border-cyan-600',    text: 'text-cyan-800',    icon: FileText,    label: 'Laboratorio',   hex: '#0891b2' },   
    'OTROS':         { bg: 'bg-slate-50',     border: 'border-slate-600',   text: 'text-slate-800',   icon: CalendarIcon,label: 'Otros',         hex: '#475569' }                
};

const STATUS_STYLES: { [key in EventStatus]: { color: string, bg: string, icon: any, label: string } } = {
    'REALIZADO': { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2, label: 'Realizado' },
    'PENDIENTE': { color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock, label: 'Pendiente' },
    'AGENDADO': { color: 'text-blue-600', bg: 'bg-blue-100', icon: CalendarIcon, label: 'Agendado' },
    'CANCELADO': { color: 'text-rose-600', bg: 'bg-rose-100', icon: X, label: 'Cancelado' }
};

export default function AgendaPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
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
                page: 1, limit: 3000, 
                startDate: start.toISOString(), 
                endDate: end.toISOString()
            }
        });

        if (res.data.success) {
            const mappedEvents: CalendarEvent[] = [];
            (res.data.data || []).forEach((p: any) => {
                if (p.followups?.length > 0) {
                    p.followups.forEach((f: any) => {
                        // 1. Normalización de Categorías (Evita "Otros" innecesarios)
                        let typeKey = (f.category || 'OTROS').toUpperCase().trim();
                        if (typeKey.includes('IMAGEN')) typeKey = 'IMAGEN';
                        if (typeKey.includes('QUIMIO')) typeKey = 'QUIMIOTERAPIA';
                        if (typeKey.includes('RADIO')) typeKey = 'RADIOTERAPIA';
                        if (typeKey.includes('CIRUGIA')) typeKey = 'CIRUGIA';
                        if (typeKey.includes('LAB')) typeKey = 'LABORATORIO';
                        if (!EVENT_STYLES[typeKey]) typeKey = 'OTROS';

                        // 2. Obtener estilos
                        const style = EVENT_STYLES[typeKey];
                        const eventDate = f.dateAppointment ? f.dateAppointment : f.dateRequest;
                        
                        if (!eventDate) return;

                        const dateObj = new Date(eventDate);
                        const isAllDay = dateObj.getHours() === 0 && dateObj.getMinutes() === 0;
                        const endDateObj = new Date(dateObj);
                        endDateObj.setMinutes(dateObj.getMinutes() + 45); 

                        mappedEvents.push({
                            id: f.id.toString(),
                            title: `${p.firstName} ${p.lastName}`,
                            start: eventDate,
                            end: isAllDay ? undefined : endDateObj.toISOString(),
                            allDay: isAllDay,
                            // Transparente para usar nuestro render personalizado
                            backgroundColor: 'transparent', 
                            borderColor: 'transparent',
                            textColor: '#1e293b',
                            // Color real para la vista de Lista
                            color: style.hex, 
                            classNames: ['cursor-pointer'],
                            extendedProps: {
                                type: typeKey as EventType,
                                patientId: p.id,
                                patientName: `${p.firstName} ${p.lastName}`,
                                serviceName: f.serviceName || 'Servicio no especificado',
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

  // --- FILTROS ---
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
    <div className="flex w-full h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR (Filtros y Panel) ================= */}
      <aside className="hidden md:flex w-80 bg-white border-r border-slate-200 flex-col shrink-0 z-20 shadow-lg h-full">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20">
                <CalendarIcon size={22} strokeWidth={2.5}/>
            </div>
            <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Agenda Médica</h1>
                <p className="text-xs text-slate-400 font-medium mt-1">Gestión de citas</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Buscador */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar paciente o servicio..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Mini Dashboard */}
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={12}/> Métricas del Mes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center hover:border-blue-200 transition-colors">
                        <span className="block text-2xl font-black text-slate-800">{filteredEvents.length}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total Citas</span>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                        <span className="block text-2xl font-black text-emerald-600">
                            {filteredEvents.filter(e => e.extendedProps.status === 'REALIZADO').length}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Atendidos</span>
                    </div>
                </div>
            </div>

            {/* Filtros Categorías (CON COLORES REALES) */}
            <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                    <span className="flex items-center gap-2"><Filter size={12}/> Categorías</span>
                    <button onClick={() => setSelectedTypes(Object.keys(EVENT_STYLES))} className="text-[9px] text-blue-600 hover:underline">Ver todas</button>
                </h3>
                <div className="flex flex-col gap-2">
                    {Object.keys(EVENT_STYLES).map((type) => {
                        const isActive = selectedTypes.includes(type);
                        const style = EVENT_STYLES[type];
                        return (
                            <button
                                key={type}
                                onClick={() => toggleType(type)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 w-full text-left group ${isActive ? `bg-white border-slate-200 text-slate-700 shadow-sm ring-1 ring-slate-100` : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50'}`}
                            >
                                {/* Indicador de Color (HEX) */}
                                <div 
                                    className={`w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white transition-transform ${isActive ? 'scale-110' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`} 
                                    style={{ backgroundColor: style.hex }}
                                ></div>
                                <span className="flex-1">{style.label}</span>
                                {isActive && <CheckCircle2 size={14} className="text-blue-500"/>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button 
                onClick={() => router.push('/navegacion/admin/pacientes')}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:bg-blue-600 hover:shadow-blue-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={18}/> Nueva Cita
            </button>
        </div>
      </aside>

      {/* ================= AREA PRINCIPAL (Calendario) ================= */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-white">
        
        {loading && (
            <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 pointer-events-none">
                <Loader2 className="animate-spin text-blue-600" size={16}/>
                <span className="text-xs font-bold text-slate-600">Sincronizando...</span>
            </div>
        )}

        <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <div className="h-full w-full bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden p-1">
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
                    
                    // Ajustes de Visualización
                    height="100%"
                    dayMaxEvents={false} 
                    stickyHeaderDates={true} 
                    expandRows={true}
                    slotMinTime="06:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    navLinks={true}
                    
                    // 🔥 RENDERIZADO PERSONALIZADO (Tarjetas)
                    eventContent={(eventInfo) => {
                        const type = eventInfo.event.extendedProps.type;
                        const style = EVENT_STYLES[type] || EVENT_STYLES['OTROS'];
                        const isWeekView = eventInfo.view.type === 'timeGridWeek';

                        // Render para vista de LISTA (FullCalendar usa dot por defecto, pero podemos personalizar si queremos)
                        if (eventInfo.view.type === 'listWeek') {
                             return (
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">{eventInfo.event.title}</span>
                                    <span className="text-xs text-slate-500">{eventInfo.event.extendedProps.serviceName}</span>
                                </div>
                             )
                        }

                        // Render para Mes/Semana
                        return (
                            <div className={`w-full h-full px-2 py-1 flex flex-col justify-center ${style.bg} border-l-[4px] ${style.border} hover:brightness-95 transition-all cursor-pointer rounded-r-md overflow-hidden shadow-sm`}>
                                <div className="flex items-center justify-between gap-1 leading-none mb-0.5">
                                    <span className={`text-[9px] font-extrabold ${style.text} opacity-80 whitespace-nowrap bg-white/50 px-1 py-0.5 rounded`}>
                                        {eventInfo.timeText}
                                    </span>
                                </div>
                                
                                <div className={`text-[10px] md:text-xs font-bold ${style.text} truncate leading-tight mt-0.5`}>
                                    {eventInfo.event.title}
                                </div>

                                <div className={`text-[9px] text-slate-500 truncate leading-tight mt-0.5 ${isWeekView ? 'line-clamp-2 whitespace-normal' : ''}`}>
                                    {eventInfo.event.extendedProps.serviceName}
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
              <div 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity animate-in fade-in" 
                onClick={() => setIsDetailOpen(false)}
              ></div>

              <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
                  {/* Header con color dinámico */}
                  <div className={`p-6 border-b border-slate-100 flex justify-between items-start shrink-0 ${EVENT_STYLES[selectedEvent.extendedProps.type].bg}`}>
                      <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide mb-3 bg-white/80 backdrop-blur-sm border ${EVENT_STYLES[selectedEvent.extendedProps.type].border.replace('border-', 'text-')} shadow-sm`}>
                              {React.createElement(EVENT_STYLES[selectedEvent.extendedProps.type].icon, { size: 12 })}
                              {selectedEvent.extendedProps.type}
                          </span>
                          <h2 className="text-xl font-black text-slate-900 leading-tight">
                              {selectedEvent.extendedProps.patientName}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 text-slate-600 text-xs font-bold">
                              <MapPin size={12}/> {selectedEvent.extendedProps.eps || 'Particular'}
                          </div>
                      </div>
                      <button onClick={() => setIsDetailOpen(false)} className="p-2 bg-white/50 hover:bg-white rounded-full transition-all text-slate-500 hover:text-rose-500 shadow-sm">
                          <X size={20}/>
                      </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                      
                      {/* Estado y Fecha */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha & Hora</span>
                              <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                  <Clock size={16} className="text-blue-500"/>
                                  {new Date(selectedEvent.start).toLocaleString()}
                              </div>
                          </div>
                          <div className={`p-4 rounded-2xl border ${STATUS_STYLES[selectedEvent.extendedProps.status].bg.replace('bg-', 'border-').replace('100', '200')} ${STATUS_STYLES[selectedEvent.extendedProps.status].bg}`}>
                              <span className="block text-[10px] font-bold opacity-60 uppercase mb-1">Estado Actual</span>
                              <div className={`flex items-center gap-2 font-bold text-sm ${STATUS_STYLES[selectedEvent.extendedProps.status].color}`}>
                                  {React.createElement(STATUS_STYLES[selectedEvent.extendedProps.status].icon, { size: 16 })}
                                  {STATUS_STYLES[selectedEvent.extendedProps.status].label}
                              </div>
                          </div>
                      </div>

                      {/* Detalles del Procedimiento */}
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Detalle del Procedimiento</label>
                          <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                              <p className="font-bold text-slate-800 text-sm leading-relaxed">
                                  {selectedEvent.extendedProps.serviceName}
                              </p>
                              {selectedEvent.extendedProps.cups && (
                                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
                                      <FileText size={12}/> CUPS: {selectedEvent.extendedProps.cups}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Contacto */}
                      {(selectedEvent.extendedProps.phone || selectedEvent.extendedProps.email) && (
                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Contacto Paciente</label>
                              <div className="space-y-3">
                                  {selectedEvent.extendedProps.phone && (
                                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 group">
                                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform"><Phone size={18}/></div>
                                          <div>
                                              <span className="block text-xs text-slate-400 font-medium">Teléfono Móvil</span>
                                              <span className="block text-sm font-bold text-slate-700">{selectedEvent.extendedProps.phone}</span>
                                          </div>
                                      </div>
                                  )}
                                  {selectedEvent.extendedProps.email && (
                                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 group">
                                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><Mail size={18}/></div>
                                          <div>
                                              <span className="block text-xs text-slate-400 font-medium">Correo Electrónico</span>
                                              <span className="block text-sm font-bold text-slate-700 truncate max-w-[200px]">{selectedEvent.extendedProps.email}</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* Notas */}
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

                  {/* Footer */}
                  <div className="p-6 border-t border-slate-100 bg-slate-50/80 shrink-0">
                      <button 
                          onClick={() => router.push(`/navegacion/admin/pacientes/perfil?id=${selectedEvent.extendedProps.patientId}`)}
                          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                          <span>Gestionar Paciente</span>
                          <ChevronRight size={18}/>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ESTILOS GLOBALES FULLCALENDAR */}
      <style jsx global>{`
        .fc { height: 100%; width: 100%; font-family: inherit; }
        
        /* Toolbar */
        .fc-header-toolbar { margin-bottom: 1.5rem !important; padding: 0.5rem; }
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 900 !important; color: #0f172a; text-transform: capitalize; letter-spacing: -0.025em; }
        
        /* Botones del Toolbar */
        .fc-button { border-radius: 0.75rem !important; font-weight: 700 !important; text-transform: capitalize !important; padding: 0.5rem 1rem !important; font-size: 0.8rem !important; border: 1px solid #e2e8f0 !important; background-color: white !important; color: #475569 !important; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); transition: all 0.2s; }
        .fc-button:hover { background-color: #f8fafc !important; color: #1e293b !important; transform: translateY(-1px); }
        .fc-button-active { background-color: #0f172a !important; border-color: #0f172a !important; color: white !important; }
        
        /* Cabecera de días */
        .fc-col-header-cell { padding: 12px 0 !important; background-color: white !important; border: 0 !important; border-bottom: 1px solid #f1f5f9 !important; }
        .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; text-decoration: none !important; letter-spacing: 0.05em; }
        
        /* Celdas del Mes */
        .fc-scrollgrid { border: none !important; }
        .fc-daygrid-day { border: 1px solid #f8fafc !important; transition: background-color 0.2s; }
        .fc-daygrid-day:hover { background-color: #fcfcfc; }
        
        /* Scroll y Altura */
        .fc-daygrid-day-frame { min-height: 100% !important; overflow: hidden; }
        .fc-daygrid-day-events { min-height: 2em !important; margin-top: 2px; }
        
        /* Números de día */
        .fc-daygrid-day-top { flex-direction: row; padding: 8px; }
        .fc-daygrid-day-number { font-size: 0.75rem; font-weight: 700; color: #64748b; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 99px; transition: all 0.2s; text-decoration: none !important; }
        .fc-day-today { background-color: #f8fafc !important; }
        .fc-day-today .fc-daygrid-day-number { background-color: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); }
        
        /* Eventos */
        .fc-event { border: none !important; background: transparent !important; margin-bottom: 4px !important; box-shadow: none !important; }
        
        /* Scrollbars personalizados */
        .fc-scroller::-webkit-scrollbar { width: 6px; height: 6px; }
        .fc-scroller::-webkit-scrollbar-track { background: transparent; }
        .fc-scroller::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .fc-scroller::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

    </div>
  );
}