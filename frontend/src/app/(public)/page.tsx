"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Activity, ShieldCheck, BarChart3, Users, Pill, 
  Stethoscope, ArrowRight, LogIn, CheckCircle2, 
  Zap, ClipboardCheck, LayoutDashboard, Search,
  Clock, Files, MousePointer2
} from "lucide-react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-600 selection:text-white">
      
      {/* --- FONDO DECORATIVO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className={`sticky top-0 z-[100] transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm" : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">VIDANOVA</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-all">
              <LogIn size={18} /> Iniciar Sesión
            </Link>
            <Link href="/registro" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">
              Solicitar Acceso
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative z-10 pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black mb-8 tracking-widest uppercase">
              <Zap size={14} className="fill-blue-600" />
              Gestión de Pacientes Oncológicos
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
              Control Total de la <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                Ruta Clínica.
              </span>
            </h1>
            
            <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Vidanova centraliza pacientes, automatiza el seguimiento de citas y garantiza que ningún tratamiento 
              se detenga por errores administrativos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/login" className="group bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-bold text-lg hover:bg-slate-900 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3">
                Acceder al Panel
                <MousePointer2 size={20} />
              </Link>
              <div className="flex items-center gap-4 px-6 py-4 rounded-[2rem] bg-white border border-slate-200">
                <LayoutDashboard size={24} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 leading-none">Multiplex</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interfaz por Roles</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="space-y-6 relative z-10">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                     <div className="p-2 bg-blue-600 text-white rounded-lg"><Search size={20}/></div>
                     <div className="flex-1">
                        <div className="h-2 w-3/4 bg-slate-700 rounded-full mb-2"></div>
                        <div className="h-2 w-1/2 bg-slate-800 rounded-full"></div>
                     </div>
                  </div>
                  <div className="p-4 bg-emerald-50/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                     <span className="text-[10px] font-mono text-emerald-400 uppercase">Procesando_Datos_SST</span>
                     <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FUNCIONALIDADES --- */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Importación Inteligente</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Carga masiva de pacientes desde Excel con detección automática de duplicados y limpieza de datos.</p>
          </div>
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Línea de Tiempo</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Historial completo de cada paciente, desde la primera consulta hasta la aplicación del tratamiento.</p>
          </div>
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Auditoría Blindada</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Validación de integridad de datos para evitar errores de citas y fechas inconsistentes en el sistema.</p>
          </div>
        </div>
      </section>

      {/* --- MÓDULOS --- */}
      <section id="modulos" className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-16 text-center lg:text-left">
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Capacidades del Sistema</h2>
          <p className="text-slate-500 font-medium italic">Herramientas integradas para la gestión oncológica eficiente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProfileCard 
            title="Gestión Pacientes" 
            desc="Creación, edición y eliminación de registros. Directorio filtrable por EPS, Cédula o Estado."
            icon={<Users />} 
            color="blue"
          />
          <ProfileCard 
            title="Seguimientos" 
            desc="Gestión de órdenes médicas, CUPS y estados de atención (Pendiente, Realizado, Agendado)."
            icon={<ClipboardCheck />} 
            color="emerald"
          />
          <ProfileCard 
            title="Analítica KPI" 
            desc="Gráficos de población por género, EPS y tiempos de oportunidad en la atención clínica."
            icon={<BarChart3 />} 
            color="purple"
          />
          <ProfileCard 
            title="Reportes PDF" 
            desc="Generación de historias clínicas simplificadas y reportes de gestión listos para impresión."
            icon={<Files />} 
            color="amber"
          />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <Activity size={20} className="text-blue-600"/>
             <span className="font-black text-slate-900 tracking-tighter uppercase">VIDANOVA ECOSYSTEM</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 Todos los derechos reservados • v2.0.1 Stable
          </p>
          <div className="flex gap-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-blue-600">Seguridad</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-blue-600">Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProfileCard({ title, desc, icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    purple: "text-purple-600 bg-purple-50",
    amber: "text-amber-600 bg-amber-50",
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${colors[color]}`}>
        {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-xs font-medium leading-relaxed">{desc}</p>
    </div>
  );
}