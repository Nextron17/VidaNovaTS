"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  HeartPulse, LayoutDashboard, Users, 
  ArrowRight, CalendarCheck, 
  Stethoscope, LockKeyhole, BellRing,
  Clock, LineChart, ClipboardList, 
  Fingerprint, Search, CheckCircle2, 
  UserCircle, FolderOpen, FileText, 
  MessageSquare, ShieldCheck, HelpCircle,
  FileDown, Sparkles
} from "lucide-react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-600 selection:text-white pb-12">
      
      {/* --- FONDO CORPORATIVO CLÍNICO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[700px] bg-blue-100/50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[600px] bg-teal-100/50 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute top-[40%] right-[-5%] w-[30%] h-[400px] bg-indigo-100/40 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-60 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_80%,transparent_100%)]"></div>
      </div>

      {/* --- NAVBAR INTERNO FLOTANTE --- */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-6 px-4 pointer-events-none">
        <nav className={`pointer-events-auto transition-all duration-500 flex items-center justify-between px-6 py-3 rounded-2xl w-full max-w-6xl ${
          scrolled 
            ? "bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl shadow-slate-200/20" 
            : "bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm"
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-2.5 rounded-xl shadow-md">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">VIDANOVA</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Workspace</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#modulos" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Módulos</Link>
            <Link href="#funcionalidades" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Beneficios</Link>
            <Link href="#flujo" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Tu Día a Día</Link>
            <Link href="#faq" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors">Dudas</Link>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full ml-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistema Activo</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
               <UserCircle size={20} />
            </div>
          </div>
        </nav>
      </div>

      {/* --- HERO SECTION: ENFOQUE EN USUARIO --- */}
      <section className="relative z-10 pt-44 pb-20 px-6 text-center max-w-5xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm">
          <Sparkles size={14} />
          <span>Adiós a los Excel interminables</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-slate-900">
          Tu gestión clínica, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500">
            simple y en un solo lugar.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl leading-relaxed font-medium">
          VidaNova es tu nuevo asistente virtual. Una plataforma visual e intuitiva diseñada para que navegadores, médicos y administrativos encuentren la información de sus pacientes al instante, gestionen citas sin complicaciones y visualicen alertas importantes para que nada se pase por alto.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/20 hover:shadow-blue-600/30 hover:-translate-y-1 flex items-center justify-center gap-3 group min-w-[280px]">
            <Fingerprint size={18} className="text-blue-400 group-hover:text-white transition-colors" />
            Ingresar al Sistema
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2" />
          </Link>
          <Link href="#modulos" className="bg-white text-slate-700 border border-slate-200 px-8 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 shadow-sm">
            Explorar Módulos
          </Link>
        </div>
      </section>

      {/* --- NUEVA SECCIÓN: MÓDULOS PRINCIPALES --- */}
      <section id="modulos" className="relative z-10 py-16 bg-white border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tu Espacio de Trabajo</h2>
            <p className="text-slate-500 font-medium mt-3 max-w-2xl mx-auto">
              Todo lo que haces diariamente está organizado en módulos claros. Sin menús ocultos ni clics innecesarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Módulo 1 */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FolderOpen size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Directorio de Pacientes</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Un buscador inteligente donde tienes el perfil completo de cada paciente: datos de contacto, EPS, diagnósticos y todo su historial de atenciones en una sola pantalla estilo "hoja de vida".
              </p>
            </div>

            {/* Módulo 2 */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Agenda y Rutas</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Tu calendario interactivo. Programa citas de quimioterapia, radioterapia o consultas médicas. El sistema te muestra los huecos disponibles y evita que programes dos cosas a la misma hora.
              </p>
            </div>

            {/* Módulo 3 */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:border-rose-200 hover:bg-rose-50/50 transition-all group">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gestor de Trámites</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Controla las autorizaciones y órdenes médicas. Sube documentos PDF y marca qué trámites están pendientes por la EPS para que tu equipo sepa exactamente a quién hay que llamar hoy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN 2: INTERFAZ Y EXPERIENCIA (Visuales) --- */}
      <section id="funcionalidades" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Visual: Mockup de Interfaz Limpia */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-teal-300 rounded-[2rem] transform -rotate-3 scale-105 opacity-20 blur-xl"></div>
              <div className="bg-white rounded-[2rem] p-4 border border-slate-200 shadow-2xl relative z-10 transform rotate-1 flex flex-col h-[420px]">
                {/* Header Mockup */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                       <LayoutDashboard size={16} className="text-white"/>
                    </div>
                    <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-rose-500"></div></div>
                    <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                  </div>
                </div>
                {/* Body Mockup */}
                <div className="flex gap-4 flex-1">
                  {/* Sidebar Mockup */}
                  <div className="w-1/4 flex flex-col gap-3 border-r border-slate-100 pr-4">
                     <div className="h-8 w-full bg-blue-50 rounded-lg flex items-center px-2 border border-blue-100"><div className="h-2 w-1/2 bg-blue-400 rounded-full"></div></div>
                     <div className="h-8 w-full bg-transparent rounded-lg flex items-center px-2 hover:bg-slate-50"><div className="h-2 w-3/4 bg-slate-300 rounded-full"></div></div>
                     <div className="h-8 w-full bg-transparent rounded-lg flex items-center px-2 hover:bg-slate-50"><div className="h-2 w-2/3 bg-slate-300 rounded-full"></div></div>
                  </div>
                  {/* Content Mockup */}
                  <div className="w-3/4 flex flex-col gap-4">
                     <div className="flex gap-4">
                       <div className="h-20 flex-1 bg-teal-50 rounded-xl border border-teal-100 p-3 flex flex-col justify-between">
                         <div className="h-2 w-1/2 bg-teal-200 rounded-full"></div>
                         <div className="flex items-end justify-between">
                            <div className="h-6 w-1/3 bg-teal-600 rounded-md"></div>
                            <CheckCircle2 size={16} className="text-teal-400"/>
                         </div>
                       </div>
                       <div className="h-20 flex-1 bg-amber-50 rounded-xl border border-amber-100 p-3 flex flex-col justify-between">
                         <div className="h-2 w-1/2 bg-amber-200 rounded-full"></div>
                         <div className="flex items-end justify-between">
                            <div className="h-6 w-1/3 bg-amber-500 rounded-md"></div>
                            <Clock size={16} className="text-amber-400"/>
                         </div>
                       </div>
                     </div>
                     <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col gap-3 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-2">
                         <div className="h-3 w-1/4 bg-slate-300 rounded-full"></div>
                       </div>
                       {/* Table rows mockup */}
                       <div className="h-10 w-full bg-white rounded-lg border border-slate-200 flex items-center px-3 gap-3 shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0"></div>
                         <div className="h-2 w-1/3 bg-slate-300 rounded-full"></div>
                         <div className="h-2 w-1/4 bg-slate-200 rounded-full ml-auto"></div>
                       </div>
                       <div className="h-10 w-full bg-white rounded-lg border border-slate-200 flex items-center px-3 gap-3 shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0"></div>
                         <div className="h-2 w-1/2 bg-slate-300 rounded-full"></div>
                         <div className="h-2 w-1/6 bg-slate-200 rounded-full ml-auto"></div>
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
                <ShieldCheck size={14} /> Tu Información Segura y Clara
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                Diseñado para que <span className="text-indigo-600">no te equivoques.</span>
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-8">
                Sabemos que el estrés del día a día es alto. Por eso, VidaNova está construido para prevenir errores. Si olvidas llenar un dato importante, el sistema te avisa de forma amigable antes de guardar.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="bg-rose-50 p-2 rounded-lg shrink-0 mt-0.5">
                     <BellRing className="text-rose-600" size={20}/>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 mb-1">Semáforo de Alertas</span>
                    <span className="text-sm font-medium text-slate-600">Identifica con colores (rojo, amarillo, verde) qué pacientes requieren atención hoy o tienen órdenes a punto de vencer.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg shrink-0 mt-0.5">
                     <MessageSquare className="text-blue-600" size={20}/>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 mb-1">Notas Internas Colaborativas</span>
                    <span className="text-sm font-medium text-slate-600">Deja mensajes o etiquetas en el perfil del paciente para que el resto de tus compañeros de turno sepan qué pasó sin tener que llamarte.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-emerald-50 p-2 rounded-lg shrink-0 mt-0.5">
                     <CheckCircle2 className="text-emerald-600" size={20}/>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 mb-1">Autocompletado Inteligente</span>
                    <span className="text-sm font-medium text-slate-600">Escribe unas cuantas letras del diagnóstico y el sistema te sugiere el código correcto automáticamente.</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECCIÓN 3: FLUJO OPERATIVO (4 PASOS) --- */}
      <section id="flujo" className="relative z-10 py-24 bg-white/50 border-t border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Un flujo de trabajo diseñado para ti</h2>
            <p className="text-slate-600 text-lg">
              Desde que el paciente ingresa a la clínica hasta que termina su tratamiento, VidaNova te acompaña paso a paso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Línea conectora Desktop */}
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-1 bg-slate-100 z-0"></div>

            {/* Paso 1 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 shadow-inner border border-blue-100 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <Users size={28} className="text-blue-600" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">1. Ingreso Visual</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Al buscar al paciente, ves su foto, EPS y estado general en un segundo. Todo el contexto antes de saludarlo.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 shadow-inner border border-amber-100 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <Stethoscope size={28} className="text-amber-600" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">2. Evaluación</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Revisas qué trámites le faltan o qué barreras reportó en su última visita, leyendo las notas de tus compañeros.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-teal-300 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-50 shadow-inner border border-teal-100 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <Clock size={28} className="text-teal-600" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">3. Registro Rápido</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Llenas formularios con opciones desplegables. Agendas su próxima sesión de terapia con solo dos clics.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="relative bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 shadow-inner border border-indigo-100 rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <ClipboardList size={28} className="text-indigo-600" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">4. Seguimiento</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                El paciente pasa a tu lista de "Pendientes semanales". El sistema te recordará cuándo debes volver a contactarlo.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECCIÓN 4: HERRAMIENTAS EXTRAS (BENTO GRID) --- */}
      <section className="relative z-10 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Más herramientas útiles</h2>
            <p className="text-slate-500 font-medium mt-2 text-lg">Porque tu tiempo es valioso, automatizamos lo aburrido.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Analítica Visual (Largo) */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between group shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
              
              <div className="relative z-10 flex items-center justify-between mb-16">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <LineChart size={28} className="text-blue-400" />
                </div>
                <div className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest">
                  Tus Estadísticas
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-4">Tablero de Metas y Tareas</h3>
                <p className="text-slate-300 text-sm md:text-base max-w-lg leading-relaxed font-medium">
                  Comprende cómo va tu semana de un vistazo. Gráficos de colores te muestran cuántos casos tienes activos, cuántas llamadas te faltan por hacer hoy y tus tareas completadas. Una forma visual de organizar tu mente.
                </p>
              </div>
            </div>

            {/* Pilar 2 y 3 (Pequeños) */}
            <div className="flex flex-col gap-6">
              
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:border-slate-300 transition-all flex flex-col justify-between group shadow-sm flex-1">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Historial Inborrable</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">Si alguien modifica un dato, el sistema guarda quién fue y cuándo lo hizo. Así nunca hay confusiones en el equipo.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between group shadow-sm flex-1">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <FileDown size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Exportación Fácil</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">¿Necesitas pasarle un reporte a tu coordinador? Exporta la lista de tus pacientes o agendas a Excel o PDF con un solo clic.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* --- NUEVA SECCIÓN: PREGUNTAS FRECUENTES (FAQ) --- */}
      <section id="faq" className="relative z-10 py-24 bg-white border-t border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mb-4">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-slate-500 font-medium">Resolvemos las dudas más comunes de nuestros usuarios.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "¿Qué pasa si cometo un error al ingresar un dato?",
                a: "¡No te preocupes! El sistema te pedirá confirmación antes de guardar datos críticos. Si aún así te equivocas, puedes editar la información (dejando un registro del cambio) o solicitar a tu coordinador que lo ajuste."
              },
              {
                q: "¿Puedo ver la información desde mi celular o tablet?",
                a: "Sí, VidaNova está diseñado para adaptarse a diferentes tamaños de pantalla. Aunque recomendamos usar un computador para mayor comodidad al escribir historias clínicas, puedes revisar tu agenda perfectamente desde una tablet."
              },
              {
                q: "¿Qué hago si se cae el internet de la clínica?",
                a: "VidaNova es una plataforma en la nube. Si la red local falla, la información guardada hasta ese momento está segura. Una vez regrese la conexión, podrás continuar exactamente donde te quedaste."
              },
              {
                q: "¿Necesito instalar algún programa en mi computador?",
                a: "No. Solo necesitas un navegador web (como Google Chrome o Safari) y tus credenciales de acceso. Entras a la página, pones tu usuario y contraseña, y listo."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-all hover:border-blue-200">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-4 font-bold text-slate-800 flex justify-between items-center focus:outline-none"
                >
                  {faq.q}
                  <span className={`transform transition-transform ${activeFaq === index ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                    ▼
                  </span>
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-4 text-slate-600 text-sm leading-relaxed font-medium animate-in fade-in slide-in-from-top-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER INSTITUCIONAL --- */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-16 rounded-t-[3rem] max-w-7xl mx-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="bg-slate-800 p-3 rounded-xl shadow-inner border border-slate-700">
               <HeartPulse size={24} className="text-blue-400"/>
             </div>
             <div className="flex flex-col">
               <span className="font-black text-white text-base uppercase tracking-widest leading-none mb-1">IPS VidaNova</span>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plataforma de Gestión Visual</span>
             </div>
          </div>
          
          <div className="text-center md:text-right max-w-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-center md:justify-end gap-2">
              <LockKeyhole size={12} className="text-blue-400"/> Entorno Seguro
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Sistema diseñado exclusivamente para la comodidad de nuestros profesionales y la atención de pacientes. Información estrictamente confidencial bajo la Ley Estatutaria de Habeas Data.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}