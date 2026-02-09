"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, Moon, Sun, Settings, LogOut, User as UserIcon, ChevronDown, Bell } from 'lucide-react';
import { useUser } from '@/src/app/context/UserContext'; 

interface HeaderProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void; 
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const { user, logout } = useUser();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Cierra el menú al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDark = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        document.documentElement.classList.toggle('dark', newDark);
    };

    return (
        // Header sticky que se ajusta al ancho disponible
        <header className={`flex justify-between items-center px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 transition-all duration-300`}>
            
            {/* Lado Izquierdo: Título y Toggle Sidebar */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors lg:hidden"
                >
                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                    PANEL ADMINISTRATIVO
                </h2>
            </div>

            {/* Lado Derecho: Acciones y Perfil */}
            <div className="flex items-center gap-2 sm:gap-4">
                
                {/* --- AQUÍ ESTÁ EL CAMBIO: Notificaciones con Link --- */}
                <Link href="/navegacion/admin/alertas">
                    <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Centro de Alertas">
                        <Bell size={20} />
                        {/* Punto rojo animado */}
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                    </button>
                </Link>

                {/* Separador Vertical */}
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                {/* Menú de Usuario */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden relative">
                            {user?.foto_url ? (
                                <Image src={user.foto_url} alt="Profile" fill className="object-cover" />
                            ) : (
                                <UserIcon size={18} />
                            )}
                        </div>
                        
                        <div className="text-left hidden md:block">
                            <p className="text-xs font-bold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                                {user?.nombre_usuario || 'Coordinador Navegación'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                {user?.rol || 'ADMIN'}
                            </p>
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}/>
                    </button>

                    {/* Dropdown del Perfil */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right">
                            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                <p className="font-bold text-slate-800 text-sm truncate">{user?.nombre_usuario}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.correo || 'admin@vidanova.com'}</p>
                            </div>
                            <ul className="py-1 text-sm text-slate-600">
                                <li>
                                    <button onClick={toggleDark} className="w-full px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 hover:text-blue-600 transition-colors">
                                        {isDark ? <Sun size={16}/> : <Moon size={16}/>} 
                                        <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                                    </button>
                                </li>
                                <li>
                                    <Link href="/perfil" className="w-full px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 hover:text-blue-600 transition-colors">
                                        <Settings size={16}/> <span>Configuración</span>
                                    </Link>
                                </li>
                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                <li>
                                    <button onClick={logout} className="w-full px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors">
                                        <LogOut size={16}/> <span>Cerrar Sesión</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;