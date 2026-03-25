"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  HeartPulse, ShieldAlert, PieChart, Users, 
  ArrowRight, UploadCloud, Activity, 
  Stethoscope, LockKeyhole, LifeBuoy, Server,
  FileDigit, Clock, Database, ChevronRight,
  ClipboardCheck, Building2, Network, Fingerprint,
  Microscope, FileBarChart, CheckCircle2
} from "lucide-react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-600 selection:text-white pb-12">
      
      {/* --- FONDO CORPORATIVO CLÍNICO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[700px] bg-blue-100/40 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[600px] bg-teal-100/40 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-60 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_80%,transparent_100%)]"></div>
      </div>

      {/* --- NAVBAR INTERNO FLOTANTE --- */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-6 px-4 pointer-events-none">
        <nav className={`pointer-events-auto transition-all duration-500 flex items-center justify-between px-6 py-3 rounded-2xl w-full max-w-6xl ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg shadow-slate-200/20" 
            : "bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm"
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-sm">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">VIDANOVA</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Plataforma Core</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#arquitectura" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Arquitectura</Link>
            <Link href="#flujo" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Flujo Operativo</Link>
            <Link href="#pilares" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Pilares</Link>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full ml-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistema Activo</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/soporte" className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-2">
              <LifeBuoy size={16} /> Soporte TI
            </Link>
          </div>
        </nav>
      </div>

      {/* --- HERO SECTION: ACCESO Y PROPUESTA DE VALOR --- */}
      <section className="relative z-10 pt-44 pb-20 px-6 text-center max-w-5xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm">
          <LockKeyhole size={14} className="text-blue-600" />
          <span>Acceso Restringido • IPS VidaNova</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-slate-900">
          Sistema Inteligente de <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-teal-500">
            Navegación Oncológica.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl leading-relaxed font-medium">
          Plataforma centralizada para la gestión, trazabilidad y auditoría del ciclo de vida del paciente. Diseñada para erradicar barreras de acceso, optimizar la oportunidad de atención y garantizar el cumplimiento normativo en oncología.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 group min-w-[280px]">
            <Fingerprint size={18} className="text-blue-400" />
            Autenticar Credenciales
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2" />
          </Link>
          <Link href="#arquitectura" className="bg-white text-slate-700 border border-slate-200 px-8 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            Explorar Arquitectura
          </Link>
        </div>

        {/* Indicadores de Capacidad */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl border-t border-slate-200 pt-10">
          <div className="text-left">
            <p className="text-3xl font-black text-slate-900">360°</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Visión de Paciente</p>
          </div>
          <div className="text-left border-l border-slate-200 pl-6">
            <p className="text-3xl font-black text-blue-600">0%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Pérdida de Datos</p>
          </div>
          <div className="text-left border-l border-slate-200 pl-6">
            <p className="text-3xl font-black text-teal-600">CAC</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Cohortes</p>
          </div>
          <div className="text-left border-l border-slate-200 pl-6">
            <p className="text-3xl font-black text-slate-900">RIPS</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Trazabilidad Total</p>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 2: EL DESAFÍO Y LA SOLUCIÓN --- */}
      <section id="arquitectura" className="relative z-10 py-24 bg-white/50 border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-6">
                <Network size={14} /> Arquitectura del Sistema
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                Transformando datos dispersos en <span className="text-blue-600">inteligencia operativa.</span>
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                La navegación oncológica moderna requiere más que simples hojas de cálculo. Vidanova consolida la importación masiva de datos desde las EPS, la gestión de agendamiento clínico y la auditoría concurrente en un ecosistema único.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-teal-500 shrink-0 mt-0.5" size={20}/>
                  <span className="text-sm font-medium text-slate-700"><strong>Detección de Duplicados:</strong> Motor inteligente que fusiona historias clínicas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-teal-500 shrink-0 mt-0.5" size={20}/>
                  <span className="text-sm font-medium text-slate-700"><strong>Clasificación CUPS:</strong> Auto-categorización de procedimientos en modalidades exactas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="text-teal-500 shrink-0 mt-0.5" size={20}/>
                  <span className="text-sm font-medium text-slate-700"><strong>Alertas Tempranas:</strong> Semáforos de oportunidad para prevenir vencimientos de órdenes.</span>
                </li>
              </ul>
            </div>
            
            {/* Visual Abstracto del Software */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-3xl transform rotate-3 scale-105 opacity-20 blur-xl"></div>
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10 transform -rotate-2">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="ml-2 text-xs font-mono text-slate-500">vidanova-core-v2.0</span>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="text-blue-400">&gt; Iniciando motor de reglas clínicas...</div>
                  <div className="text-emerald-400">✓ Conexión establecida con base de datos maestra.</div>
                  <div className="text-slate-300">Cargando módulos:</div>
                  <div className="text-slate-400 pl-4 border-l border-slate-700 ml-2 space-y-2">
                    <div>├── [██████████] Autenticación y RBAC (100%)</div>
                    <div>├── [██████████] Motor de Importación Pandas (100%)</div>
                    <div>├── [██████████] Auditoría Concurrente (100%)</div>
                    <div>└── [██████████] Analítica Gerencial (100%)</div>
                  </div>
                  <div className="text-teal-300 mt-4">&gt; Sistema listo y a la escucha.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 3: FLUJO OPERATIVO --- */}
      <section id="flujo" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Ciclo de Vida de la Navegación</h2>
            <p className="text-slate-600 text-lg">
              El diseño del software refleja exactamente la ruta operativa de la IPS, garantizando que la información fluya sin fricciones entre los distintos departamentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Línea conectora Desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-blue-100 via-teal-200 to-blue-100 z-0"></div>

            {/* Fase 1 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
              <div className="w-20 h-20 bg-slate-50 shadow-inner border border-slate-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform">
                <span className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">1</span>
                <UploadCloud size={32} className="text-blue-600" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Admisión y Carga Masiva</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                Las bases de datos de las EPS ingresan al sistema. El motor normaliza documentos, nombres y diagnósticos, creando el perfil base de los pacientes incidentes y prevalentes sin duplicar información.
              </p>
              <div className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                Responsable: Área Administrativa
              </div>
            </div>

            {/* Fase 2 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all group">
              <div className="w-20 h-20 bg-slate-50 shadow-inner border border-slate-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform">
                <span className="absolute -top-3 -right-3 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">2</span>
                <Stethoscope size={32} className="text-teal-600" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Gestión de Ruta Clínica</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                Los gestores (Navegadores) toman los casos pendientes. Documentan barreras de acceso, agendan citas (Quimio, Radio, Consultas) e interactúan con los pacientes dejando trazabilidad inmodificable.
              </p>
              <div className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                Responsable: Navegación Oncológica
              </div>
            </div>

            {/* Fase 3 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group">
              <div className="w-20 h-20 bg-slate-50 shadow-inner border border-slate-100 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-2 transition-transform">
                <span className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">3</span>
                <ClipboardCheck size={32} className="text-indigo-600" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Auditoría y Cierre</h4>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                El sistema detecta fechas invertidas o trámites rezagados. Se consolida la información perfecta para la generación de reportes gerenciales, facturación y soportes de RIPS para las aseguradoras.
              </p>
              <div className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                Responsable: Coordinación / Calidad
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECCIÓN 4: PILARES TECNOLÓGICOS (BENTO GRID) --- */}
      <section id="pilares" className="relative z-10 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Capacidades del Software</h2>
            <p className="text-slate-500 font-medium mt-2">Módulos especializados según las necesidades de la clínica.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Analítica (Largo) */}
            <div className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between group shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
              
              <div className="relative z-10 flex items-center justify-between mb-16">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <FileBarChart size={32} className="text-blue-400" />
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest">
                  Tableros Gerenciales
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-4">Analítica de Datos en Tiempo Real</h3>
                <p className="text-slate-300 text-sm max-w-lg leading-relaxed font-medium">
                  Gráficas interactivas que miden la carga operativa, distribución de pacientes por EPS, identificación de las barreras de acceso más comunes y tiempos de oportunidad. Herramienta vital para negociaciones con pagadores.
                </p>
              </div>
            </div>

            {/* Pilar 2 y 3 (Pequeños) */}
            <div className="flex flex-col gap-6">
              
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl transition-all flex flex-col justify-between group shadow-sm flex-1">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Microscope size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Clasificación CAC</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">Agrupación automática de diagnósticos CIE-10 (Mama, Próstata, Cérvix) para reportes de Cuenta de Alto Costo.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl transition-all flex flex-col justify-between group shadow-sm flex-1">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Motor de Auditoría</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">Identificación de expedientes sin CUPS, sin EPS o con fechas invertidas para mantener la calidad del dato al 100%.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER TÉCNICO E INSTITUCIONAL --- */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="bg-slate-900 p-3 rounded-xl shadow-inner">
               <HeartPulse size={24} className="text-white"/>
             </div>
             <div className="flex flex-col">
               <span className="font-black text-slate-800 text-base uppercase tracking-widest leading-none mb-1">IPS VidaNova</span>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sistema de Navegación Core v2.0</span>
             </div>
          </div>
          
          <div className="text-center md:text-right max-w-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-center md:justify-end gap-2">
              <LockKeyhole size={12}/> Uso Restringido • Privacidad Activa
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Software propietario desarrollado para la gestión integral de pacientes. La información contenida en esta plataforma es estrictamente confidencial y está protegida por la Ley Estatutaria 1581 de Habeas Data.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}