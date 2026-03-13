"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LockKeyhole, User as UserIcon, Eye, EyeOff, 
  ArrowRight, Loader2, AlertTriangle, HelpCircle,
  HeartPulse, ShieldAlert, Server
} from "lucide-react";
import { useUser } from "@/src/app/context/UserContext";
import api from "@/src/app/services/api";

export default function LoginPage() {
  const { login } = useUser();
  const router = useRouter(); 
  
  const [formData, setFormData] = useState({ documento: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post('/auth/login', {
        documentNumber: formData.documento,
        password: formData.password
      });

      const { token, user } = response.data;
      login(token, user);

      if (["SUPER_ADMIN", "COORDINATOR", "ADMIN"].includes(user.role)) {
        router.push("/navegacion/admin");
      } else {
        router.push("/navegacion/atencion"); 
      }

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Credenciales incorrectas o usuario inactivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] font-sans selection:bg-teal-500 selection:text-white p-4 relative overflow-hidden">
      
      {/* --- FONDO CORPORATIVO CLÍNICO --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[800px] bg-teal-100/50 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[600px] bg-blue-100/40 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL DEL LOGIN --- */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* LOGO Y BRANDING CENTRAL */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-slate-900/20">
            <HeartPulse size={32} strokeWidth={2.5} className="text-teal-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">IPS VidaNova</h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-1">Portal Operativo Interno</p>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10">
          
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full mb-8">
            <ShieldAlert size={14} className="text-red-600" />
            <span className="text-red-700 text-[10px] font-black uppercase tracking-widest">Acceso Restringido</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* MENSAJE DE ERROR */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in zoom-in-95 duration-300">
                <AlertTriangle className="shrink-0 mt-0.5" size={18}/> 
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* INPUT: DOCUMENTO */}
              <div className="relative group">
                <UserIcon className="absolute left-4 top-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20}/>
                <input 
                  type="text" 
                  placeholder="Número de Documento" 
                  required
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-700 placeholder:font-medium placeholder:text-slate-400"
                  value={formData.documento} 
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                />
              </div>

              {/* INPUT: CONTRASEÑA */}
              <div className="relative group">
                <LockKeyhole className="absolute left-4 top-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20}/>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Contraseña de acceso" 
                  required
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-700 placeholder:font-medium placeholder:text-slate-400"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-4 text-slate-400 hover:text-teal-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* ENLACE DE RECUPERACIÓN */}
              <div className="flex justify-between items-center px-1 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Server size={14} className="text-emerald-500" /> Conexión segura
                </div>
                <Link 
                  href="/recuperar" 
                  className="text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors flex items-center gap-1.5 group"
                >
                  <HelpCircle size={14} className="group-hover:rotate-12 transition-transform"/>
                  Recuperar contraseña
                </Link>
              </div>
            </div>

            {/* BOTÓN DE SUBMIT */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-teal-600/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin"/>
                  Autenticando...
                </>
              ) : (
                <>
                  <LockKeyhole size={18} />
                  Ingresar al Sistema 
                  <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform"/>
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER DEL LOGIN */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Todo acceso no autorizado será penalizado
          </p>
          <p className="text-[10px] text-slate-400/80 max-w-xs mx-auto">
            El uso de esta plataforma implica la aceptación de las políticas de privacidad y manejo de historias clínicas (Ley Habeas Data).
          </p>
        </div>

      </div>
    </div>
  );
}