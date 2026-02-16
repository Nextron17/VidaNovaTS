"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Menu, X, Search, Bell, LogOut, 
  User as UserIcon, ChevronDown, Settings, 
  HelpCircle, Sparkles 
} from 'lucide-react';
import { useUser } from '@/src/app/context/UserContext'; 

interface HeaderProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void; 
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
    // ✅ Usamos los datos del contexto corregido
    const { user, logout } = useUser();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [alertCount, setAlertCount] = useState(0); 
    const menuRef = useRef<HTMLDivElement>(null);

    // 1. Simulación de Alertas (Tareas pendientes, mensajes nuevos)
    useEffect(() => {
        // Aquí conectarías con tu endpoint real de notificaciones
        setAlertCount(5); 
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

    const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : 'NV';

    return (
        <header className="flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 transition-all">
            
            {/* --- IZQUIERDA: Toggle y Buscador Rápido --- */}
            <div className="flex items-center gap-4 flex-1">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden border border-transparent transition-colors"
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                
                {/* 🔥 BUSCADOR RÁPIDO (Exclusivo para Operativos) */}
                <div className="hidden md:flex items-center w-full max-w-md relative group">
                    <Search className="absolute left-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Buscar paciente por cédula o nombre..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                    />
                    <div className="absolute right-2 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-bold hidden lg:block">
                        CTRL + K
                    </div>
                </div>
            </div>

            {/* --- DERECHA: Acciones y Perfil --- */}
            <div className="flex items-center gap-2 sm:gap-4">
                
                {/* Estado: EN TURNO */}
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wide">En Turno</span>
                </div>

                {/* Notificaciones */}
                <button className="relative p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all group">
                    <Bell size={20} className={alertCount > 0 ? "group-hover:animate-swing" : ""} />
                    {alertCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                    )}
                </button>

                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                {/* MENÚ DE USUARIO */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className={`flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all border ${showProfileMenu ? 'bg-white shadow-md border-slate-100' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                    >
                        {/* Avatar Dinámico */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user?.avatarColor || 'from-emerald-500 to-teal-600'} flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-900/10`}>
                            {getInitials(user?.name)}
                        </div>
                        
                        <div className="text-left hidden md:block">
                            <p className="text-xs font-black text-slate-800 leading-tight truncate max-w-[100px]">
                                {user?.name || 'Navegador'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                {user?.role?.replace('_', ' ') || 'NAVIGATOR'}
                            </p>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}/>
                    </button>

                    {/* DROPDOWN FLOTANTE */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-slate-900/5">
                            
                            {/* Cabecera del Dropdown */}
                            <div className="p-5 bg-slate-50/50 border-b border-slate-100">
                                <h4 className="font-black text-slate-900 text-sm">{user?.name}</h4>
                                <p className="text-xs text-slate-500 font-medium truncate mb-2">{user?.email}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                    <Sparkles size={10}/>
                                    Nivel Operativo
                                </span>
                            </div>

                            {/* Opciones */}
                            <div className="p-2 space-y-1">
                                <Link href="/navegacion/atencion/perfil" className="w-full px-4 py-2.5 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-slate-600 transition-all group">
                                    <Settings size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors"/>
                                    <span className="text-xs font-bold text-slate-600">Mi Cuenta</span>
                                </Link>
                                
                                <Link href="/navegacion/atencion/soporte" className="w-full px-4 py-2.5 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-slate-600 transition-all group">
                                    <HelpCircle size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors"/>
                                    <span className="text-xs font-bold text-slate-600">Ayuda & Soporte</span>
                                </Link>

                                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                                <button onClick={logout} className="w-full px-4 py-2.5 hover:bg-rose-50 rounded-xl flex items-center gap-3 text-slate-600 transition-all group">
                                    <LogOut size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors"/>
                                    <span className="text-xs font-bold group-hover:text-rose-600">Cerrar Sesión</span>
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