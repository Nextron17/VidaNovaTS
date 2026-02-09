"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Lock, Users, HelpCircle, 
  Camera, Save, Shield, Key, Smartphone,
  Mail, Phone, Plus, Search, MapPin,
  MoreVertical, BadgeCheck, FileText, 
  ChevronRight, Loader2, Trash2, X, CheckCircle2
} from "lucide-react";
import api from "@/src/app/services/api";

// FAQs estáticas
const FAQS = [
    { q: "¿Cómo solicito un cambio de rol?", a: "Los roles son gestionados exclusivamente por el departamento de TI." },
    { q: "¿Es obligatorio el cambio de contraseña?", a: "Sí, por políticas de seguridad, el sistema solicitará cambio cada 90 días." },
    { q: "¿Puedo exportar la lista?", a: "Sí, desde el módulo de Analítica puedes descargar reportes." }
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- ESTADOS DE DATOS REALES ---
  const [team, setTeam] = useState<any[]>([]); 
  const [profileData, setProfileData] = useState({ name: "", phone: "", email: "", role: "", avatarColor: "" }); 
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  
  // --- ESTADOS PARA MODAL CREAR USUARIO ---
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "NAVIGATOR", phone: "" });

  // =========================================================
  // 1. CARGA DE DATOS
  // =========================================================
  useEffect(() => {
    if (activeTab === "equipo") fetchTeam();
    if (activeTab === "perfil") fetchMyProfile();
  }, [activeTab]);

  const fetchTeam = async () => {
    try {
      const res = await api.get("/users");
      setTeam(res.data);
    } catch (error) { console.error("Error cargando equipo", error); }
  };

  const fetchMyProfile = async () => {
    try {
      const res = await api.get("/users/me");
      setProfileData(res.data);
    } catch (error) { console.error("Error cargando perfil", error); }
  };

  // =========================================================
  // 2. HANDLERS
  // =========================================================

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await api.put("/users/me", { name: profileData.name, phone: profileData.phone });
        alert("✅ Perfil actualizado correctamente");
    } catch (error: any) {
        alert("❌ Error: " + (error.response?.data?.error || "Error al actualizar"));
    } finally {
        setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("❌ Las contraseñas nuevas no coinciden");
    
    setIsLoading(true);
    try {
        await api.put("/users/me/password", { currentPassword: passData.current, newPassword: passData.new });
        alert("✅ Contraseña actualizada. Vuelve a iniciar sesión.");
        setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
        alert("❌ Error: " + (error.response?.data?.error || "Error al cambiar contraseña"));
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await api.post("/users", newUser);
        alert("✅ Usuario invitado correctamente");
        setShowModal(false);
        setNewUser({ name: "", email: "", password: "", role: "NAVIGATOR", phone: "" });
        fetchTeam();
    } catch (error: any) {
        alert("❌ Error: " + (error.response?.data?.error || "Error al crear"));
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if(!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
        await api.delete(`/users/${id}`);
        fetchTeam();
    } catch (error: any) {
        alert("❌ Error: " + (error.response?.data?.error || "Error al eliminar"));
    }
  };

  // Filtrado
  const filteredTeam = team.filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // =========================================================
  // 3. RENDERIZADO
  // =========================================================

  const renderContent = () => {
      switch (activeTab) {
          
          // --- TAB 1: PERFIL ---
          case "perfil":
              return (
                  <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-white overflow-hidden mb-8">
                          
                          {/* Banner Cover */}
                          <div className="h-48 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 relative">
                              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                              <div className="absolute bottom-4 right-8 text-white/50 text-xs font-mono">ID: {profileData.email}</div>
                          </div>

                          <div className="px-8 pb-8 relative">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 mb-10 gap-6">
                                  
                                  {/* Avatar Section */}
                                  <div className="flex items-end gap-6">
                                      <div className="relative group">
                                          <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-2xl">
                                              <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${profileData.avatarColor || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-white text-4xl font-black shadow-inner`}>
                                                  {profileData.name ? profileData.name.substring(0,2).toUpperCase() : <User/>}
                                              </div>
                                          </div>
                                          <button className="absolute bottom-2 -right-2 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg border-4 border-white hover:scale-110 transition-transform cursor-pointer">
                                              <Camera size={18}/>
                                          </button>
                                      </div>
                                      
                                      <div className="mb-2">
                                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profileData.name || 'Cargando...'}</h2>
                                          <div className="flex items-center gap-3 mt-1">
                                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase border border-blue-100">
                                                  <BadgeCheck size={14} fill="currentColor" className="text-blue-500"/>
                                                  {profileData.role.replace('_', ' ')}
                                              </span>
                                              <span className="text-sm text-slate-400 font-medium">Popayán, Colombia</span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Stats Rápidos */}
                                  <div className="flex gap-3 hidden md:flex">
                                     <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                          <p className="text-xs font-bold text-slate-400 uppercase">Estado</p>
                                          <p className="text-emerald-600 font-black">Activo</p>
                                     </div>
                                  </div>
                              </div>

                              {/* Formulario */}
                              <form onSubmit={handleSaveProfile} className="max-w-4xl">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                      <div className="group">
                                          <label className="label-premium">Nombre Completo</label>
                                          <div className="input-wrapper focus-within:ring-2 ring-blue-500/20">
                                              <User className="input-icon"/>
                                              <input 
                                                type="text" 
                                                className="input-premium" 
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                              />
                                          </div>
                                      </div>

                                      <div className="group opacity-75">
                                          <label className="label-premium">Correo Electrónico</label>
                                          <div className="input-wrapper bg-slate-50">
                                              <Mail className="input-icon"/>
                                              <input 
                                                type="email" 
                                                className="input-premium bg-transparent cursor-not-allowed text-slate-500" 
                                                value={profileData.email} 
                                                disabled 
                                              />
                                              <Lock size={14} className="absolute right-4 top-3.5 text-slate-400"/>
                                          </div>
                                      </div>

                                      <div className="group">
                                          <label className="label-premium">Teléfono / Celular</label>
                                          <div className="input-wrapper focus-within:ring-2 ring-blue-500/20">
                                              <Phone className="input-icon"/>
                                              <input 
                                                type="tel" 
                                                className="input-premium"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                                placeholder="+57 300..."
                                              />
                                          </div>
                                      </div>

                                      <div className="group">
                                          <label className="label-premium">Ubicación</label>
                                          <div className="input-wrapper focus-within:ring-2 ring-blue-500/20">
                                              <MapPin className="input-icon"/>
                                              <input type="text" defaultValue="Popayán, Cauca" className="input-premium" />
                                          </div>
                                      </div>
                                  </div>

                                  <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                                      <p className="text-xs text-slate-400">Última actualización: Hace un momento</p>
                                      <button type="submit" disabled={isLoading} className="btn-primary">
                                          {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                          <span>Guardar Cambios</span>
                                      </button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  </div>
              );

          // --- TAB 2: SEGURIDAD ---
          case "seguridad":
              return (
                  <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                          
                          {/* Sidebar Info */}
                          <div className="md:col-span-4 space-y-6">
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4"></div>
                                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 relative z-10">
                                      <Shield size={24}/>
                                  </div>
                                  <h3 className="font-bold text-slate-900 mb-1 relative z-10">Estado de Seguridad</h3>
                                  <p className="text-xs text-slate-500 mb-4 relative z-10">Tu cuenta cumple con los estándares ISO.</p>
                                  
                                  <div className="space-y-3 relative z-10">
                                      <div className="flex items-center justify-between text-xs font-bold">
                                          <span className="text-slate-600">Nivel de Protección</span>
                                          <span className="text-emerald-500">Alto</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                          <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full w-[90%]"></div>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-[50px] opacity-30"></div>
                                  <Smartphone size={32} className="mb-4 text-blue-400"/>
                                  <h3 className="font-bold mb-1">Dispositivo Actual</h3>
                                  <p className="text-xs text-slate-400 mb-4">Web Admin Panel • Chrome Windows</p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide bg-white/10 w-fit px-3 py-1 rounded-full">
                                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                      En Línea
                                  </div>
                              </div>
                          </div>

                          {/* Formulario Principal */}
                          <div className="md:col-span-8 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-white">
                              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                      <Key size={24}/>
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-black text-slate-900">Credenciales de Acceso</h3>
                                      <p className="text-sm text-slate-500">Actualiza tu contraseña periódicamente.</p>
                                  </div>
                              </div>
                              
                              <form onSubmit={handleChangePassword} className="space-y-6">
                                  <div className="group">
                                      <label className="label-premium">Contraseña Actual</label>
                                      <div className="input-wrapper focus-within:ring-2 ring-blue-500/20">
                                          <Lock className="input-icon"/>
                                          <input 
                                            type="password" 
                                            className="input-premium"
                                            value={passData.current}
                                            onChange={(e) => setPassData({...passData, current: e.target.value})}
                                            required
                                            placeholder="••••••••••••"
                                          />
                                      </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="group">
                                          <label className="label-premium">Nueva Contraseña</label>
                                          <div className="input-wrapper focus-within:ring-2 ring-blue-500/20">
                                            <input 
                                                type="password" 
                                                className="input-premium pl-4" // Quitamos padding left extra porque no hay icono
                                                value={passData.new}
                                                onChange={(e) => setPassData({...passData, new: e.target.value})}
                                                required minLength={6}
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                          </div>
                                      </div>
                                      <div className="group">
                                          <label className="label-premium">Confirmar Nueva</label>
                                          <div className="input-wrapper focus-within:ring-2 ring-blue-500/20">
                                            <input 
                                                type="password" 
                                                className="input-premium pl-4"
                                                value={passData.confirm}
                                                onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                                                required minLength={6}
                                                placeholder="Repite la contraseña"
                                            />
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex justify-end pt-4">
                                      <button type="submit" disabled={isLoading} className="btn-primary">
                                          {isLoading ? "Actualizando..." : "Actualizar Seguridad"}
                                      </button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  </div>
              );

          // --- TAB 3: EQUIPO (CONECTADO) ---
          case "equipo":
              return (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Toolbar Flotante */}
                      <div className="sticky top-4 z-20 mb-8">
                          <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl border border-white/50 shadow-lg shadow-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                              
                              <div className="relative w-full md:w-96 group">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
                                  <input 
                                      type="text" 
                                      placeholder="Buscar por nombre o correo..." 
                                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500/30 rounded-xl text-sm font-bold text-slate-700 outline-none transition-all"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                              </div>

                              <div className="flex items-center gap-3 w-full md:w-auto">
                                  <div className="hidden md:flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-500">
                                      <Users size={16}/>
                                      <span>{team.length} Activos</span>
                                  </div>
                                  <button onClick={() => setShowModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all">
                                      <Plus size={18}/> 
                                      <span>Nuevo Miembro</span>
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Lista Real */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                          {filteredTeam.map((member) => (
                              <div key={member.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-300 relative overflow-hidden">
                                  
                                  {/* Hover Gradient Effect */}
                                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  
                                  <div className="flex items-start justify-between mb-6">
                                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                          {member.initials}
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteUser(member.id)} 
                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Eliminar usuario"
                                      >
                                          <Trash2 size={20}/>
                                      </button>
                                  </div>

                                  <div className="mb-4">
                                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                          {member.name}
                                          {['SUPER_ADMIN', 'COORDINATOR'].includes(member.role) && 
                                            <BadgeCheck size={18} className="text-blue-500" fill="currentColor" color="white"/>
                                          }
                                      </h3>
                                      <p className="text-sm text-slate-400 font-medium truncate">{member.email}</p>
                                  </div>

                                  <div className="flex gap-2 mb-6">
                                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border 
                                        ${['SUPER_ADMIN', 'COORDINATOR'].includes(member.role) 
                                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                            : 'bg-slate-50 text-slate-600 border-slate-100'}
                                      `}>
                                          {member.role.replace('_', ' ')}
                                      </span>
                                  </div>

                                  <div className="flex gap-2 pt-4 border-t border-slate-50 opacity-60 group-hover:opacity-100 transition-opacity">
                                      <button className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                          <Mail size={14}/> Contactar
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              );

          case "ayuda":
              return (
                  <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="text-center mb-10">
                          <h2 className="text-2xl font-black text-slate-900 mb-2">Centro de Ayuda</h2>
                          <p className="text-slate-500">Respuestas rápidas para administradores.</p>
                      </div>
                      <div className="space-y-4">
                          {FAQS.map((faq, i) => (
                              <div key={i} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer">
                                  <h4 className="font-bold text-slate-800 flex justify-between items-center text-base">
                                      {faq.q} <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                                  </h4>
                                  <p className="text-sm text-slate-500 mt-2 pr-8">{faq.a}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              );

          default: return null;
      }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="relative p-6 md:p-10 font-sans text-slate-800 max-w-7xl mx-auto">
          {/* Main Header */}
          <div className="mb-8 md:mb-12">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Configuración</h1>
              <p className="text-lg text-slate-500 font-medium">Gestiona tu perfil, seguridad y el equipo de trabajo.</p>
          </div>

          {/* Navigation Tabs Glassmorphism */}
          <div className="flex overflow-x-auto pb-1 mb-8 gap-2 no-scrollbar sticky top-0 z-30 pt-4 -mx-4 px-4 md:mx-0 bg-gradient-to-b from-slate-50 via-slate-50/90 to-transparent">
              {[{ id: 'perfil', label: 'Mi Perfil', icon: User }, { id: 'seguridad', label: 'Seguridad', icon: Lock }, { id: 'equipo', label: 'Equipo', icon: Users }, { id: 'ayuda', label: 'Ayuda', icon: HelpCircle }].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-slate-900/20 scale-105' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'}`}>
                      <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2}/> {tab.label}
                  </button>
              ))}
          </div>

          <div className="min-h-[600px]">{renderContent()}</div>
      </div>

      {/* Modal Crear Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 border border-white/20">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Nuevo Miembro</h3>
                        <p className="text-sm text-slate-500">Enviar invitación por correo.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X className="text-slate-500" size={20}/></button>
                </div>
                
                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div><label className="label-premium">Nombre Completo</label><input required className="input-premium" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ej. Dra. Ana Perez"/></div>
                    <div><label className="label-premium">Correo Corporativo</label><input required type="email" className="input-premium" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="usuario@vidanova.com"/></div>
                    <div><label className="label-premium">Contraseña Temporal</label><input required className="input-premium" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Mínimo 6 caracteres"/></div>
                    <div>
                        <label className="label-premium">Rol Asignado</label>
                        <div className="relative">
                            <select className="input-premium bg-white appearance-none cursor-pointer" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="NAVIGATOR">Navegador (Operativo)</option>
                                <option value="COORDINATOR">Coordinador (Admin)</option>
                                <option value="AUDITOR">Auditor</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16}/>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={isLoading} className="btn-primary w-full">
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Enviar Invitación"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <style jsx>{`
        .label-premium { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; letter-spacing: 0.05em; margin-left: 0.25rem; }
        .input-wrapper { position: relative; background-color: white; border-radius: 1rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: all 0.2s; }
        .input-wrapper:focus-within { box-shadow: 0 0 0 2px #3b82f6, 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .input-premium { width: 100%; padding: 0.875rem 1rem 0.875rem 1rem; background-color: transparent; border: 1px solid #e2e8f0; border-radius: 1rem; font-size: 0.9rem; font-weight: 600; color: #1e293b; outline: none; transition: border-color 0.2s; }
        .input-premium:focus { border-color: #3b82f6; }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; width: 1.125rem; height: 1.125rem; }
        .input-wrapper .input-premium { padding-left: 3rem; } /* Solo cuando hay wrapper e icono */
        
        .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background-color: #0f172a; color: white; padding: 0.875rem 2rem; border-radius: 1rem; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .btn-primary:hover { background-color: #1e293b; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .btn-primary:active { transform: translateY(0); }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}