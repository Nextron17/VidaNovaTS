"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  HeartPulse, ShieldAlert, PieChart, Users, 
  ArrowRight, UploadCloud, Activity, 
  Stethoscope, LockKeyhole, LifeBuoy, Server,
  FileDigit, Clock, Database, ChevronRight,
  ClipboardCheck, Building2
} from "lucide-react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-teal-500 selection:text-white pb-12">
      
      {/* --- FONDO CORPORATIVO CLÍNICO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[800px] bg-teal-100/40 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[600px] bg-blue-100/40 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_80%,transparent_100%)]"></div>
      </div>

      {/* --- NAVBAR INTERNO FLOTANTE --- */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-6 px-4 pointer-events-none">
        <nav className={`pointer-events-auto transition-all duration-500 flex items-center justify-between px-6 py-3 rounded-2xl w-full max-w-6xl ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-200/20" 
            : "bg-white/60 backdrop-blur-sm border border-slate-200/50"
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-sm">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">VIDANOVA</span>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Portal Operativo</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#induccion" className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors">Inducción</Link>
            <Link href="#modulos" className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors">Módulos</Link>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full ml-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sistema Online</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/soporte" className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors hidden sm:flex items-center gap-2">
              <LifeBuoy size={18} /> Soporte TI
            </Link>
          </div>
        </nav>
      </div>

      {/* --- HERO SECTION: ACCESO AL SISTEMA --- */}
      <section className="relative z-10 pt-44 pb-16 px-6 text-center max-w-5xl mx-auto flex flex-col items-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-[11px] font-black uppercase tracking-widest mb-8 shadow-sm">
          <LockKeyhole size={14} className="text-red-600" />
          <span>Acceso Restringido Institucional</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-slate-900">
          Intranet Operativa <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
            IPS VidaNova.
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 mb-10 max-w-2xl leading-relaxed font-medium">
          Plataforma centralizada para la gestión del ciclo de vida del paciente oncológico. Trazabilidad de historia clínica, autorizaciones y auditoría médica.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-base hover:bg-teal-700 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 group min-w-[280px]">
            <LockKeyhole size={18} className="text-teal-400" />
            Ingresar al Portal
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2" />
          </Link>
          <Link href="#induccion" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            Ver Inducción del Sistema
          </Link>
        </div>

        {/* Indicadores de Confianza Interna */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-slate-400 bg-white/50 py-3 px-8 rounded-full border border-slate-200/50 backdrop-blur-sm">
          <span className="flex items-center gap-2"><ShieldAlert size={16} className="text-teal-500" /> Cifrado Extremo</span>
          <span className="flex items-center gap-2"><Database size={16} className="text-blue-500" /> Backups Diarios</span>
          <span className="flex items-center gap-2"><Building2 size={16} className="text-indigo-500" /> Cumplimiento MinSalud</span>
        </div>
      </section>

      {/* --- SECCIÓN NUEVA: MINI INDUCCIÓN OPERATIVA --- */}
      <section id="induccion" className="relative z-10 py-20 mt-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-14 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            {/* Elemento Decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-bl-[100%] -z-0"></div>
            
            <div className="relative z-10 mb-12 text-center md:text-left">
              <h2 className="text-teal-600 font-black tracking-widest uppercase text-sm mb-2">Inducción al Personal</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">¿Cómo fluye la información en VidaNova?</h3>
              <p className="text-slate-500 text-lg max-w-3xl">
                Este sistema centraliza todo el proceso clínico y administrativo. Como colaborador, su rol interactuará con una de estas tres fases fundamentales para garantizar la atención del paciente.
              </p>
            </div>

            {/* Timeline Visual de Inducción */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Línea conectora Desktop */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-slate-100 via-teal-200 to-slate-100 z-0"></div>

              {/* Fase 1 */}
              <div className="relative bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:border-teal-200 transition-all group">
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform">
                  <span className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold border-4 border-slate-50">1</span>
                  <Users size={28} className="text-teal-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Admisión y Carga</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  El proceso inicia importando las bases de datos de las EPS o ingresando pacientes manualmente. Se validan los datos demográficos y autorizaciones de servicio.
                </p>
                <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-md">
                  Área Administrativa
                </div>
              </div>

              {/* Fase 2 */}
              <div className="relative bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:blue-teal-200 transition-all group">
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform">
                  <span className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold border-4 border-slate-50">2</span>
                  <Stethoscope size={28} className="text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Ruta Oncológica</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Se asignan códigos CUPS, se agendan citas (Quimioterapia, Radioterapia, Consultas) y se actualiza el estado clínico en tiempo real según la atención.
                </p>
                <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                  Personal Médico
                </div>
              </div>

              {/* Fase 3 */}
              <div className="relative bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:border-indigo-200 transition-all group">
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform">
                  <span className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold border-4 border-slate-50">3</span>
                  <FileDigit size={28} className="text-indigo-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">Auditoría y RIPS</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  El sistema consolida los tiempos de oportunidad y genera los reportes necesarios para la facturación (RIPS) y el cierre del ciclo del paciente.
                </p>
                <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                  Auditoría y Calidad
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- MÓDULOS DEL SISTEMA (BENTO GRID MODERNO) --- */}
      <section id="modulos" className="relative z-10 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Arquitectura de Módulos</h2>
            <p className="text-slate-500 font-medium mt-2">Acceso estructurado según sus credenciales de usuario.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Módulo Principal */}
            <div className="md:col-span-2 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex items-center justify-between mb-16">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <PieChart size={28} className="text-teal-400" />
                </div>
                <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300">
                  Ir al módulo <ChevronRight size={16} />
                </Link>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3">Analítica y Tableros de Control</h3>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                  Visualización gráfica de métricas de oportunidad, distribución de pacientes por EPS y estados de tratamiento. Exclusivo para gerencia y coordinación.
                </p>
              </div>
            </div>

            {/* Módulos Secundarios */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg hover:border-blue-200 transition-all flex items-start gap-4 group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Cargas Masivas</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">Importación desde Excel con limpieza automática de datos corruptos.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-lg hover:border-emerald-200 transition-all flex items-start gap-4 group">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Ruta Clínica</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">Asignación de órdenes, seguimiento de quimioterapias y control de estados.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER TÉCNICO E INSTITUCIONAL --- */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="bg-slate-100 p-2 rounded-lg">
               <HeartPulse size={20} className="text-slate-400"/>
             </div>
             <div className="flex flex-col">
               <span className="font-black text-slate-700 text-sm uppercase tracking-widest leading-none">IPS VidaNova</span>
               <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ecosistema Interno v2.0</span>
             </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Uso Restringido • Auditoría Activa
            </p>
            <p className="text-[10px] text-slate-400 max-w-md">
              Sistema de información desarrollado para la gestión integral. Toda la información contenida aquí es confidencial y sujeta a la ley de Habeas Data.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}