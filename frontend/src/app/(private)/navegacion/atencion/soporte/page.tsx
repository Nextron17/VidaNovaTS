"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Lock, Save, Key, 
  Mail, Phone, MapPin, BadgeCheck, 
  CheckCircle2, Loader2, ShieldCheck, 
  AlertCircle, Globe, Camera
} from "lucide-react";
import api from "@/src/app/services/api";

// --- COMPONENTE UI: INPUT OPTIMIZADO ---
const InputField = ({ label, icon: Icon, value, onChange, type = "text", disabled = false, placeholder = "" }: any) => (
  <div className="group space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className={`flex items-center gap-3 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 transition-all duration-300 ${!disabled ? 'focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 hover:border-slate-300' : 'opacity-60 cursor-not-allowed'}`}>
          {Icon && <Icon size={18} className={`text-slate-400 ${!disabled && 'group-focus-within:text-emerald-500'} transition-colors`}/>}
          <input 
              type={type} 
              value={value ?? ""} 
              onChange={onChange}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed"
          />
          {disabled && <Lock size={14} className="text-slate-300"/>}
      </div>
  </div>
);

export default function ConfigAtencionPage() {
  const [activeTab, setActiveTab] = useState("perfil");
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({ 
    name: "", phone: "", email: "", role: "", 
    avatarColor: "from-emerald-500 to-teal-600", 
    bio: "", location: ""
  }); 
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  
  useEffect(() => { fetchMyProfile(); }, []);

  const fetchMyProfile = async () => {
    try {
      const res = await api.get("/users/me");
      setProfileData({
        ...res.data,
        role: res.data.role || "NAVIGATOR",
        avatarColor: "from-emerald-500 to-teal-600",
        bio: res.data.bio || "Especialista en atención operativa",
        location: res.data.location || "Popayán, Cauca"
      });
    } catch (error) { console.error("Error al cargar perfil", error); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!profileData.name || !profileData.email) return alert("Nombre y Correo son obligatorios");
    
    setIsLoading(true);
    try {
        await api.put("/users/me", profileData);
        alert("✅ Perfil actualizado correctamente");
    } catch (error: any) { alert("Error al guardar cambios"); } 
    finally { setIsLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new.length < 6) return alert("La nueva contraseña debe tener al menos 6 caracteres");
    if (passData.new !== passData.confirm) return alert("Las contraseñas no coinciden");
    
    setIsLoading(true);
    try {
        await api.put("/users/me/password", { currentPassword: passData.current, newPassword: passData.new });
        alert("✅ Seguridad actualizada correctamente");
        setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) { alert("Error: La contraseña actual es incorrecta"); } 
    finally { setIsLoading(false); }
  };

  const renderContent = () => {
      switch (activeTab) {
          case "perfil":
              return (
                <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Card Lateral */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
                                <div className="relative z-10 mt-6">
                                    <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${profileData.avatarColor} p-1 shadow-xl ring-4 ring-white mx-auto relative group/avatar`}>
                                        <div className="w-full h-full rounded-[1.4rem] bg-white/10 flex items-center justify-center text-4xl text-white font-black backdrop-blur-sm uppercase">
                                            {profileData.name ? profileData.name.substring(0,2) : "NV"}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-[1.4rem] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Camera className="text-white" size={24}/>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="mt-6 text-xl font-black text-slate-900 tracking-tight">{profileData.name || "Navegador"}</h3>
                                <p className="text-sm text-slate-500 font-medium">{profileData.email}</p>
                                <div className="mt-4 flex justify-center">
                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                                        {profileData.role.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
                                <Globe className="absolute -bottom-4 -right-4 opacity-10" size={120}/>
                                <h4 className="font-bold text-sm mb-1">Estado del Sistema</h4>
                                <p className="text-xs text-emerald-100 mb-4 font-medium">Tu conexión está activa y segura.</p>
                                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/20">
                                    <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"/>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">En Línea</span>
                                </div>
                            </div>
                        </div>

                        {/* Formulario */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><User size={24}/></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Información de Cuenta</h2>
                                        <p className="text-sm text-slate-500 font-medium">Gestiona tu identidad digital en Vidanova.</p>
                                    </div>
                                </div>
                                <form onSubmit={handleSaveProfile} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField label="Nombre y Apellidos" icon={User} value={profileData.name} onChange={(e: any) => setProfileData({...profileData, name: e.target.value})} />
                                        <InputField label="Correo Corporativo" icon={Mail} value={profileData.email} onChange={(e: any) => setProfileData({...profileData, email: e.target.value})} />
                                        <InputField label="WhatsApp de Gestión" icon={Phone} value={profileData.phone} onChange={(e: any) => setProfileData({...profileData, phone: e.target.value})} placeholder="+57 3..." />
                                        <InputField label="Ubicación / Sede" icon={MapPin} value={profileData.location} onChange={(e: any) => setProfileData({...profileData, location: e.target.value})} />
                                        <div className="md:col-span-2">
                                            <InputField label="Breve Perfil Profesional" icon={BadgeCheck} value={profileData.bio} onChange={(e: any) => setProfileData({...profileData, bio: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button type="submit" disabled={isLoading} className="group relative px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-emerald-600 hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95">
                                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                                            Actualizar Datos
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
              );

          case "seguridad":
              return (
                  <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                          <div className="text-center mb-10">
                              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                                  <Lock size={36}/>
                              </div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Privacidad y Acceso</h2>
                              <p className="text-slate-500 mt-2 font-medium">Se recomienda usar una clave única que no utilices en otros servicios.</p>
                          </div>
                          
                          <form onSubmit={handleChangePassword} className="space-y-6">
                              <InputField label="Contraseña Actual" icon={Lock} type="password" value={passData.current} onChange={(e:any) => setPassData({...passData, current: e.target.value})} placeholder="••••••••" />
                              <div className="h-px bg-slate-100 w-full my-4" />
                              <InputField label="Nueva Contraseña" icon={Key} type="password" value={passData.new} onChange={(e:any) => setPassData({...passData, new: e.target.value})} placeholder="Mínimo 8 caracteres" />
                              <InputField label="Confirmar Nueva Contraseña" icon={CheckCircle2} type="password" value={passData.confirm} onChange={(e:any) => setPassData({...passData, confirm: e.target.value})} placeholder="Repite la clave" />
                              <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 h-[56px]">
                                  {isLoading ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                                  Guardar Nueva Credencial
                              </button>
                          </form>
                      </div>
                  </div>
              );

          default: return null;
      }
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] pb-24">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">Configuración</h1>
                  <p className="text-sm text-slate-500 font-medium">Perfil operativo y herramientas de seguridad.</p>
              </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar border-b border-slate-100">
              {[
                  { id: 'perfil', label: 'Mi Perfil', icon: User }, 
                  { id: 'seguridad', label: 'Seguridad', icon: Lock }
              ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all 
                        ${activeTab === tab.id 
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                            : 'bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                  >
                      <tab.icon size={14} strokeWidth={2.5}/> {tab.label}
                  </button>
              ))}
          </div>

          <div className="min-h-[500px]">{renderContent()}</div>
      </div>
      <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}