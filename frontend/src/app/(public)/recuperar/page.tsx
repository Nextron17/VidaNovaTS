"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldQuestion } from "lucide-react";
import api from "@/src/app/services/api";

export default function RecuperarPage() {
  const [documento, setDocumento] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // ✅ Enviamos el documento al backend en lugar del correo
      await api.post("/auth/forgot-password", { documentNumber: documento });
      setStep("success");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No pudimos procesar la solicitud. Verifica el número de documento.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-12 relative overflow-hidden">
        
        {/* Barra decorativa superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>

        {step === "form" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Volver al Acceso
              </Link>
              
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <ShieldQuestion size={28}/>
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Olvidaste tu acceso?</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Ingresa tu <strong>Número de Documento</strong> registrado para recibir las instrucciones de restablecimiento.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                  <AlertCircle size={18}/> {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Documento de Identidad</label>
                <div className="relative group">
                  <User className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                  <input 
                    type="text" 
                    placeholder="Escribe tu cédula"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Validar Identidad"}
              </button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40}/>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Solicitud Recibida</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Si el documento <strong>{documento}</strong> está registrado, se han enviado instrucciones al correo asociado a tu cuenta.
            </p>
            
            <Link 
              href="/login"
              className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest"
            >
              Regresar al inicio
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}