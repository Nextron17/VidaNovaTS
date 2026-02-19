"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Save, User, ShieldCheck, MapPin, 
  Loader2
} from "lucide-react";

import api from "@/src/app/services/api";

function EditarPacienteAtencionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    documentType: "CC",
    documentNumber: "",
    birthDate: "", 
    gender: "SIN DATO",
    status: "ACTIVO",
    insurance: "",
    regimen: "CONTRIBUTIVO",
    city: "",
    department: "",
    address: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    const fetchPaciente = async () => {
      if (!id) return;
      try {
        const response = await api.get(`/patients/${id}`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            setFormData({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                documentType: data.documentType ? data.documentType.toUpperCase() : "CC",
                documentNumber: data.documentNumber || "",
                birthDate: data.birthDate ? String(data.birthDate).split('T')[0] : "",
                gender: data.gender ? data.gender.toUpperCase() : "SIN DATO",
                status: data.status ? data.status.toUpperCase() : "ACTIVO",
                insurance: data.insurance || "",
                regimen: data.regimen ? data.regimen.toUpperCase() : "CONTRIBUTIVO",
                city: data.city || "",
                department: data.department || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || ""
            });
        } else {
            alert("No se encontró la información.");
            router.push("/navegacion/atencion/pacientes");
        }
      } catch (error) {
        console.error("Error cargando:", error);
        alert("Error de conexión.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchPaciente();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = (name === 'documentType' || name === 'status' || name === 'gender' || name === 'regimen') 
        ? value.toUpperCase() 
        : value;
        
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put(`/patients/${id}`, formData);
      alert("✅ Datos del paciente actualizados.");
      router.push(`/navegacion/atencion/pacientes/perfil?id=${id}`);
      router.refresh(); 
    } catch (error: any) {
      console.error("Error update:", error);
      alert("Error al guardar: " + (error.response?.data?.message || "Intente nuevamente."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 pb-24 bg-white p-6 md:p-10 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
            <Link href={`/navegacion/atencion/pacientes/perfil?id=${id}`} className="p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all border border-slate-100">
                <ArrowLeft size={20}/>
            </Link>
            <div>
                <h1 className="text-2xl font-black text-slate-900">Actualizar Información</h1>
                <p className="text-slate-500 text-sm font-medium">Gestión de datos operativos del paciente.</p>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* DATOS PERSONALES */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><User size={20}/></div>
                <h2 className="font-black uppercase tracking-widest text-sm text-slate-700">Información Personal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="label-edit">Nombres</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-edit" required />
                </div>
                <div>
                    <label className="label-edit">Apellidos</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-edit" required />
                </div>
                <div>
                    <label className="label-edit">Estado Vital</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="input-edit font-bold text-emerald-600">
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="FALLECIDO">FALLECIDO</option>
                        <option value="INACTIVO">INACTIVO</option>
                    </select>
                </div>

                <div>
                    <label className="label-edit">Tipo Documento</label>
                    <select name="documentType" value={formData.documentType} onChange={handleChange} className="input-edit">
                        <option value="CC">Cédula (CC)</option>
                        <option value="TI">Tarjeta (TI)</option>
                        <option value="CE">Extranjería (CE)</option>
                        <option value="RC">Registro Civil (RC)</option>
                        <option value="PA">Pasaporte (PA)</option>
                        <option value="PE">Permiso Especial (PE)</option>
                        <option value="PPT">PPT</option>
                    </select>
                </div>
                <div>
                    <label className="label-edit">Número de Documento</label>
                    <input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} className="input-edit font-bold text-slate-700" required />
                </div>
                
                <div>
                    <label className="label-edit">Fecha Nacimiento</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="input-edit" />
                </div>
                <div>
                    <label className="label-edit">Género</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="input-edit">
                        <option value="SIN DATO">SIN DATO</option>
                        <option value="FEMENINO">FEMENINO</option>
                        <option value="MASCULINO">MASCULINO</option>
                        <option value="OTRO">OTRO</option>
                    </select>
                </div>
            </div>
        </section>

        <hr className="border-slate-100" />

        {/* AFILIACIÓN */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20}/></div>
                <h2 className="font-black uppercase tracking-widest text-sm text-slate-700">Afiliación Salud</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="label-edit">Entidad Aseguradora (EPS)</label>
                    <input type="text" name="insurance" value={formData.insurance} onChange={handleChange} className="input-edit text-blue-700 font-bold" />
                </div>
                <div>
                    <label className="label-edit">Régimen</label>
                    <select name="regimen" value={formData.regimen} onChange={handleChange} className="input-edit">
                        <option value="CONTRIBUTIVO">CONTRIBUTIVO</option>
                        <option value="SUBSIDIADO">SUBSIDIADO</option>
                        <option value="ESPECIAL">ESPECIAL</option>
                        <option value="PARTICULAR">PARTICULAR</option>
                    </select>
                </div>
            </div>
        </section>

        <hr className="border-slate-100" />

        {/* UBICACIÓN */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><MapPin size={20}/></div>
                <h2 className="font-black uppercase tracking-widest text-sm text-slate-700">Ubicación y Contacto</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="label-edit">Departamento</label>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} className="input-edit" />
                </div>
                <div>
                    <label className="label-edit">Ciudad</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-edit" />
                </div>
                <div>
                    <label className="label-edit">Teléfonos de Contacto</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-edit font-bold text-emerald-700" placeholder="Ej: 300..." />
                </div>
                <div className="md:col-span-2">
                    <label className="label-edit">Dirección de Residencia</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-edit" />
                </div>
                <div>
                    <label className="label-edit">Correo Electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-edit" />
                </div>
            </div>
        </section>

        <div className="flex gap-4 pt-8 border-t border-slate-100">
            <Link href={`/navegacion/atencion/pacientes/perfil?id=${id}`} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest text-center hover:bg-slate-200 transition-all">
                Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Guardar Cambios
            </button>
        </div>
      </form>

      <style jsx>{`
        .label-edit { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
        .input-edit { width: 100%; padding: 0.8rem 1rem; background-color: #f8fafc; border: 2px solid #f1f5f9; border-radius: 12px; font-size: 0.9rem; font-weight: 600; color: #334155; transition: all 0.2s ease; outline: none; }
        .input-edit:focus { background-color: #fff; border-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-emerald-300" /></div>}>
      <EditarPacienteAtencionContent />
    </Suspense>
  );
}