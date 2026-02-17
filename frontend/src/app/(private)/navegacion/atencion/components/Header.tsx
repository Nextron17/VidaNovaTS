"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Menu, X, Settings, LogOut, 
  User as UserIcon, ChevronDown, Bell, 
  ShieldCheck, HelpCircle, Sparkles 
} from 'lucide-react';
import { useUser } from '@/src/app/context/UserContext'; 
import api from '@/src/app/services/api';

interface HeaderProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void; 
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const { user, logout } = useUser();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [alertCount, setAlertCount] = useState(0); 
    const menuRef = useRef<HTMLDivElement>(null);

    // 1. Cargar conteo de alertas (Efecto real)
    useEffect(() => {
        const fetchAlertCount = async () => {
            try {
                // Descomentar cuando el endpoint esté listo
                // const res = await api.get('/alerts/count'); 
                // if (res.data.success) setAlertCount(res.data.count);
                setAlertCount(5); // Simulación operativa
            } catch (e) {
                console.error("Error al cargar alertas");
            }
        };
        fetchAlertCount();
    }, []);

    // 2. Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name?: string) => {
        return name ? name.substring(0, 2).toUpperCase() : <UserIcon size={18} />;
    };

    return (
        <header className="flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 transition-all">
            
            {/* --- IZQUIERDA: Identidad del Módulo --- */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 lg:hidden border border-transparent transition-all"
                >
                    {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">
                            Vidanova Operativo
                        </h2>
                    </div>
                    <h1 className="text-sm font-bold text-slate-700 hidden sm:block mt-1">
                        Gestión de Navegación
                    </h1>
                </div>
            </div>

            {/* --- DERECHA: Acciones y Perfil --- */}
            <div className="flex items-center gap-2 sm:gap-4">
                
                {/* CAMPANA DE ALERTAS (Color Esmeralda/Orange para contraste) */}
                <Link href="/navegacion/atencion/alerta">
                    <button className="relative p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all group">
                        <Bell size={20} className={alertCount > 0 ? "group-hover:animate-bounce" : ""} />
                        {alertCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1 shadow-sm">
                                {alertCount > 9 ? '+9' : alertCount}
                            </span>
                        )}
                    </button>
                </Link>

                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                {/* MENÚ DE USUARIO */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className={`
                            flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all border 
                            ${showProfileMenu 
                                ? 'bg-white shadow-lg border-emerald-100 ring-4 ring-emerald-500/5' 
                                : 'bg-transparent border-transparent hover:bg-slate-50'
                            }
                        `}
                    >
                        {/* Avatar dinámico con los colores del Sidebar */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-900/20`}>
                            {getInitials(user?.name)}
                        </div>
                        
                        <div className="text-left hidden md:block">
                            <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[120px]">
                                {user?.name || 'Navegador'}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <ShieldCheck size={10} className="text-emerald-500" />
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                    {user?.role?.replace('_', ' ') || 'NAVIGATOR'}
                                </p>
                            </div>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`}/>
                    </button>

                    {/* DROPDOWN PREMIUM */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top-right ring-1 ring-slate-900/5">
                            {/* Header del Perfil */}
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-slate-900 text-sm">{user?.name}</p>
                                    <Sparkles size={12} className="text-emerald-500" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium truncate">
                                    {user?.email || 'operativo@vidanova.com'}
                                </p>
                            </div>

                            {/* Opciones de Menú */}
                            <div className="p-2 space-y-1">
                                <Link href="/navegacion/atencion/perfil" className="w-full px-4 py-3 hover:bg-emerald-50 rounded-2xl flex items-center gap-3 text-slate-600 transition-all group">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-emerald-200 transition-colors">
                                        <Settings size={16} className="text-slate-400 group-hover:text-emerald-500"/>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight group-hover:text-emerald-700">Mi Cuenta</span>
                                </Link>

                                <Link href="/navegacion/atencion/soporte" className="w-full px-4 py-3 hover:bg-blue-50 rounded-2xl flex items-center gap-3 text-slate-600 transition-all group">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-blue-200 transition-colors">
                                        <HelpCircle size={16} className="text-slate-400 group-hover:text-blue-500"/>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight group-hover:text-blue-700">Soporte</span>
                                </Link>

                                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                                <button 
                                    onClick={logout} 
                                    className="w-full px-4 py-3 hover:bg-rose-50 rounded-2xl flex items-center gap-3 text-slate-600 transition-all group"
                                >
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-rose-200 transition-colors">
                                        <LogOut size={16} className="text-slate-400 group-hover:text-rose-500"/>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight group-hover:text-rose-600">Salir del Sistema</span>
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