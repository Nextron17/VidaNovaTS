"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Save, UserCog, Calendar, PhoneOff, CheckCircle, 
  MessageCircle, XCircle, Stethoscope, Hash 
} from "lucide-react";

// --- DATOS MOCK (Simulando base de datos) ---
const LISTAS = {
  estados: ["PENDIENTE", "EN_GESTION", "AGENDADO", "REALIZADO", "CANCELADO"],
  tipos_paciente: ["INCIDENTE", "PREVALENTE"],
  prestadores: ["Vidanova", "Clínica Imbanaco", "Clínica La Estancia", "Dumian"],
  barreras: ["Ninguna / Sin Barrera", "No contesta", "Teléfono apagado", "Orden vencida", "Sin autorización"],
  // Lista de procedimientos simulada
  procedimientos: ["Consulta Especializada", "Quimioterapia", "Radioterapia", "Cirugía", "Imagenología"],
  opciones_anestesia: ["NO", "SI", "NO REQUIERE"]
};

function FormularioGestion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    paciente_nombre: "Cargando...",
    paciente_doc: "",
    paciente_eps: "",
    
    estado: "REALIZADO",
    tipo_paciente: "PREVALENTE",
    prestador: "Vidanova",
    barrera: "Ninguna / Sin Barrera",
    
    procedimiento: "Consulta Especializada",
    cups_codigo: "890226",
    cups_nombre: "CONSULTA DE PRIMERA VEZ POR ANESTESIOLOGIA", // Nombre del CUPS agregado
    
    val_preanestesica: "NO", // <--- NUEVO CAMPO: ¿Tiene valoración preanestésica?

    fecha_solicitud: "2025-12-09",
    fecha_cita: "2025-12-09",
    
    nueva_nota: "",
    historial: "VAL PREANESTESICA\nSe intentó contactar el 08/12 sin éxito."
  });

  // Cargar datos simulados
  useEffect(() => {
    if (id) {
        // Aquí harías fetch al backend
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                paciente_nombre: "ADELINDA PALACIOS ENRIQUEZ",
                paciente_doc: "34674859",
                paciente_eps: "ASMET SALUD",
                // Simulamos que este paciente SI tiene el examen hecho
                val_preanestesica: "SI" 
            }));
        }, 500);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const agregarNotaRapida = (texto: string) => {
    const fechaHora = new Date().toLocaleString('es-CO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    const nota = `[${fechaHora}] ${texto}`;
    setFormData(prev => ({
        ...prev,
        nueva_nota: prev.nueva_nota ? `${prev.nueva_nota}\n${nota}` : nota
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      console.log("Guardando:", formData);
      setIsLoading(false);
      router.push(`/navegacion/admin/detalle?id=${id}`);
    }, 1000);
  };

  if (!id) return null;

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 pb-24 bg-slate-50 min-h-screen p-6 flex justify-center">
      
      <div className="bg-white rounded-xl shadow-lg w-full overflow-hidden border border-slate-200">
        
        {/* 1. ENCABEZADO AZUL */}
        <div className="bg-blue-600 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm font-bold uppercase mb-1">
                    <UserCog size={18}/> Gestionar Caso
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {formData.paciente_nombre}
                </h1>
            </div>
            <div className="bg-blue-700/50 rounded-lg p-2 px-4 text-right border border-blue-500/30">
                <div className="text-xl font-bold text-white tracking-widest">{formData.paciente_doc}</div>
                <div className="text-xs text-blue-100 font-bold uppercase">{formData.paciente_eps}</div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {/* 2. GRID DE DOS COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* COLUMNA IZQUIERDA: Clasificación */}
                <div>
                    <h3 className="text-sm font-bold text-blue-600 mb-4 border-b border-slate-100 pb-2">Clasificación Administrativa</h3>
                    
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Estado Solicitud</label>
                        <select name="estado" value={formData.estado} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            {LISTAS.estados.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Tipo de Paciente</label>
                            <select name="tipo_paciente" value={formData.tipo_paciente} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                {LISTAS.tipos_paciente.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Prestador Asignado</label>
                            <select name="prestador" value={formData.prestador} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                {LISTAS.prestadores.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-bold text-red-500 mb-1 block">Barrera de Acceso</label>
                        <select name="barrera" value={formData.barrera} onChange={handleChange} className="w-full p-2.5 border border-red-200 rounded-lg text-sm bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500 outline-none">
                            {LISTAS.barreras.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Datos Procedimiento */}
                <div>
                    <h3 className="text-sm font-bold text-blue-600 mb-4 border-b border-slate-100 pb-2">Datos del Procedimiento</h3>
                    
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Procedimiento / Servicio</label>
                        <select name="procedimiento" value={formData.procedimiento} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            {LISTAS.procedimientos.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        
                        {/* --- AQUÍ ESTÁ EL CAMBIO: CUPS CON NOMBRE --- */}
                        <div className="mt-2 p-2 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-2">
                            <Hash size={12} className="text-slate-400"/>
                            <span className="font-bold">CUPS {formData.cups_codigo}:</span> {formData.cups_nombre}
                        </div>
                    </div>

                    {/* --- AQUÍ ESTÁ EL CAMBIO: VALORACIÓN PREANESTÉSICA --- */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 mb-1 block flex items-center gap-1">
                            <Stethoscope size={14} className="text-purple-500"/> ¿Valoración Preanestésica Realizada?
                        </label>
                        <select 
                            name="val_preanestesica" 
                            value={formData.val_preanestesica} 
                            onChange={handleChange} 
                            className={`w-full p-2.5 border rounded-lg text-sm outline-none font-bold
                                ${formData.val_preanestesica === 'SI' 
                                    ? 'bg-green-50 border-green-300 text-green-700' 
                                    : 'bg-white border-slate-300 text-slate-700'}
                            `}
                        >
                            {LISTAS.opciones_anestesia.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Fecha Solicitud</label>
                            <input type="date" name="fecha_solicitud" value={formData.fecha_solicitud} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-green-600 mb-1 block">Fecha Cita</label>
                            <input type="date" name="fecha_cita" value={formData.fecha_cita} onChange={handleChange} className="w-full p-2.5 border border-green-300 rounded-lg text-sm bg-green-50 focus:ring-2 focus:ring-green-500 outline-none"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SECCIÓN NOTAS */}
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
                    <MessageCircle size={16}/> Nueva Nota de Gestión
                </h4>
                
                {/* Botones Rápidos */}
                <div className="flex gap-2 mb-3 flex-wrap">
                    <button type="button" onClick={() => agregarNotaRapida("No contesta la llamada.")} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-100 flex items-center gap-1 transition-colors">
                        <PhoneOff size={12}/> No contesta
                    </button>
                    <button type="button" onClick={() => agregarNotaRapida("Paciente confirma cita y asistencia.")} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-100 flex items-center gap-1 transition-colors">
                        <CheckCircle size={12}/> Cita OK
                    </button>
                    <button type="button" onClick={() => agregarNotaRapida("Se contacta por WhatsApp.")} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-100 flex items-center gap-1 transition-colors">
                        <MessageCircle size={12}/> WA
                    </button>
                    <button type="button" onClick={() => agregarNotaRapida("Número equivocado.")} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-100 flex items-center gap-1 transition-colors">
                        <XCircle size={12}/> Num. Mal
                    </button>
                </div>

                <textarea 
                    name="nueva_nota" 
                    value={formData.nueva_nota} 
                    onChange={handleChange}
                    rows={3}
                    placeholder="Escribe aquí la nueva gestión..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                ></textarea>
            </div>

            {/* 4. HISTORIAL */}
            <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Historial Completo</label>
                <textarea 
                    readOnly
                    value={formData.historial}
                    rows={4}
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none resize-none"
                ></textarea>
            </div>

            {/* 5. FOOTER BOTONES */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <Link 
                    href={`/navegacion/admin/detalle?id=${id}`} 
                    className="px-6 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
                >
                    <ArrowLeft size={16}/> Volver
                </Link>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors text-sm flex items-center gap-2 disabled:opacity-70"
                >
                    {isLoading ? 'Guardando...' : <><Save size={16}/> Guardar Cambios</>}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
      <FormularioGestion />
    </Suspense>
  );
}