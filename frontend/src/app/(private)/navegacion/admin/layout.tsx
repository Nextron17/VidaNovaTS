"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar'; 
import Header from './components/Header';
// 🛡️ 1. IMPORTAMOS EL GUARDIÁN
import RoleGuard from "@/src/app/components/RoleGuard"; // Ajusta la ruta si guardaste el RoleGuard en otra carpeta

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedState = localStorage.getItem('sidebarOpen');
    if (storedState !== null) {
      setIsSidebarOpen(storedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  if (!mounted) return null;

  return (
    // 🛡️ 2. QUITAMOS EL UserProvider Y ENVOLVEMOS TODO CON EL GUARDIÁN DE ROLES
    // Así, si un navegador intenta entrar, ni siquiera verá el Sidebar de Admin.
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'AUDITOR']}>
      <div className="flex min-h-screen bg-slate-50">
        
        {/* SIDEBAR FIJO */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* CONTENEDOR PRINCIPAL */}
        {/* ml-64/ml-20 empuja el contenido para no quedar debajo del sidebar */}
        <div 
            className={`
                flex-1 flex flex-col min-w-0 
                transition-[margin] duration-300 ease-in-out
                ${isSidebarOpen ? 'ml-64' : 'ml-20'}
            `}
        >
            {/* HEADER FIJO */}
            <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* CONTENIDO DE LA PÁGINA */}
            {/* w-full y max-w-full evitan el desbordamiento horizontal */}
            <main className="flex-1 w-full max-w-full p-6 overflow-x-hidden">
                <div className="animate-in fade-in duration-500">
                    {children}
                </div>
            </main>

        </div>
      </div>
    </RoleGuard>
  );
}