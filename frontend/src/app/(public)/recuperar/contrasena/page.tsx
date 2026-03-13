'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, User as UserIcon, Loader2, 
  CheckCircle, AlertTriangle, HeartPulse, 
  ShieldAlert, MailCheck
} from 'lucide-react';
import api from '@/src/app/services/api';

export default function RecoverPasswordPage() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { documentNumber });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'No se pudo procesar la solicitud. Verifica el documento.'
      );
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

      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* LOGO Y BRANDING CENTRAL */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-slate-900/20">
            <HeartPulse size={32} strokeWidth={2.5} className="text-teal-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">IPS VidaNova</h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase mt-1">Recuperación de Acceso</p>
        </div>

        {/* TARJETA CENTRAL */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10">
          
          {success ? (
            // --- ESTADO DE ÉXITO ---
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                <MailCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¡Solicitud Procesada!</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Si el documento <b className="text-slate-800">{documentNumber}</b> está registrado y tiene un correo asociado, recibirás las instrucciones de restablecimiento en breve.
                </p>
              </div>
              
              <Link 
                href="/login" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                <ArrowLeft size={18} />
                Volver al Portal de Ingreso
              </Link>
            </div>
          ) : (
            // --- FORMULARIO DE RECUPERACIÓN ---
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-2">¿Olvidó su contraseña?</h2>
                <p className="text-slate-500 text-sm font-medium">
                  Ingrese su número de documento institucional para recibir un enlace de recuperación seguro.
                </p>
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
                      value={documentNumber} 
                      onChange={(e) => setDocumentNumber(e.target.value)}
                    />
                  </div>
                </div>

                {/* BOTÓN DE SUBMIT */}
                <button 
                  type="submit" 
                  disabled={loading || !documentNumber} 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-teal-600/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={22} className="animate-spin"/>
                      Procesando...
                    </>
                  ) : (
                    'Enviar Instrucciones'
                  )}
                </button>

                {/* VOLVER AL LOGIN */}
                <div className="text-center pt-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-teal-600 transition-colors group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Regresar al inicio de sesión
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        {/* FOOTER DE SEGURIDAD */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center items-center gap-1.5 text-xs font-bold text-slate-400 mb-2">
            <ShieldAlert size={14} className="text-teal-500" /> Solicitud Auditada
          </div>
          <p className="text-[10px] text-slate-400/80 max-w-xs mx-auto">
            Por protocolos de seguridad (Ley Habeas Data), todas las solicitudes de recuperación de credenciales quedan registradas en el sistema.
          </p>
        </div>

      </div>
    </div>
  );
}