"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Lock, HelpCircle, Save, Key, 
  Mail, Phone, Search, MapPin,
  BadgeCheck, X, CheckCircle2,
  ChevronRight, Loader2, ShieldCheck, AlertCircle, LifeBuoy,
  MessageCircle // ✅ Icono agregado a la importación
} from "lucide-react";
import api from "@/src/app/services/api";

// --- DOCUMENTACIÓN FUNCIONAL (SOPORTE) ---
const EXTENDED_FAQS = [
    {
        category: "📊 Tablero de Atención",
        items: [
            { 
                q: "¿Qué indicadores muestra mi Tablero?", 
                a: "Muestra KPIs operativos en tiempo real: Casos Críticos (pendientes con más de 15 días), Citas Agendadas para hoy/semana, Gestiones Realizadas (casos cerrados) y Carga Total asignada a tu perfil." 
            },
            { 
                q: "¿Cómo funcionan los Filtros de Cohorte?", 
                a: "Puedes segmentar pacientes por patología (CAC Mama, CAC Cérvix, etc.) o por modalidad de servicio. Al seleccionar un filtro, la tabla se actualiza automáticamente para que priorices tu jornada." 
            }
        ]
    },
    {
        category: "🧭 Gestión de Casos",
        items: [
            { 
                q: "¿Qué es el Perfil 360 del Paciente?", 
                a: "Es el expediente digital unificado. Incluye datos de contacto rápidos (WhatsApp), historial de notas cronológicas y el estado actual de cada trámite administrativo o clínico." 
            },
            { 
                q: "¿Cómo registro una gestión?", 
                a: "Dentro del perfil del paciente, usa el botón 'Gestionar'. Podrás asignar fechas de cita, registrar autorizaciones de EPS o escribir notas de seguimiento que quedarán firmadas con tu usuario." 
            }
        ]
    },
    {
        category: "📅 Agenda Médica",
        items: [
            { 
                q: "¿Cómo se sincroniza el calendario?", 
                a: "Al agendar una cita en el perfil del paciente, esta aparece automáticamente en la 'Agenda Médica' con un código de color según el servicio (ej: Verde para Consultas, Violeta para Quimioterapia)." 
            }
        ]
    }
];

// --- COMPONENTE UI: INPUT ---
const InputField = ({ label, icon: Icon, value, onChange, type = "text", disabled = false, placeholder = "" }: any) => (
  <div className="group space-y-1.5">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 transition-all duration-300 ${!disabled ? 'focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 hover:border-slate-300' : 'bg-slate-50 opacity-60 cursor-not-allowed'}`}>
          {Icon && <Icon size={18} className={`text-slate-400 ${!disabled && 'group-focus-within:text-emerald-500'} transition-colors`}/>}
          <input 
              type={type} 
              value={value ?? ""} 
              onChange={onChange}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
          />
          {disabled && <Lock size={14} className="text-slate-300"/>}
      </div>
  </div>
);

export default function ConfigAtencionPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // --- ESTADOS DE DATOS ---
  const [profileData, setProfileData] = useState({ 
    name: "", phone: "", email: "", role: "", 
    avatarColor: "from-emerald-500 to-teal-600", 
    bio: "Navegador de atención oncológica",
    location: "Popayán, Cauca"
  }); 
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  
  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
    try {
      const res = await api.get("/users/me");
      const safeData = {
        name: res.data.name || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        role: res.data.role || "NAVIGATOR",
        avatarColor: "from-emerald-500 to-teal-600",
        bio: res.data.bio || "Especialista en atención operativa",
        location: res.data.location || "Popayán, Cauca"
      };
      setProfileData(safeData);
    } catch (error) { console.error("Error al cargar perfil", error); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await api.put("/users/me", { 
            name: profileData.name, 
            phone: profileData.phone,
            email: profileData.email,
            bio: profileData.bio,
            location: profileData.location
        });
        alert("✅ Perfil actualizado correctamente");
    } catch (error: any) { alert("Error al guardar cambios"); } 
    finally { setIsLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("Las contraseñas no coinciden");
    setIsLoading(true);
    try {
        await api.put("/users/me/password", { currentPassword: passData.current, newPassword: passData.new });
        alert("✅ Seguridad actualizada. Tu sesión es ahora más segura.");
        setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) { alert("Error: La contraseña actual es incorrecta"); } 
    finally { setIsLoading(false); }
  };

  const renderContent = () => {
      switch (activeTab) {
          case "perfil":
              return (
                <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group transition-all">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-600 to-teal-700"></div>
                                <div className="relative z-10 mt-8 mb-6">
                                    <div className={`w-32 h-32 rounded-[2rem] bg-gradient-to-br ${profileData.avatarColor} p-1 shadow-2xl ring-8 ring-white mx-auto`}>
                                        <div className="w-full h-full rounded-[1.8rem] bg-white/10 flex items-center justify-center text-5xl text-white font-black backdrop-blur-sm uppercase">
                                            {profileData.name ? profileData.name.substring(0,2) : "NV"}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{profileData.name || "Navegador"}</h3>
                                <div className="mt-4 flex justify-center">
                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                                        {profileData.role.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><User size={20}/></div>
                                    Ajustes de Perfil
                                </h2>
                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField label="Nombre Completo" icon={User} value={profileData.name} onChange={(e: any) => setProfileData({...profileData, name: e.target.value})} />
                                        <InputField label="Correo de Contacto" icon={Mail} value={profileData.email} onChange={(e: any) => setProfileData({...profileData, email: e.target.value})} placeholder="ejemplo@vidanova.com" />
                                        <InputField label="Teléfono / WhatsApp" icon={Phone} value={profileData.phone} onChange={(e: any) => setProfileData({...profileData, phone: e.target.value})} />
                                        <InputField label="Ciudad / Sede" icon={MapPin} value={profileData.location} onChange={(e: any) => setProfileData({...profileData, location: e.target.value})} />
                                        <div className="md:col-span-2">
                                            <InputField label="Tu Perfil Profesional / Bio" icon={BadgeCheck} value={profileData.bio} onChange={(e: any) => setProfileData({...profileData, bio: e.target.value})} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full md:w-fit px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                        {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                        Guardar Información
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
              );

          case "seguridad":
              return (
                  <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
                      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                          <div className="text-center mb-10">
                              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                  <Lock size={32}/>
                              </div>
                              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Cambiar Contraseña</h2>
                              <p className="text-slate-500 mt-2 font-medium">Asegura tu cuenta con una clave de alta seguridad.</p>
                          </div>
                          
                          <form onSubmit={handleChangePassword} className="space-y-6">
                              <InputField label="Contraseña Actual" icon={Lock} type="password" value={passData.current} onChange={(e:any) => setPassData({...passData, current: e.target.value})} placeholder="••••••••" />
                              <div className="h-px bg-slate-100 w-full my-4"></div>
                              <InputField label="Nueva Contraseña" icon={Key} type="password" value={passData.new} onChange={(e:any) => setPassData({...passData, new: e.target.value})} placeholder="Mínimo 8 caracteres" />
                              <InputField label="Repetir Nueva Contraseña" icon={CheckCircle2} type="password" value={passData.confirm} onChange={(e:any) => setPassData({...passData, confirm: e.target.value})} placeholder="Confirmar cambios" />
                              <button type="submit" disabled={isLoading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                                  {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                                  Actualizar Seguridad
                              </button>
                          </form>
                      </div>
                  </div>
              );

          case "ayuda":
              return (
                  <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                      <div className="text-center py-10">
                          <div className="inline-flex items-center justify-center p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] mb-6 shadow-sm border border-emerald-100">
                              <LifeBuoy size={40} />
                          </div>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Centro de Soporte</h2>
                          <p className="text-slate-500 max-w-xl mx-auto font-medium mt-4">
                              Manual operativo y guía de funcionalidades del sistema Vidanova.
                          </p>
                      </div>

                      <div className="space-y-6">
                          {EXTENDED_FAQS.map((section, idx) => (
                              <div key={idx} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                  <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100">
                                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-3">
                                          <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                          {section.category}
                                      </h3>
                                  </div>
                                  <div className="divide-y divide-slate-100">
                                      {section.items.map((item, i) => {
                                          const uniqueId = idx * 100 + i;
                                          const isOpen = expandedFaq === uniqueId;
                                          return (
                                              <div key={i} className={`transition-all ${isOpen ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'}`}>
                                                  <button onClick={() => setExpandedFaq(isOpen ? null : uniqueId)} className="w-full flex items-start justify-between p-7 text-left outline-none">
                                                      <span className={`font-bold text-base leading-tight ${isOpen ? 'text-emerald-900' : 'text-slate-700'}`}>{item.q}</span>
                                                      <ChevronRight size={20} className={`ml-4 transition-all ${isOpen ? 'rotate-90 text-emerald-600' : 'text-slate-300'}`}/>
                                                  </button>
                                                  {isOpen && (
                                                      <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                                                          <div className="text-sm text-slate-600 leading-relaxed bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm font-medium">
                                                              {item.a}
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* CANALES DE SOPORTE TÉCNICO */}
                      <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-10 text-center relative overflow-hidden shadow-2xl">
                          <div className="absolute top-0 right-0 p-6 opacity-5 text-white"><MessageCircle size={150}/></div>
                          <h4 className="text-white font-black uppercase tracking-widest text-lg mb-2 relative z-10">¿Problemas con el sistema?</h4>
                          <p className="text-slate-400 font-medium mb-10 relative z-10">Contacta directamente con el equipo de soporte técnico TI.</p>
                          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                              <a href="mailto:soporte@vidanova.com" className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10 shadow-lg">
                                  <Mail size={18} className="text-emerald-400"/> soporte@vidanova.com
                              </a>
                              <a href="tel:+576028200000" className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20">
                                  <Phone size={18}/> (602) 820-0000
                              </a>
                          </div>
                      </div>
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Configuración</h1>
              <p className="text-lg text-slate-500 font-medium tracking-tight">Personaliza tu perfil y obtén asistencia técnica inmediata.</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {[
                  { id: 'perfil', label: 'Mi Perfil', icon: User }, 
                  { id: 'seguridad', label: 'Seguridad', icon: Lock }, 
                  { id: 'ayuda', label: 'Soporte Técnico', icon: HelpCircle }
              ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all 
                        ${activeTab === tab.id 
                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                            : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-200'
                        }`}
                  >
                      <tab.icon size={16} strokeWidth={3}/> {tab.label}
                  </button>
              ))}
          </div>

          <div className="min-h-[600px]">{renderContent()}</div>
      </div>
      <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}   