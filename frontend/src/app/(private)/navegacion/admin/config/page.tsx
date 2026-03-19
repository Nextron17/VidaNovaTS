"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Lock, Users, 
  Camera, Save, Shield, Key, 
  Mail, Phone, MapPin,
  X, CheckCircle2,
  ChevronRight, Loader2, Zap, ShieldCheck, AlertCircle, FileText, MessageCircle, Search, Trash2, Plus, BadgeCheck, Edit,
} from "lucide-react";
import api from "@/src/app/services/api";

// =========================================================
// COMPONENTES UI REUTILIZABLES
// =========================================================

const SectionHeader = ({ title, sub }: { title: string, sub: string }) => (
  <div className="mb-6">
      <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 font-medium">{sub}</p>
  </div>
);

const InputField = ({ label, icon: Icon, value, onChange, type = "text", disabled = false, placeholder = "", required = false }: any) => (
  <div className="group space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
          {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className={`flex items-center gap-3 bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 transition-all duration-200 ${!disabled ? 'focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 hover:border-slate-300' : 'opacity-60 cursor-not-allowed'}`}>
          {Icon && <Icon size={18} className={`text-slate-400 ${!disabled && 'group-focus-within:text-blue-500'} transition-colors`}/>}
          <input 
              type={type} 
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

  // --- ESTADOS DE DATOS ---
  const [team, setTeam] = useState<any[]>([]); 
  const [profileData, setProfileData] = useState({ 
    name: "", phone: "", email: "", role: "", 
    avatarColor: "from-indigo-500 to-purple-600", 
    bio: "Especialista en gestión oncológica",
    location: "Popayán, Cauca"
  }); 
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  
  // --- MODAL Y FORMULARIO USUARIOS ---
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null); 
  
  const [formData, setFormData] = useState({ 
    name: "", 
    documentNumber: "", 
    email: "", 
    phone: "", 
    password: "", 
    role: "NAVIGATOR" 
  });

  // CARGA DE DATOS
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
    } catch (error) { console.error("Error al cargar perfil", error); }
  };

  // --- HANDLERS ---
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

  const handleOpenNewUser = () => {
      setEditingUser(null);
      setFormData({ name: "", documentNumber: "", email: "", phone: "", password: "", role: "NAVIGATOR" });
      setShowModal(true);
  };

  const handleEditUser = (member: any) => {
      setEditingUser(member);
      setFormData({
          name: member.name || "",
          documentNumber: member.documentNumber || "",
          email: member.email || "",
          phone: member.phone || "",
          password: "", 
          role: member.role || "NAVIGATOR"
      });
      setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.documentNumber || !formData.name) {
        return alert("El nombre y la cédula son obligatorios.");
    }
    if (!editingUser && !formData.password) {
        return alert("La contraseña es obligatoria para un usuario nuevo.");
    }

    setIsLoading(true);
    try {
        if (editingUser) {
            const { password, ...restData } = formData; 
            const payload = password ? { password, ...restData } : restData;
            
            await api.put(`/users/${editingUser.id}`, payload);
            alert("✅ Usuario actualizado exitosamente.");
        } else {
            await api.post("/users", formData);
            alert("✅ Usuario creado exitosamente.");
        }
        
        setShowModal(false);
        fetchTeam(); 
    } catch (error: any) { 
        alert(error.response?.data?.error || "Error al procesar la solicitud."); 
    } 
    finally { setIsLoading(false); }
  };

  const handleDeleteUser = async (id: number) => {
    if(!confirm("¿Eliminar usuario definitivamente?")) return;
    try {
        await api.delete(`/users/${id}`);
        setTeam(prev => prev.filter(u => u.id !== id));
    } catch (error: any) { alert("Error al eliminar"); }
  };

  const filteredTeam = team.filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // RENDERIZADO
  const renderContent = () => {
      switch (activeTab) {
          
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

          case "seguridad":
              return (
                  <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
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

                    {/* Grid de Equipo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {filteredTeam.map((member) => (
                            <div key={member.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                {/* Fondo Decorativo Superior */}
                                <div className={`h-24 bg-gradient-to-r ${member.avatarColor} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                                
                                <div className="px-6 pb-6 relative">
                                    {/* Avatar y Acciones Superpuestos */}
                                    <div className="flex justify-between items-end -mt-10 mb-4">
                                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.avatarColor} p-1 shadow-lg ring-4 ring-white`}>
                                            <div className="w-full h-full rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-2xl">
                                                {member.initials}
                                            </div>
                                        </div>
                                        
                                        {/* 🛠️ CONTENEDOR DE ACCIONES (Editar y Eliminar) */}
                                        <div className="flex items-center gap-1 mb-1 bg-white/80 backdrop-blur-md rounded-full p-1 shadow-sm border border-slate-100">
                                            <button 
                                                onClick={() => handleEditUser(member)} 
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                title="Editar información"
                                            >
                                                <Edit size={16} strokeWidth={2.5}/>
                                            </button>
                                            
                                            <div className="w-px h-4 bg-slate-200"></div>

                                            <button 
                                                onClick={() => handleDeleteUser(member.id)} 
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={16} strokeWidth={2.5}/>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Info del Usuario */}
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                            {member.name}
                                            {['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR'].includes(member.role) && (
                                                <BadgeCheck size={18} className="text-blue-500" fill="currentColor" color="white"/>
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium mb-1 truncate">{member.email}</p>
                                        <p className="text-xs text-slate-400 font-mono mb-1">{member.phone ? `📞 ${member.phone}` : "Sin teléfono"}</p>
                                        <p className="text-xs text-slate-400 font-mono mb-5">CC: {member.documentNumber}</p>
                                        
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
                        
                        {/* Tarjeta "Agregar Nuevo" */}
                        <button 
                            onClick={handleOpenNewUser}
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

          default: return null;
      }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Configuración</h1>
              <p className="text-lg text-slate-500 font-medium">Administra tu cuenta y las preferencias del sistema.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {[
                  { id: 'perfil', label: 'Mi Perfil', icon: User }, 
                  { id: 'seguridad', label: 'Seguridad', icon: Lock }, 
                  { id: 'equipo', label: 'Equipo', icon: Users }
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

          <div className="min-h-[600px]">{renderContent()}</div>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[1.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 relative border border-slate-100">
                  
                  {/* Header Dinámico (Cambia si edita o crea) */}
                  <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 flex justify-between items-center border-b border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm shadow-blue-100/50">
                              {editingUser ? <Edit size={20} strokeWidth={2.5}/> : <Users size={20} strokeWidth={2.5}/>}
                          </div>
                          <div>
                              <h3 className="text-base font-black text-slate-800 leading-none tracking-tight">
                                  {editingUser ? "Editar Miembro" : "Nuevo Miembro"}
                              </h3>
                              <p className="text-slate-400 text-xs mt-1 font-medium">
                                  {editingUser ? "Modifica los datos del usuario" : "Datos de acceso al sistema"}
                              </p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowModal(false)} 
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200"
                      >
                          <X size={18}/>
                      </button>
                  </div>
                  
                  {/* Cuerpo del Formulario */}
                  <div className="p-6 pt-6 bg-white">
                      <form onSubmit={handleSaveUser} className="space-y-4">
                          
                          <InputField 
                              label="Nombre Completo" 
                              value={formData.name} 
                              onChange={(e:any) => setFormData({...formData, name: e.target.value})} 
                              placeholder="Ej: Ana Pérez"
                              icon={User}
                              required={true}
                          />

                          <div className="grid grid-cols-2 gap-4">
                              <InputField 
                                  label="Cédula (Login)" 
                                  value={formData.documentNumber} 
                                  onChange={(e:any) => setFormData({...formData, documentNumber: e.target.value})} 
                                  placeholder="1061..."
                                  icon={Shield} 
                                  required={true}
                              />
                              <InputField 
                                  label={editingUser ? "Nueva Contraseña" : "Contraseña"} 
                                  value={formData.password} 
                                  onChange={(e:any) => setFormData({...formData, password: e.target.value})} 
                                  placeholder={editingUser ? "Opcional..." : "Clave123*"}
                                  icon={Key}
                                  type="password"
                                  required={!editingUser} // Solo obligatoria si es nuevo
                              />
                          </div>

                          {/* Mensaje de ayuda si está editando */}
                          {editingUser && (
                              <p className="text-[10px] text-slate-400 -mt-2 ml-1 text-right">
                                  * Deja la contraseña en blanco para no cambiarla.
                              </p>
                          )}

                          <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Rol Asignado</label>
                              <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <ShieldCheck size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
                                  </div>
                                  <select 
                                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-300" 
                                      value={formData.role} 
                                      onChange={e => setFormData({...formData, role: e.target.value})}
                                  >
                                      <option value="NAVIGATOR">Navegador Operativo</option>
                                      <option value="COORDINATOR_NAVIGATOR">Coordinador Navegador</option> 
                                      <option value="SUPER_ADMIN">Super Administrador</option>
                                  </select>
                                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                      <ChevronRight size={16} className="text-slate-400 rotate-90 group-hover:text-slate-600 transition-colors"/>
                                  </div>
                              </div>
                          </div>

                          <div className="pt-2 mt-2 border-t border-slate-50/80 grid grid-cols-2 gap-4">
                              <InputField 
                                  label="Correo (Opcional)" 
                                  type="email" 
                                  value={formData.email} 
                                  onChange={(e:any) => setFormData({...formData, email: e.target.value})} 
                                  placeholder="correo@vidanova.com"
                                  icon={Mail}
                              />
                              <InputField 
                                  label="Teléfono (Opcional)" 
                                  type="tel" 
                                  value={formData.phone} 
                                  onChange={(e:any) => setFormData({...formData, phone: e.target.value})} 
                                  placeholder="+57..."
                                  icon={Phone}
                              />
                          </div>

                          <div className="pt-2">
                              <button 
                                  type="submit" 
                                  disabled={isLoading} 
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0"
                              >
                                  {isLoading ? <Loader2 className="animate-spin" size={18}/> : (editingUser ? "Guardar Cambios" : "Crear e Invitar Usuario")}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}