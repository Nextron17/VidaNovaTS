"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar'; 
import Header from './components/Header';
// 🛡️ 1. IMPORTAMOS EL GUARDIÁN DE RUTAS
import RoleGuard from "@/src/app/components/RoleGuard";

export default function AtencionLayout({ children }: { children: React.ReactNode }) {
  // Estado inicial true para escritorio
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Recuperar preferencia del usuario
    const storedState = localStorage.getItem('sidebarOpen');
    if (storedState !== null) {
      setIsSidebarOpen(storedState === 'true');
    } else {
      // Si no hay preferencia, en móviles arranca cerrado
      setIsSidebarOpen(window.innerWidth > 768);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  // Evita el flash de contenido no coincidente (Hydration Mismatch)
  if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

  return (
    // 🛡️ 2. QUITAMOS EL UserProvider Y ENVOLVEMOS CON EL GUARDIÁN
    // Permitimos acceso a Navegadores y a sus superiores.
    <RoleGuard allowedRoles={['NAVIGATOR', 'SUPER_ADMIN', 'COORDINATOR_NAVIGATOR']}>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        
        {/* SIDEBAR (Fijo a la izquierda) */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* CONTENEDOR PRINCIPAL */}
        {/* Usamos transición en el margen para que se deslice suave junto al sidebar */}
        <div 
            className={`
                flex-1 flex flex-col min-w-0 
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} 
                ml-0 /* En móvil el margen es 0 porque el sidebar flota encima */
            `}
        >
            {/* HEADER (Sticky arriba) */}
            <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* ÁREA DE CONTENIDO */}
            <main className="flex-1 w-full p-4 md:p-8 overflow-x-hidden">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>

        </div>
      </div>
    </RoleGuard>
  );
}