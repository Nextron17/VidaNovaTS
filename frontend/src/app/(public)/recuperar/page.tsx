"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/src/app/services/api"; // ✅ Asegúrate que este sea el de axios

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Llamada al endpoint que creamos en el AuthController
      await api.post("/auth/forgot-password", { email });
      setStep("success");
    } catch (err: any) {
      console.error(err);
      // Mostramos error genérico o el del backend si existe
      setError(err.response?.data?.message || "Hubo un problema al intentar enviar el correo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-500"></div>

        {step === "form" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
                <ArrowLeft size={16}/> Volver al Login
              </Link>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Mail size={24}/>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Recuperar Acceso</h1>
              <p className="text-slate-500 text-sm">
                Ingresa tu correo corporativo para recibir el enlace de restablecimiento.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                  <AlertCircle size={16}/> {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Registrado</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                  <input 
                    type="email" 
                    placeholder="usuario@vidanova.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-normal"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Enviar Instrucciones"}
              </button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32}/>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Correo Enviado!</h2>
            <p className="text-slate-500 text-sm mb-8">
              Si el correo <strong>{email}</strong> existe en nuestro sistema, recibirás las instrucciones en breve.
            </p>
            
            <Link 
              href="/login"
              className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}