"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Lock, Users, HelpCircle, 
  Camera, Save, Shield, Key, 
  Mail, Phone, Plus, Search, MapPin,
  BadgeCheck, Trash2, X, CheckCircle2,
  ChevronRight, Loader2, Zap, ShieldCheck, AlertCircle, FileText, LifeBuoy, MessageCircle
} from "lucide-react";
import api from "@/src/app/services/api";

const FAQS = [
  { q: "¿Cómo solicito un cambio de rol?", a: "Los roles son gestionados por TI. Envía un ticket a soporte." },
  { q: "¿Caducidad de contraseñas?", a: "Sí, el sistema solicita cambio cada 90 días por seguridad ISO 27001." },
  { q: "¿Exportar datos?", a: "Sí, desde el módulo de Analítica puedes descargar reportes." },
];



// --- DATOS DE AYUDA TÉCNICA (FUNCIONALIDADES) ---
const EXTENDED_FAQS = [
    {
        category: "📊 Torre de Control (Dashboard)",
        items: [
            { 
                q: "¿Qué indicadores muestra la Torre de Control?", 
                a: "La Torre de Control centraliza la operación en tiempo real. Muestra KPIs críticos: Total de Pacientes, Solicitudes Pendientes (sin gestión), Citas Agendadas y Casos Cerrados/Realizados. Además, visualiza la distribución de carga por aseguradora (EPS) y los procedimientos más solicitados del mes." 
            },
            { 
                q: "¿Cómo funcionan los Filtros Inteligentes?", 
                a: "El sistema permite segmentar la población por múltiples criterios simultáneos: Rango de Fechas, EPS, Estado de Gestión y, lo más importante, por Cohorte/Patología (ej: Ca. Mama, Ca. Próstata). Al seleccionar un filtro, todas las gráficas y la tabla de pacientes se recalculan instantáneamente." 
            },
            { 
                q: "¿Para qué sirve la Acción Masiva?", 
                a: "Permite gestionar múltiples pacientes a la vez. Selecciona varios registros en la tabla principal y usa el botón flotante 'Acción Masiva' para cambiar su estado (ej: pasar 10 pacientes a 'En Gestión') o agregar una nota de seguimiento idéntica a todos en un solo clic." 
            },
        ]
    },
    {
        category: "🧭 Gestión de Navegación & Pacientes",
        items: [
            { 
                q: "¿Qué es el Perfil 360 del Paciente?", 
                a: "Es la hoja de vida digital del paciente oncológico. Contiene sus datos demográficos validados, información de contacto (con acceso directo a WhatsApp), y un historial cronológico (Línea de Tiempo) de todas las interacciones, notas, cambios de estado y servicios solicitados." 
            },
            { 
                q: "¿Cómo registro un Nuevo Seguimiento?", 
                a: "Desde el perfil del paciente, usa el botón 'Nuevo Evento'. Puedes registrar: Llamadas (contestadas/no contestadas), Gestión Administrativa (autorizaciones), Asignación de Citas o Notas Clínicas. Cada evento queda firmado con tu usuario y fecha hora exacta." 
            },
            { 
                q: "¿Cómo se clasifican los servicios (CUPS)?", 
                a: "El sistema cuenta con un motor inteligente que lee los códigos CUPS o descripciones de servicios y los clasifica automáticamente en 9 modalidades visuales: Quimioterapia, Radioterapia, Cirugía, Imágenes, Laboratorio, Consulta, Estancia, Clínica de Dolor y Otros. Esto facilita la lectura rápida del plan de manejo." 
            },
        ]
    },
    {
        category: "📅 Agenda & Programación",
        items: [
            { 
                q: "¿Cómo interpreto la Agenda Médica?", 
                a: "La agenda muestra todas las citas programadas en un calendario interactivo. Cada cita tiene un código de color según su modalidad (ej: Violeta para Quimioterapia, Azul para Consultas). Puedes cambiar entre vista Mensual, Semanal o Lista del día." 
            },
            { 
                q: "¿El calendario se sincroniza con los pacientes?", 
                a: "Sí. Cuando cambias el estado de un paciente a 'AGENDADO' y asignas una fecha en su perfil, este evento aparece automáticamente en la Agenda Médica. Al hacer clic en un evento del calendario, se abre una tarjeta con los detalles del paciente y notas clínicas." 
            },
        ]
    },
    {
        category: "📂 Importación & Datos",
        items: [
            { 
                q: "¿Cómo funciona la Importación Masiva?", 
                a: "El módulo de importación permite cargar archivos Excel (.xlsx, .csv) generados por el sistema de historia clínica. El software valida la estructura, detecta duplicados, normaliza los nombres de servicios y crea automáticamente los perfiles de pacientes nuevos, poniéndolos en estado 'PENDIENTE' para iniciar la navegación." 
            },
            { 
                q: "¿Cómo descargo la Sábana de Datos?", 
                a: "En el menú lateral, usa la opción 'Exportar' o 'Backup'. El sistema generará un archivo Excel maestro con dos hojas: 1) Directorio de Pacientes actualizado y 2) Informe detallado de gestión, desglosando cada nota en columnas (Profesional, Diagnóstico, Barreras, etc.) listo para auditoría." 
            }
        ]
    }
];
// =========================================================
// COMPONENTES UI REUTILIZABLES (MOVIDOS AFUERA)
// =========================================================

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
  <div className="mb-6">
      <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 font-medium">{sub}</p>
  </div>
);

const InputField = ({ label, icon: Icon, value, onChange, type = "text", disabled = false, placeholder = "" }: any) => (
  <div className="group space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
      <div className={`flex items-center gap-3 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 transition-all duration-200 ${!disabled ? 'focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 hover:border-slate-300' : 'opacity-60 cursor-not-allowed'}`}>
          {Icon && <Icon size={18} className={`text-slate-400 ${!disabled && 'group-focus-within:text-blue-500'} transition-colors`}/>}
          <input 
              type={type} 
              // ✅ Si value es null o undefined, forzamos un string vacío
              value={value ?? ""} 
              onChange={onChange}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
          />
          {disabled && <Lock size={14} className="text-slate-400"/>}
      </div>
  </div>
);

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // --- ESTADOS DE DATOS ---
  const [team, setTeam] = useState<any[]>([]); 
  const [profileData, setProfileData] = useState({ 
    name: "", phone: "", email: "", role: "", 
    avatarColor: "from-indigo-500 to-purple-600", 
    bio: "Especialista en gestión oncológica",
    location: "Popayán, Cauca"
  }); 
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  
  // --- MODAL ---
  const [showModal, setShowModal] = useState(false);
const [newUser, setNewUser] = useState({ 
  name: "", 
  documentNumber: "", // ✅ Añadido
  email: "", 
  password: "", 
  role: "NAVIGATOR" 
});
  // =========================================================
  // CARGA DE DATOS
  // =========================================================
  useEffect(() => {
    if (activeTab === "equipo") fetchTeam();
    if (activeTab === "perfil") fetchMyProfile();
  }, [activeTab]);

  const fetchTeam = async () => {
    try {
      const res = await api.get("/users");
      const enhancedTeam = res.data.map((u: any) => ({
        ...u,
        initials: u.name ? u.name.substring(0, 2).toUpperCase() : "U",
        avatarColor: u.role === 'COORDINATOR_NAVIGATOR' ? 'from-fuchsia-500 to-pink-600' : 'from-slate-500 to-slate-600'
      }));
      setTeam(enhancedTeam);
    } catch (error) { console.error("Error", error); }
  };

  const fetchMyProfile = async () => {
    try {
      const res = await api.get("/users/me");
      
      // ✅ Normalizamos los datos: si vienen nulos, los convertimos en strings vacíos
      const safeData = {
        name: res.data.name || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        role: res.data.role || "",
        avatarColor: res.data.avatarColor || "from-indigo-500 to-purple-600",
        bio: res.data.bio || "Especialista en gestión oncológica",
        location: res.data.location || "Popayán, Cauca"
      };
      
      setProfileData(safeData);
    } catch (error) { 
      console.error("Error al cargar perfil", error); 
    }
  };

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await api.put("/users/me", { name: profileData.name, phone: profileData.phone });
        setTimeout(() => { alert("✅ Perfil guardado"); setIsLoading(false); }, 600);
    } catch (error: any) { alert("Error al guardar"); setIsLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("Las contraseñas no coinciden");
    setIsLoading(true);
    try {
        await api.put("/users/me/password", { currentPassword: passData.current, newPassword: passData.new });
        alert("✅ Contraseña actualizada.");
        setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) { alert("Error al cambiar contraseña"); } 
    finally { setIsLoading(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica rápida
    if (!newUser.documentNumber || !newUser.password) {
        return alert("La cédula y la contraseña son obligatorias para el acceso.");
    }

    setIsLoading(true);
    try {
        await api.post("/users", newUser);
        alert("✅ Usuario creado y habilitado para ingresar con su cédula.");
        setShowModal(false);
        setNewUser({ name: "", documentNumber: "", email: "", password: "", role: "NAVIGATOR" });
        fetchTeam();
    } catch (error: any) { 
        alert(error.response?.data?.error || "Error al crear usuario"); 
    } 
    finally { setIsLoading(false); }
};

  const handleDeleteUser = async (id: number) => {
    if(!confirm("¿Eliminar usuario?")) return;
    try {
        await api.delete(`/users/${id}`);
        setTeam(prev => prev.filter(u => u.id !== id));
    } catch (error: any) { alert("Error al eliminar"); }
  };

  const filteredTeam = team.filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // =========================================================
  // RENDERIZADO
  // =========================================================
  const renderContent = () => {
      switch (activeTab) {
          
          // --- TAB PERFIL (BOTÓN MEJORADO) ---
          case "perfil":
              return (
                  <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          
                          {/* Columna Izquierda: Tarjeta Visual */}
                          <div className="lg:col-span-4 space-y-6">
                              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden group hover:shadow-md transition-all">
                                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-800 to-slate-900"></div>
                                  
                                  <div className="relative z-10 mt-12 mb-4 inline-block">
                                      <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${profileData.avatarColor} p-1 shadow-xl ring-4 ring-white`}>
                                          <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-4xl text-white font-black backdrop-blur-sm">
                                              {profileData.name ? profileData.name.substring(0,2).toUpperCase() : "ME"}
                                          </div>
                                      </div>
                                  </div>

                                  <h3 className="text-xl font-black text-slate-900">{profileData.name || "Usuario"}</h3>
                                  <p className="text-sm text-slate-500 font-medium mb-6">{profileData.email}</p>

                                  <div className="flex justify-center gap-2 mb-6">
                                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wide">
                                          {profileData.role.replace('_', ' ')}
                                      </span>
                                  </div>
                              </div>
                          </div>

                          {/* Columna Derecha: Formulario */}
                          <div className="lg:col-span-8">
                              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-full">
                                  <SectionHeader title="Información Personal" sub="Actualiza tus datos de contacto y ubicación." />
                                  
                                  <form onSubmit={handleSaveProfile} className="space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <InputField 
                                              label="Nombre Completo" 
                                              icon={User} 
                                              value={profileData.name} 
                                              onChange={(e: any) => setProfileData({...profileData, name: e.target.value})} 
                                          />

                                            <InputField 
                                                label="Correo Electrónico (Opcional)" 
                                                icon={Mail} 
                                                value={profileData.email} 
                                                // ✅ Cambiamos la lógica: 
                                                // Solo se bloquea si el usuario NO es SUPER_ADMIN. 
                                                // Si eres el administrador, siempre debes poder editarlo.
                                                disabled={profileData.role !== 'SUPER_ADMIN'} 
                                                onChange={(e: any) => setProfileData({...profileData, email: e.target.value})} 
                                                placeholder="ejemplo@vidanova.com"
                                            />
                                          <InputField 
                                              label="Teléfono" 
                                              icon={Phone} 
                                              value={profileData.phone} 
                                              onChange={(e: any) => setProfileData({...profileData, phone: e.target.value})} 
                                              placeholder="+57..."
                                          />
                                          <InputField 
                                              label="Sede Principal" 
                                              icon={MapPin} 
                                              value={profileData.location} 
                                              onChange={(e: any) => setProfileData({...profileData, location: e.target.value})} 
                                          />
                                          <div className="md:col-span-2">
                                              <InputField 
                                                  label="Cargo / Bio" 
                                                  icon={BadgeCheck} 
                                                  value={profileData.bio} 
                                                  onChange={(e: any) => setProfileData({...profileData, bio: e.target.value})} 
                                              />
                                          </div>
                                      </div>

                                      <div className="flex justify-end pt-6 border-t border-slate-50">
                                          {/* 🔥 BOTÓN MEJORADO */}
                                          <button 
                                            type="submit" 
                                            disabled={isLoading} 
                                            className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                          >
                                              {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} className="group-hover:scale-110 transition-transform"/>}
                                              <span>Guardar Cambios</span>
                                          </button>
                                      </div>
                                  </form>
                              </div>
                          </div>
                      </div>
                  </div>
              );

          // --- TAB SEGURIDAD (LIMPIO Y CENTRADO) ---
          case "seguridad":
              return (
                  <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
                      {/* Se eliminó la columna izquierda (Score y 2FA) */}
                      
                      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg shadow-slate-200/50 border border-slate-100">
                          <div className="text-center mb-8">
                              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                  <Lock size={28}/>
                              </div>
                              <h2 className="text-2xl font-black text-slate-900">Seguridad de la Cuenta</h2>
                              <p className="text-slate-500 mt-2">Gestiona tu contraseña de acceso. Se recomienda actualizarla periódicamente.</p>
                          </div>
                          
                          <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg mx-auto">
                              <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                <InputField 
                                    label="Contraseña Actual" 
                                    icon={Lock} 
                                    type="password"
                                    value={passData.current}
                                    onChange={(e:any) => setPassData({...passData, current: e.target.value})}
                                    placeholder="••••••••"
                                />
                              </div>

                              <div className="h-px bg-slate-100 w-full my-4"></div>

                              <div className="space-y-4">
                                  <InputField 
                                      label="Nueva Contraseña" 
                                      icon={Key} 
                                      type="password"
                                      value={passData.new}
                                      onChange={(e:any) => setPassData({...passData, new: e.target.value})}
                                      placeholder="Mínimo 6 caracteres"
                                  />
                                  <InputField 
                                      label="Confirmar Nueva" 
                                      icon={CheckCircle2} 
                                      type="password"
                                      value={passData.confirm}
                                      onChange={(e:any) => setPassData({...passData, confirm: e.target.value})}
                                      placeholder="Repetir contraseña nueva"
                                  />
                              </div>

                              <div className="pt-6">
                                  {/* 🔥 BOTÓN MEJORADO */}
                                  <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70"
                                  >
                                      {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                                      <span>Actualizar Seguridad</span>
                                  </button>
                                  
                                  <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                                      <AlertCircle size={12}/>
                                      La sesión se cerrará automáticamente al cambiar la contraseña.
                                  </p>
                              </div>
                          </form>
                      </div>
                  </div>
              );

          // --- TAB EQUIPO (DISEÑO MEJORADO) ---
          case "equipo":
              return (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Barra de Herramientas */}
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-4 z-20">
                          <div className="relative w-full md:w-96 group">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
                              <input 
                                  type="text" 
                                  placeholder="Buscar miembro del equipo..." 
                                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500/30 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                          
                      </div>

                      {/* Grid de Equipo Premium */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                          {filteredTeam.map((member) => (
                              <div key={member.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                  {/* Fondo Decorativo Superior */}
                                  <div className={`h-24 bg-gradient-to-r ${member.avatarColor} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                                  
                                  <div className="px-6 pb-6 relative">
                                      {/* Avatar Superpuesto */}
                                      <div className="flex justify-between items-end -mt-10 mb-4">
                                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.avatarColor} p-1 shadow-lg ring-4 ring-white`}>
                                              <div className="w-full h-full rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-2xl">
                                                  {member.initials}
                                              </div>
                                          </div>
                                          
                                          {/* Botón Eliminar Discreto */}
                                          <button 
                                            onClick={() => handleDeleteUser(member.id)} 
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all mb-1"
                                            title="Eliminar usuario"
                                          >
                                              <Trash2 size={18}/>
                                          </button>
                                      </div>
                                      
                                      {/* Info del Usuario */}
                                      <div>
                                          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                              {member.name}
                                              {['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR'].includes(member.role) && (
                                                  <BadgeCheck size={18} className="text-blue-500" fill="currentColor" color="white"/>
                                              )}
                                          </h3>
                                          <p className="text-sm text-slate-500 font-medium mb-5 truncate">{member.email}</p>
                                          
                                          {/* Badges de Rol y Estado */}
                                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                                                  ['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR'].includes(member.role) 
                                                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                  : 'bg-slate-50 text-slate-600 border-slate-100'
                                              }`}>
                                                  {member.role.replace('_', ' ')}
                                              </span>
                                              
                                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                  <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                  </span>
                                                  Activo
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          
                          {/* Tarjeta "Agregar Nuevo" (Placeholder visual) */}
                          <button 
                            onClick={() => setShowModal(true)}
                            className="group flex flex-col items-center justify-center h-full min-h-[240px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300"
                          >
                              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300 mb-4">
                                  <Plus size={32}/>
                              </div>
                              <span className="font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Invitar nuevo miembro</span>
                          </button>
                      </div>
                  </div>
              );
              

          // --- TAB AYUDA: DOCUMENTACIÓN FUNCIONAL ---
          case "ayuda":
              return (
                  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                      
                      {/* Encabezado Informativo */}
                      <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 shadow-sm">
                              <LifeBuoy size={36} />
                          </div>
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Manual de Funcionalidades</h2>
                          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                              Explora la documentación detallada sobre los módulos clave del sistema <strong>Vidanova</strong> y aprende a sacar el máximo provecho de las herramientas de navegación.
                          </p>
                      </div>

                      {/* Buscador de Temas */}
                      <div className="mb-10 relative group max-w-xl mx-auto">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                          </div>
                          <input 
                              type="text" 
                              placeholder="Buscar funcionalidad (ej: Importación, Filtros...)" 
                              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/30 text-slate-700 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          />
                      </div>

                      {/* Acordeón de Funcionalidades */}
                      <div className="space-y-8">
                          {EXTENDED_FAQS.map((section, idx) => (
                              <div key={idx} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                  {/* Título de la Categoría */}
                                  <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                      <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">{section.category}</h3>
                                  </div>
                                  
                                  {/* Lista de Preguntas */}
                                  <div className="divide-y divide-slate-100">
                                      {section.items.map((item, i) => {
                                          const uniqueId = idx * 100 + i;
                                          const isOpen = expandedFaq === uniqueId;
                                          return (
                                              <div key={i} className={`group transition-all duration-300 ${isOpen ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                                                  <button 
                                                      onClick={() => setExpandedFaq(isOpen ? null : uniqueId)} 
                                                      className="w-full flex items-start justify-between p-6 text-left cursor-pointer focus:outline-none"
                                                  >
                                                      <div className="flex gap-4">
                                                          <span className={`mt-0.5 min-w-[24px] flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                              {i + 1}
                                                          </span>
                                                          <span className={`font-bold text-base transition-colors ${isOpen ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                              {item.q}
                                                          </span>
                                                      </div>
                                                      <div className={`ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`}>
                                                          <ChevronRight size={20} className="rotate-90"/>
                                                      </div>
                                                  </button>
                                                  
                                                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}>
                                                      <div className="overflow-hidden px-6 ml-10">
                                                          <div className="text-sm text-slate-600 leading-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                              {item.a}
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Footer de Soporte Real */}
                      <div className="mt-12 text-center border-t border-slate-200 pt-8">
                          <p className="text-slate-400 text-sm mb-4">¿Tienes un problema técnico no listado aquí?</p>
                          <div className="flex justify-center gap-4">
                              <a href="mailto:soporte@vidanova.com" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                                  <Mail size={16}/> soporte@vidanova.com
                              </a>
                              <a href="tel:+576028200000" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm">
                                  <Phone size={16}/> (602) 820-0000
                              </a>
                          </div>
                      </div>
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      <div className="max-w-7xl mx-auto p-6 md:p-10">
          {/* Header Global */}
          <div className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Configuración</h1>
              <p className="text-lg text-slate-500 font-medium">Administra tu cuenta y las preferencias del sistema.</p>
          </div>

          {/* Menú de Navegación */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {[
                  { id: 'perfil', label: 'Mi Perfil', icon: User }, 
                  { id: 'seguridad', label: 'Seguridad', icon: Lock }, 
                  { id: 'equipo', label: 'Equipo', icon: Users }, 
                  { id: 'ayuda', label: 'Ayuda', icon: HelpCircle }
              ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap 
                        ${activeTab === tab.id 
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
                        }`}
                  >
                      <tab.icon size={16} strokeWidth={2.5}/> {tab.label}
                  </button>
              ))}
          </div>

          {/* Contenido Principal */}
          <div className="min-h-[600px]">{renderContent()}</div>
      </div>

      {/* Modal Crear Usuario (Compacto & Premium) */}
{showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
        {/* Contenedor principal con bordes más suaves y sombra difusa */}
        <div className="bg-white w-full max-w-md rounded-[1.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 relative border border-slate-100">
            
            {/* Header Elegante con Gradiente Sutil */}
            <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 flex justify-between items-center border-b border-slate-100">
                <div className="flex items-center gap-3">
                    {/* Icono con fondo suave */}
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm shadow-blue-100/50">
                        <Users size={20} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-800 leading-none tracking-tight">Nuevo Miembro</h3>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Datos de acceso al sistema</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(false)} 
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200"
                >
                    <X size={18}/>
                </button>
            </div>
            
            {/* Cuerpo del Formulario (Fondo blanco limpio) */}
            <div className="p-6 pt-6 bg-white">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    
                    {/* Nombre */}
                    <InputField 
                        label="Nombre Completo" 
                        value={newUser.name} 
                        onChange={(e:any) => setNewUser({...newUser, name: e.target.value})} 
                        placeholder="Ej: Ana Pérez"
                        icon={User}
                    />

                    {/* Grid Compacto para Cédula y Password */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField 
                            label="Cédula (Login)" 
                            value={newUser.documentNumber} 
                            onChange={(e:any) => setNewUser({...newUser, documentNumber: e.target.value})} 
                            placeholder="1061..."
                            icon={Shield} 
                        />
                         <InputField 
                            label="Contraseña" 
                            value={newUser.password} 
                            onChange={(e:any) => setNewUser({...newUser, password: e.target.value})} 
                            placeholder="Clave123*"
                            icon={Key}
                            type="password"
                        />
                    </div>

                    {/* Selector de Rol Estilizado (Coherente con los inputs) */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Rol Asignado</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <ShieldCheck size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
                            </div>
                            <select 
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-300" 
                                value={newUser.role} 
                                onChange={e => setNewUser({...newUser, role: e.target.value})}
                            >
                                <option value="NAVIGATOR">Navegador Operativo</option>
                                <option value="COORDINATOR_NAVIGATOR">Coordinador Navegador</option> 
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <ChevronRight size={16} className="text-slate-400 rotate-90 group-hover:text-slate-600 transition-colors"/>
                            </div>
                        </div>
                    </div>

                    {/* Email Opcional (Separado sutilmente) */}
                    <div className="pt-2 mt-2 border-t border-slate-50/80">
                        <InputField 
                            label="Correo (Opcional)" 
                            type="email" 
                            value={newUser.email} 
                            onChange={(e:any) => setNewUser({...newUser, email: e.target.value})} 
                            placeholder="correo@vidanova.com"
                            icon={Mail}
                        />
                    </div>

                    {/* Botón de Acción Premium */}
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18}/> : "Crear e Invitar Usuario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}

      <style jsx>{`
        .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background-color: #0f172a; color: white; padding: 0.875rem 2rem; border-radius: 1rem; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .btn-primary:hover { background-color: #1e293b; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .btn-primary:active { transform: translateY(0); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}