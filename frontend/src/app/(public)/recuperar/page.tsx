'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
      // 🔥 CAMBIO CRÍTICO: Ahora enviamos 'documentNumber'
      // Esto coincide con tu AuthController.forgotPassword
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        
        {/* Header Azul */}
        <div className="bg-blue-600 p-6 text-center">
          <h2 className="text-xl font-bold text-white">Recuperar Acceso</h2>
          <p className="text-blue-100 text-sm mt-1">
            Ingresa tu documento para restablecer la contraseña
          </p>
        </div>

        <div className="p-8">
          {success ? (
            // ESTADO DE ÉXITO
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">¡Solicitud Enviada!</h3>
              <p className="text-slate-600 text-sm">
                Si el documento <b>{documentNumber}</b> tiene un correo asociado, recibirás las instrucciones allí en breve.
              </p>
              <Link 
                href="/login" 
                className="inline-block mt-4 text-blue-600 font-medium hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            // FORMULARIO DE RECUPERACIÓN
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Número de Documento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* Cambiamos el icono Mail por User para que tenga sentido visual */}
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text" // Cambiado de 'email' a 'text'
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ej: 1061000000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !documentNumber}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  'Enviar Instrucciones'
                )}
              </button>

              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver al Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}