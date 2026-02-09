import React from "react";
import Link from "next/link";
import { User, Mail, Lock, Building2, Briefcase } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Solicitud de Acceso
          </h2>
          <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            ℹ️ Tu cuenta será revisada por un administrador. Recibirás un correo cuando sea aprobada.
          </p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre Completo */}
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Juan Pérez" />
              </div>
            </div>

            {/* Correo */}
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="juan@vidanova.com" />
              </div>
            </div>

            {/* Selector de Área */}
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Área Solicitada</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <select className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white">
                  <option value="">Seleccionar...</option>
                  <option value="NAVEGACION">Navegación</option>
                  <option value="ASISTENCIAL">Asistencial</option>
                  <option value="FARMACIA">Farmacia</option>
                </select>
              </div>
            </div>

            {/* Selector de Rol */}
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <select className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white">
                  <option value="">Seleccionar...</option>
                  <option value="ADMIN">Administrador / Jefe</option>
                  <option value="OPERATIVO">Operativo / Gestor</option>
                </select>
              </div>
            </div>

            {/* Contraseña */}
            <div className="col-span-2 relative">
               <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none shadow-md transition-colors"
          >
            Enviar Solicitud
          </button>
        </form>

         <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta aprobada?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Ingresar aquí
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}