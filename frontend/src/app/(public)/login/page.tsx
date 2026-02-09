"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Lock, Mail, Eye, EyeOff, 
  ArrowRight, Loader2, AlertCircle, ShieldCheck 
} from "lucide-react";
import { useUser } from "@/src/app/context/UserContext";
import api from "@/src/app/services/api"; // ✅ Usamos tu archivo api.ts

export default function LoginPage() {
  const { login } = useUser();
  const router = useRouter(); 
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. PETICIÓN AL BACKEND REAL
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { token, user } = response.data;

      // 2. GUARDAR SESIÓN
      login(token, user);

      // 3. REDIRECCIÓN SEGURA (Solo Admin por ahora)
      if (["SUPER_ADMIN", "COORDINATOR"].includes(user.role)) {
        router.push("/navegacion/admin");
      } else {
        // Si intentan entrar operarios, por ahora los mandamos a una pagina de espera o al mismo admin con acceso restringido
        // Pero como pediste solo Admin, asumimos que solo admins entrarán.
        alert("Acceso Operativo en construcción. Entrando a modo vista...");
        router.push("/navegacion/operativo"); 
      }

    } catch (err: any) {
      console.error("Login error:", err);
      // Mensaje de error real del backend
      setError(err.response?.data?.error || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      
      {/* Columna Izquierda (Branding) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-40"></div>
        
        <div className="relative z-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">V</div>
            <span className="text-2xl font-bold">Vidanova</span>
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">
            Gestión Integral de <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Rutas Oncológicas</span>
          </h1>
        </div>

        <div className="relative z-20 flex gap-4 text-xs text-slate-500 font-medium">
            <span>© 2026 Vidanova System</span> • <span>v2.4.0 Admin</span>
        </div>
      </div>

      {/* Columna Derecha (Formulario) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Bienvenido Admin</h2>
            <p className="text-slate-500">Ingresa tus credenciales de gestión.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18}/> <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                <input 
                  type="email" placeholder="admin@vidanova.com" required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                <input 
                  type={showPassword ? "text" : "password"} placeholder="••••••••••••" required
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 size={22} className="animate-spin"/> : <>Iniciar Sesión <ArrowRight size={20}/></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}