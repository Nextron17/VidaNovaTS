"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Lock, Users, HelpCircle, 
  Camera, Save, Shield, Key, 
  Mail, Phone, Plus, Search, MapPin,
  BadgeCheck, Trash2, X, CheckCircle2,
  ChevronRight, Loader2, Zap, ShieldCheck, AlertCircle
} from "lucide-react";
import api from "@/src/app/services/api";

const FAQS = [
  { q: "¿Cómo solicito un cambio de rol?", a: "Los roles son gestionados por TI. Envía un ticket a soporte." },
  { q: "¿Caducidad de contraseñas?", a: "Sí, el sistema solicita cambio cada 90 días por seguridad ISO 27001." },
  { q: "¿Exportar datos?", a: "Sí, desde el módulo de Analítica puedes descargar reportes." },
];

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
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "NAVIGATOR" });

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
        // Colores aleatorios consistentes para avatares
        avatarColor: u.role === 'COORDINATOR' ? 'from-fuchsia-500 to-pink-600' : 'from-slate-500 to-slate-600'
      }));
      setTeam(enhancedTeam);
    } catch (error) { console.error("Error", error); }
  };

  const fetchMyProfile = async () => {
    try {
      const res = await api.get("/users/me");
      setProfileData({ ...profileData, ...res.data });
    } catch (error) { console.error("Error", error); }
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
    setIsLoading(true);
    try {
        await api.post("/users", newUser);
        alert("✅ Usuario invitado");
        setShowModal(false);
        setNewUser({ name: "", email: "", password: "", role: "NAVIGATOR" });
        fetchTeam();
    } catch (error: any) { alert("Error al crear usuario"); } 
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
  // COMPONENTES UI REUTILIZABLES
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
                value={value} 
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
  // RENDERIZADO
  // =========================================================
  const renderContent = () => {
      switch (activeTab) {
          
          // --- TAB PERFIL ---
          case "perfil":
              return (
                  <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          
                          {/* Columna Izquierda: Tarjeta de Perfil Visual */}
                          <div className="lg:col-span-4 space-y-6">
                              <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center relative overflow-hidden">
                                  {/* Background Decorativo */}
                                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
                                  
                                  <div className="relative z-10 mt-12 mb-4 inline-block">
                                      <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${profileData.avatarColor} p-1 shadow-xl ring-4 ring-white`}>
                                          <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-4xl text-white font-black">
                                              {profileData.name ? profileData.name.substring(0,2).toUpperCase() : "ME"}
                                          </div>
                                      </div>
                                      <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform">
                                          <Camera size={14}/>
                                      </button>
                                  </div>

                                  <h3 className="text-xl font-black text-slate-900">{profileData.name || "Cargando..."}</h3>
                                  <p className="text-sm text-slate-500 font-medium mb-6">{profileData.email}</p>

                                  <div className="flex justify-center gap-2 mb-6">
                                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
                                          {profileData.role.replace('_', ' ')}
                                      </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                                      <div className="text-center">
                                          <p className="text-xs text-slate-400 font-bold uppercase">Pacientes</p>
                                          <p className="text-xl font-black text-slate-800">1,240</p>
                                      </div>
                                      <div className="text-center border-l border-slate-100">
                                          <p className="text-xs text-slate-400 font-bold uppercase">Eficacia</p>
                                          <p className="text-xl font-black text-emerald-500">98%</p>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Columna Derecha: Formulario */}
                          <div className="lg:col-span-8">
                              <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
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
                                              label="Correo Corporativo" 
                                              icon={Mail} 
                                              value={profileData.email} 
                                              disabled={true} 
                                          />
                                          <InputField 
                                              label="Teléfono / Móvil" 
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
                                                  label="Bio / Cargo" 
                                                  icon={BadgeCheck} 
                                                  value={profileData.bio} 
                                                  onChange={(e: any) => setProfileData({...profileData, bio: e.target.value})} 
                                              />
                                          </div>
                                      </div>

                                      <div className="flex justify-end pt-4 border-t border-slate-50">
                                          <button type="submit" disabled={isLoading} className="btn-primary">
                                              {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                              <span>Guardar Cambios</span>
                                          </button>
                                      </div>
                                  </form>
                              </div>
                          </div>
                      </div>
                  </div>
              );

          // --- TAB SEGURIDAD ---
          case "seguridad":
              return (
                  <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                          
                          {/* Panel Izquierdo: Estado y 2FA */}
                          <div className="md:col-span-5 space-y-6">
                              {/* Tarjeta de Score de Seguridad */}
                              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                                  <ShieldCheck size={120} className="absolute -right-6 -bottom-6 text-white/5 rotate-12"/>
                                  <div className="relative z-10">
                                      <div className="flex items-center gap-3 mb-4">
                                          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                              <ShieldCheck size={24}/>
                                          </div>
                                          <span className="font-bold text-lg">Estado: Seguro</span>
                                      </div>
                                      <p className="text-slate-400 text-sm mb-6">Tu cuenta cumple con los protocolos de seguridad requeridos por la organización.</p>
                                      
                                      <div className="space-y-2">
                                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                              <span>Fortaleza</span>
                                              <span className="text-emerald-400">Excelente</span>
                                          </div>
                                          <div className="w-full bg-white/10 rounded-full h-1.5">
                                              <div className="bg-emerald-400 h-1.5 rounded-full w-[95%] shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Tarjeta 2FA (Simulada) */}
                              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                  <div className="flex items-start justify-between">
                                      <div className="flex gap-3">
                                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl h-fit">
                                              <Zap size={20}/>
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-slate-800">Autenticación en 2 Pasos</h4>
                                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Añade una capa extra de seguridad usando tu celular.</p>
                                          </div>
                                      </div>
                                      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-pointer">
                                          <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"/>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Panel Derecho: Cambio de Contraseña */}
                          <div className="md:col-span-7">
                              <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                                  <SectionHeader title="Cambiar Contraseña" sub="Se recomienda usar una contraseña única y segura." />
                                  
                                  <form onSubmit={handleChangePassword} className="space-y-5">
                                      <InputField 
                                          label="Contraseña Actual" 
                                          icon={Lock} 
                                          type="password"
                                          value={passData.current}
                                          onChange={(e:any) => setPassData({...passData, current: e.target.value})}
                                      />
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                          <InputField 
                                              label="Nueva Contraseña" 
                                              icon={Key} 
                                              type="password"
                                              value={passData.new}
                                              onChange={(e:any) => setPassData({...passData, new: e.target.value})}
                                              placeholder="Mín. 6 caracteres"
                                          />
                                          <InputField 
                                              label="Confirmar Nueva" 
                                              icon={CheckCircle2} 
                                              type="password"
                                              value={passData.confirm}
                                              onChange={(e:any) => setPassData({...passData, confirm: e.target.value})}
                                              placeholder="Repetir contraseña"
                                          />
                                      </div>

                                      <div className="pt-4 flex items-center justify-between">
                                          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                                              <AlertCircle size={14}/>
                                              <span>La sesión se cerrará al actualizar.</span>
                                          </div>
                                          <button type="submit" disabled={isLoading} className="btn-primary w-full sm:w-auto">
                                              {isLoading ? "Actualizando..." : "Actualizar Seguridad"}
                                          </button>
                                      </div>
                                  </form>
                              </div>
                          </div>
                      </div>
                  </div>
              );

          // --- TAB EQUIPO ---
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
                          <button onClick={() => setShowModal(true)} className="btn-primary w-full md:w-auto shadow-lg shadow-slate-900/10">
                              <Plus size={18}/> Nuevo Miembro
                          </button>
                      </div>

                      {/* Grid de Equipo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                          {filteredTeam.map((member) => (
                              <div key={member.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300 relative">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                          {member.initials}
                                      </div>
                                      <div className="flex gap-1">
                                          <button onClick={() => handleDeleteUser(member.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                              <Trash2 size={18}/>
                                          </button>
                                      </div>
                                  </div>
                                  
                                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                      {member.name}
                                      {['SUPER_ADMIN', 'COORDINATOR'].includes(member.role) && <BadgeCheck size={16} className="text-blue-500" fill="currentColor" color="white"/>}
                                  </h3>
                                  <p className="text-sm text-slate-400 font-medium mb-4 truncate">{member.email}</p>
                                  
                                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${['SUPER_ADMIN', 'COORDINATOR'].includes(member.role) ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                          {member.role.replace('_', ' ')}
                                      </span>
                                      <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Activo
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              );

          // --- TAB AYUDA ---
          case "ayuda":
              return (
                  <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
                      <div className="text-center mb-10">
                          <h2 className="text-3xl font-black text-slate-900 mb-2">¿Cómo podemos ayudarte?</h2>
                          <p className="text-slate-500">Documentación y soporte para el equipo administrativo.</p>
                      </div>

                      <div className="space-y-4">
                          {FAQS.map((faq, i) => (
                              <div key={i} className={`bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 ${expandedFaq === i ? 'shadow-lg ring-1 ring-blue-500/20' : 'hover:border-slate-300'}`}>
                                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                                      <span className="font-bold text-slate-800">{faq.q}</span>
                                      <ChevronRight size={20} className={`text-slate-300 transition-transform duration-300 ${expandedFaq === i ? 'rotate-90 text-blue-600' : ''}`}/>
                                  </button>
                                  {expandedFaq === i && (
                                      <div className="px-5 pb-5 pt-0 text-sm text-slate-500 leading-relaxed border-t border-slate-50 mt-2">
                                          <div className="pt-4">{faq.a}</div>
                                      </div>
                                  )}
                              </div>
                          ))}
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

      {/* Modal Crear Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 relative border border-white/20">
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20}/>
                </button>
                
                <div className="mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <Users size={24}/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Invitar Miembro</h3>
                    <p className="text-sm text-slate-500">Se enviará un correo de acceso.</p>
                </div>
                
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <InputField label="Nombre" value={newUser.name} onChange={(e:any) => setNewUser({...newUser, name: e.target.value})} placeholder="Nombre completo"/>
                    <InputField label="Correo" type="email" value={newUser.email} onChange={(e:any) => setNewUser({...newUser, email: e.target.value})} placeholder="usuario@empresa.com"/>
                    <InputField label="Contraseña" value={newUser.password} onChange={(e:any) => setNewUser({...newUser, password: e.target.value})} placeholder="Temporal123"/>
                    
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1.5">Rol</label>
                        <div className="relative">
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="NAVIGATOR">Navegador</option>
                                <option value="COORDINATOR">Coordinador</option>
                                <option value="AUDITOR">Auditor</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16}/>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="btn-primary w-full mt-4">
                        {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Enviar Invitación"}
                    </button>
                </form>
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