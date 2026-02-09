"use client";

import React from "react";
import { 
  CalendarDays, Users, ClipboardCheck, 
  Clock, MapPin, MoreHorizontal, ArrowRight,
  Stethoscope, AlertCircle, Phone
} from "lucide-react";

export default function OperativoDashboard() {
  // Mock Data: Citas de Hoy
  const todaysAppointments = [
    { id: 1, time: "08:00 AM", patient: "Maria Fernanda Lopez", type: "Primera Vez", status: "finished", statusLabel: "Finalizada" },
    { id: 2, time: "09:30 AM", patient: "Juan Esteban Perez", type: "Control Oncología", status: "current", statusLabel: "En Consulta" },
    { id: 3, time: "11:00 AM", patient: "Carlos Ruiz", type: "Lectura Exámenes", status: "pending", statusLabel: "Pendiente" },
    { id: 4, time: "02:00 PM", patient: "Ana Lucia Gomez", type: "Quimioterapia", status: "pending", statusLabel: "Pendiente" },
  ];

  // Mock Data: Tareas Urgentes
  const urgentTasks = [
    { id: 1, patient: "Luis Torres", task: "Autorización Vencida", priority: "high" },
    { id: 2, patient: "Pedro Pablo", task: "Reprogramar Cita", priority: "medium" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* 1. HEADER: Saludo y Fecha */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Hola, Dr. Usuario 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Aquí está el resumen de tu agenda para hoy.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-bold text-slate-600">
          <CalendarDays size={18} className="text-blue-600"/>
          <span>Miercoles, 04 de Febrero 2026</span>
        </div>
      </div>

      {/* 2. STATS CARDS (Resumen del día) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Citas Programadas" 
          value="12" 
          sub="4 Finalizadas" 
          icon={CalendarDays} 
          color="blue" 
        />
        <StatCard 
          label="Pacientes Activos" 
          value="45" 
          sub="+2 Nuevos hoy" 
          icon={Users} 
          color="emerald" 
        />
        <StatCard 
          label="Tareas Pendientes" 
          value="5" 
          sub="1 Urgente" 
          icon={ClipboardCheck} 
          color="orange" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. AGENDA DEL DÍA (Columna Principal - 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-600" size={24}/> Agenda del Día
            </h2>
            <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              Ver Calendario Completo
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {todaysAppointments.map((apt) => (
                <div key={apt.id} className={`p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group ${apt.status === 'current' ? 'bg-blue-50/50' : ''}`}>
                  
                  {/* Hora */}
                  <div className="flex flex-col items-center min-w-[70px]">
                    <span className="text-sm font-black text-slate-700">{apt.time}</span>
                    <div className={`h-full w-0.5 mt-2 rounded-full ${apt.status === 'finished' ? 'bg-slate-200' : 'bg-blue-200'}`}></div>
                  </div>

                  {/* Info Paciente */}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">{apt.patient}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600">
                        <Stethoscope size={12}/> {apt.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14}/> Consultorio 204
                      </span>
                    </div>
                  </div>

                  {/* Estado y Acciones */}
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${apt.status === 'finished' ? 'bg-slate-100 text-slate-400' : 
                        apt.status === 'current' ? 'bg-green-100 text-green-700 animate-pulse' : 
                        'bg-blue-50 text-blue-600'}
                    `}>
                      {apt.statusLabel}
                    </span>
                    <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <MoreHorizontal size={20}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer Agenda */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">No hay más citas programadas para hoy.</p>
            </div>
          </div>
        </div>

        {/* 4. SIDEBAR DERECHO: Tareas y Accesos (1/3) */}
        <div className="space-y-6">
          
          {/* Tareas Urgentes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20}/> Atención Requerida
            </h3>
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex justify-between items-start group hover:bg-orange-100 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">{task.task}</p>
                    <p className="font-bold text-slate-800 text-sm">{task.patient}</p>
                  </div>
                  <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform mt-1"/>
                </div>
              ))}
            </div>
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors text-left">
                  <div className="p-1.5 bg-blue-500 rounded-lg"><Users size={16}/></div>
                  Registrar Nuevo Paciente
                </button>
                <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors text-left">
                  <div className="p-1.5 bg-emerald-500 rounded-lg"><CalendarDays size={16}/></div>
                  Agendar Cita Extra
                </button>
                <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors text-left">
                  <div className="p-1.5 bg-purple-500 rounded-lg"><Phone size={16}/></div>
                  Directorio Médico
                </button>
              </div>
            </div>
            
            {/* Decoración Fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 blur-[60px] opacity-40 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600 blur-[60px] opacity-40 rounded-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente Pequeño para las Tarjetas de Estadísticas
function StatCard({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl border ${colors[color]}`}>
        <Icon size={28} strokeWidth={2.5}/>
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
        <p className="text-xs font-medium text-slate-500">{sub}</p>
      </div>
    </div>
  );
}