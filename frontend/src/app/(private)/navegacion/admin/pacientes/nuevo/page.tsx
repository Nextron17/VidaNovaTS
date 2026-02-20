"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, User, Phone, MapPin, 
  Building2, Calendar, FileText, Loader2, Mail, 
  CheckCircle2, AlertCircle 
} from "lucide-react";
import api from "@/src/app/services/api";

export default function CrearPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    documentType: "CC",
    documentNumber: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "SIN DATO",
    phone: "",
    email: "",
    insurance: "",
    regimen: "CONTRIBUTIVO",
    address: "",
    city: "Popayán",
    department: "Cauca",
    status: "ACTIVO"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validación básica antes de enviar
    if (!formData.documentNumber || !formData.firstName || !formData.lastName) {
      alert("Por favor completa los campos obligatorios (*)");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/navegacion/patients", formData);
      
      if (res.data.success || res.status === 201 || res.status === 200) {
        // Redirigir a la lista con un flag de éxito
        router.push("/navegacion/admin/pacientes?success=true");
      }
    } catch (error: any) {
      console.error("Error creando paciente:", error);
      const msg = error.response?.data?.message || "Error al guardar. Verifica si la cédula ya existe.";
      alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800 pb-24">
      
      {/* --- HEADER --- */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center gap-4">
        <Link 
          href="/navegacion/admin/pacientes" 
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Crear Historia Clínica</h1>
          <p className="text-slate-500 font-medium text-sm">Ingresa la información sociodemográfica del nuevo paciente.</p>
        </div>
      </div>

      {/* --- FORMULARIO --- */}
      <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit}>
          
          {/* SECCIÓN 1: IDENTIFICACIÓN */}
          <div className="p-8 md:p-12 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Identificación</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Tipo Doc.</label>
                <div className="relative">
                  <select name="documentType" value={formData.documentType} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer appearance-none">
                    <option value="CC">Cédula (CC)</option>
                    <option value="TI">Tarjeta Identidad (TI)</option>
                    <option value="RC">Registro Civil (RC)</option>
                    <option value="CE">Extranjería (CE)</option>
                    <option value="PA">Pasaporte (PA)</option>
                    <option value="PE">Permiso Especial (PEP)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Número Documento <span className="text-red-500">*</span></label>
                <input required type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} placeholder="Ej: 1061700..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 text-lg outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-slate-300" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Estado</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer">
                  <option value="ACTIVO">🟢 Activo</option>
                  <option value="INACTIVO">🔴 Inactivo</option>
                  <option value="FALLECIDO">⚫ Fallecido</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS PERSONALES */}
          <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Datos Personales</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nombres <span className="text-red-500">*</span></label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Nombres completos" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Apellidos <span className="text-red-500">*</span></label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="Apellidos completos" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Fecha Nacimiento</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Género</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all">
                    <option value="SIN DATO">Seleccionar...</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="300..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="@correo.com" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: UBICACIÓN Y AFILIACIÓN */}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Afiliación y Residencia</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Aseguradora (EPS)</label>
                <input type="text" name="insurance" value={formData.insurance} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Ej: ASMET SALUD" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Régimen</label>
                <select name="regimen" value={formData.regimen} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all">
                  <option value="CONTRIBUTIVO">Contributivo</option>
                  <option value="SUBSIDIADO">Subsidiado</option>
                  <option value="ESPECIAL">Especial / Excepción</option>
                  <option value="PARTICULAR">Particular</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Departamento</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Ciudad / Municipio</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Dirección de Residencia</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="Ej: Calle 5 # 4-20" />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-8 md:p-12 bg-slate-50 border-t border-slate-100 flex flex-col-reverse md:flex-row justify-end gap-4">
            <Link 
              href="/navegacion/admin/pacientes" 
              className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-white hover:shadow-md transition-all text-center"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 hover:bg-blue-600 hover:shadow-blue-600/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {loading ? "Guardando..." : "Guardar Historia"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}