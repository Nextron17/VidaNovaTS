"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Settings, LogOut, User as UserIcon, ChevronDown, Bell, ShieldCheck } from 'lucide-react';
import { useUser } from '@/src/app/context/UserContext'; 
import api from '@/src/app/services/api'; // Importamos tu axios configurado

interface HeaderProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void; 
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const { user, logout } = useUser();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [alertCount, setAlertCount] = useState(0); // Estado para el número de alertas
    const menuRef = useRef<HTMLDivElement>(null);

    // 1. Cargar conteo de alertas al iniciar
    useEffect(() => {
        const fetchAlertCount = async () => {
            try {
                const res = await api.get('/alerts/count'); // Ruta que creamos en el Paso 1
                if (res.data.success) setAlertCount(res.data.count);
            } catch (e) {
                console.error("Error al cargar alertas");
            }
        };

        fetchAlertCount();
        // Opcional: Actualizar cada 5 minutos
        const interval = setInterval(fetchAlertCount, 300000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
            
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-50 lg:hidden border border-transparent">
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                
                <div className="flex flex-col">
                    <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">Vidanova</h2>
                    <h1 className="text-sm font-bold text-slate-700 hidden sm:block">Panel Administrativo</h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                
                {/* CENTRO DE ALERTAS CON CONTADOR DINÁMICO */}
                <Link href="/navegacion/admin/alertas">
                    <button className="relative p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all group">
                        <Bell size={20} className={alertCount > 0 ? "animate-wiggle" : ""} />
                        
                        {alertCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-600 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1 shadow-sm">
                                {alertCount > 9 ? '+9' : alertCount}
                            </span>
                        )}
                    </button>
                </Link>

                <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>

                {/* MENÚ DE USUARIO */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className={`flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all border ${showProfileMenu ? 'bg-slate-50 border-slate-200' : 'bg-white border-transparent hover:border-slate-200'}`}
                    >
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <UserIcon size={18} strokeWidth={2.5} />
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-xs font-black text-slate-800 leading-tight">{user?.nombre_usuario || 'Usuario Admin'}</p>
                            <div className="flex items-center gap-1">
                                <ShieldCheck size={10} className="text-blue-500" />
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{user?.rol || 'Administrador'}</p>
                            </div>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}/>
                    </button>

                    {/* DROPDOWN */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                                <p className="font-black text-slate-900 text-sm">{user?.nombre_usuario || 'Administrador'}</p>
                                <p className="text-xs text-slate-500 font-medium truncate">{user?.correo || 'admin@vidanova.com'}</p>
                            </div>
                            <div className="p-2">
                                <Link href="/navegacion/admin/config" className="w-full px-4 py-3 hover:bg-blue-50 rounded-2xl flex items-center gap-3 text-slate-600 transition-all group">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><Settings size={16}/></div>
                                    <span className="text-xs font-bold uppercase">Configuración</span>
                                </Link>
                                <button onClick={logout} className="w-full px-4 py-3 hover:bg-red-50 rounded-2xl flex items-center gap-3 text-slate-600 transition-all">
                                    <div className="p-2 bg-white rounded-lg shadow-sm"><LogOut size={16}/></div>
                                    <span className="text-xs font-bold uppercase">Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;