"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Save, User, ShieldCheck, MapPin, 
  Trash2, Loader2, Calendar
} from "lucide-react";

import api from "@/src/app/services/api";

function EditarPacienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // 🔥 CORRECCIÓN: Estado inicial con nombres en INGLÉS (Como en la BD)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    documentType: "CC",
    documentNumber: "",
    birthDate: "", // Usamos fecha nacimiento, la edad se calcula sola
    gender: "Femenino",
    status: "ACTIVO",
    insurance: "",
    regimen: "Contributivo",
    city: "",
    department: "",
    address: "",
    phone: "",
    email: ""
  });

  // 1. CARGAR DATOS DEL PACIENTE (GET)
  useEffect(() => {
    const fetchPaciente = async () => {
      if (!id) return;
      
      try {
        // 🔥 CORRECCIÓN: Ruta '/patients/' en lugar de '/pacientes/'
        const response = await api.get(`/patients/${id}`);
        
        // 🔥 CORRECCIÓN: Validar success y usar response.data.data
        if (response.data.success) {
            const data = response.data.data;
            
            // Mapeamos los datos que llegan de la BD al formulario
            setFormData({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                documentType: data.documentType || "CC",
                documentNumber: data.documentNumber || "",
                birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : "",
                gender: data.gender || "Femenino",
                status: data.status || "ACTIVO",
                insurance: data.insurance || "",
                regimen: data.regimen || "Contributivo",
                city: data.city || "",
                department: data.department || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || ""
            });
        } else {
            alert("No se encontró la información del paciente.");
        }

      } catch (error) {
        console.error("Error fetching paciente:", error);
        alert("Error al cargar los datos. Verifica la conexión.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchPaciente();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. GUARDAR CAMBIOS (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 🔥 CORRECCIÓN: Ruta '/patients/'
      await api.put(`/patients/${id}`, formData); // Ya no lleva '/' al final, suele ser mejor

      // Éxito
      alert("✅ Paciente actualizado correctamente.");
      router.push(`/navegacion/admin/pacientes/perfil?id=${id}`);
      router.refresh(); 
      
    } catch (error) {
      console.error("Error updating paciente:", error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ELIMINAR PACIENTE (DELETE)
  const handleDelete = async () => {
    if(!confirm("⚠️ ¿Estás seguro de eliminar este paciente?\n\nSe borrará todo su historial y NO se puede recuperar.")) return;

    try {
        await api.delete(`/patients/${id}`);
        alert("Paciente eliminado.");
        router.push("/navegacion/admin/pacientes"); 
        router.refresh();
    } catch (error) {
        console.error("Error deleting paciente:", error);
        alert("Error al eliminar el paciente.");
    }
  }

  if (isFetching) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-xs font-black tracking-widest uppercase">Cargando Información...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 pb-24 bg-white p-6 md:p-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
            <Link href={`/navegacion/admin/pacientes/perfil?id=${id}`} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all">
                <ArrowLeft size={24}/>
            </Link>
            <div>
                <h1 className="text-2xl font-black text-slate-900">Editar Perfil</h1>
                <p className="text-slate-500 text-sm">Actualiza la información básica y de contacto.</p>
            </div>
        </div>
        <button 
            onClick={handleDelete}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
            title="Eliminar Paciente"
        >
            <Trash2 size={20}/>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* SECCIÓN 1: DATOS PERSONALES */}
        <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
                <User size={20} strokeWidth={2.5}/>
                <h2 className="font-black uppercase tracking-widest text-sm">Información Personal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- FILA 1 --- */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombres</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field-edit" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Apellidos</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field-edit" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estado Vital</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="input-field-edit font-bold text-emerald-600">
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="FALLECIDO">FALLECIDO</option>
                        <option value="INACTIVO">INACTIVO</option>
                    </select>
                </div>

                {/* --- FILA 2 --- */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo Documento</label>
                    <select name="documentType" value={formData.documentType} onChange={handleChange} className="input-field-edit">
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="TI">Tarjeta de Identidad</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="RC">Registro Civil</option>
                        <option value="PA">Pasaporte</option>
                        <option value="PPT">PPT (Protección)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Número de Documento</label>
                    <input 
                        type="text" 
                        name="documentNumber" 
                        value={formData.documentNumber} 
                        onChange={handleChange} 
                        className="input-field-edit font-bold text-slate-700"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Fecha Nacimiento</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input-field-edit" />
                </div>

                {/* --- FILA 3 --- */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Género</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="input-field-edit">
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>

            </div>
        </section>

        {/* SECCIÓN 2: ASEGURAMIENTO */}
        <section className="pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2 mb-6 text-purple-600">
                <ShieldCheck size={20} strokeWidth={2.5}/>
                <h2 className="font-black uppercase tracking-widest text-sm">Aseguramiento (EPS)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Entidad Aseguradora</label>
                    <input type="text" name="insurance" value={formData.insurance} onChange={handleChange} className="input-field-edit text-blue-700 font-bold" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Régimen</label>
                    <select name="regimen" value={formData.regimen} onChange={handleChange} className="input-field-edit">
                        <option value="Contributivo">Contributivo</option>
                        <option value="Subsidiado">Subsidiado</option>
                        <option value="Especial">Especial</option>
                        <option value="Particular">Particular</option>
                    </select>
                </div>
            </div>
        </section>

        {/* SECCIÓN 3: UBICACIÓN Y CONTACTO */}
        <section className="pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2 mb-6 text-orange-500">
                <MapPin size={20} strokeWidth={2.5}/>
                <h2 className="font-black uppercase tracking-widest text-sm">Ubicación y Contacto</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Departamento</label>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} className="input-field-edit" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ciudad</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field-edit" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Teléfonos</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-field-edit font-bold text-emerald-700" placeholder="Separa con comas..." />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dirección de Residencia</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field-edit" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Correo Electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field-edit" />
                </div>
            </div>
        </section>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-4 pt-10 border-t border-slate-100">
            <Link 
                href={`/navegacion/admin/pacientes/perfil?id=${id}`}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest text-center hover:bg-slate-200 transition-all"
            >
                Cancelar
            </Link>
            <button 
                type="submit"
                disabled={isLoading}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    <><Loader2 size={18} className="animate-spin"/> Guardando...</>
                ) : (
                    <><Save size={18}/> Guardar Cambios</>
                )}
            </button>
        </div>
      </form>

      <style jsx>{`
        .input-field-edit {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: #f8fafc;
            border: 2px solid #f1f5f9;
            border-radius: 12px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            outline: none;
        }
        .input-field-edit:focus {
            background-color: #fff;
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
    }>
      <EditarPacienteContent />
    </Suspense>
  );
}