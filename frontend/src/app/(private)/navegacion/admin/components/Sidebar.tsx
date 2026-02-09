"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileSpreadsheet, BarChart3, 
  Settings, LogOut, Activity, Calendar, ChevronRight, ClipboardCheck, Library
} from 'lucide-react';
import { useUser } from '@/src/app/context/UserContext';

// 🔥 IMPORTAMOS EL COMPONENTE DE DESCARGA
import DownloadBackupItem from '@/src/app/(private)/navegacion/components/DownloadBackupItem';

interface SidebarProps {
    isOpen: boolean; 
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const pathname = usePathname();
    const { logout } = useUser();
    const [isHovered, setIsHovered] = useState(false);

    // Lógica maestra: Se abre si isOpen es true O si el mouse está encima
    const isExpanded = isOpen || isHovered;

    const basePath = `/navegacion/admin`;

    const menuGroups = useMemo(() => [
        {
            label: "PRINCIPAL",
            items: [
                { name: 'Tablero', href: `${basePath}`, icon: LayoutDashboard },
                { name: 'Agenda', href: `${basePath}/agenda`, icon: Calendar },
            ]
        },
        {
            label: "GESTIÓN",
            items: [
                { name: 'Pacientes', href: `${basePath}/pacientes`, icon: Users },
                { name: 'Carga Masiva', href: `${basePath}/importar`, icon: FileSpreadsheet },
            ]
        },
        {
            label: "SISTEMA",
            items: [
                { name: 'Analítica', href: `${basePath}/analitica`, icon: BarChart3 },
                { name: 'Auditoría de Datos', href: `${basePath}/auditoria`, icon: ClipboardCheck },
                { name: 'Configuración CUPS', href: `${basePath}/configcups`, icon: Library },
                { name: 'Ajustes', href: `${basePath}/config`, icon: Settings }, // Opcional si quieres mantenerlo
            ]
        },
    ], [basePath]);

    return (
        <aside 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                fixed top-0 left-0 z-50 h-screen 
                bg-[#0b1121] border-r border-slate-800/80
                flex flex-col 
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isExpanded ? 'w-64 shadow-2xl shadow-blue-900/20' : 'w-20'}
                overflow-hidden
            `}
        >
            {/* --- 1. LOGO HEADER --- */}
            <div className="h-20 flex items-center justify-center relative w-full border-b border-white/5">
                <div className={`flex items-center gap-3 transition-all duration-300 ${isExpanded ? 'px-6 w-full justify-start' : 'justify-center'}`}>
                    
                    {/* Icono del Logo */}
                    <div className="relative flex-shrink-0">
                        <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-md animate-pulse"></div>
                        <div className="relative bg-blue-600 p-2 rounded-xl text-white shadow-inner">
                            <Activity size={20} strokeWidth={3} />
                        </div>
                    </div>

                    {/* Texto del Logo */}
                    <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                        <h1 className="text-lg font-bold text-white tracking-tight leading-none">Vidanova</h1>
                        <span className="text-[9px] text-blue-400 font-bold tracking-[0.15em] uppercase">Admin</span>
                    </div>
                </div>
            </div>

            {/* --- 2. ÁREA DE NAVEGACIÓN --- */}
            <nav className="flex-grow flex flex-col py-6 gap-6 overflow-y-auto custom-scrollbar px-3">
                
                {menuGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="flex flex-col">
                        
                        {/* Título de Sección */}
                        <div className={`px-3 mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                                {group.label}
                            </span>
                        </div>
                        
                        {/* Separador cuando está cerrado */}
                        {!isExpanded && (
                            <div className="mx-auto w-8 h-px bg-slate-800/50 mb-3" />
                        )}

                        <div className="flex flex-col gap-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(`${item.href}/`));                                
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                            group relative flex items-center h-12 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
                                            ${isActive 
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-blue-200'
                                            }
                                            ${isExpanded ? 'px-3 mx-0' : 'justify-center mx-1'}
                                        `}
                                    >
                                        <div className={`flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${isExpanded ? '' : 'group-hover:scale-110'}`}>
                                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>

                                        <span className={`whitespace-nowrap font-medium text-sm transition-all duration-300 ease-in-out absolute left-12 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                                            {item.name}
                                        </span>

                                        {isActive && isExpanded && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                        {isActive && !isExpanded && <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_currentColor]"></div>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* --- SECCIÓN EXTRA: UTILIDADES / BACKUP --- */}
                <div className="mt-2 border-t border-slate-800/50 pt-4">
                    <div className={`px-3 mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            UTILIDADES
                        </span>
                    </div>
                    
                    {/* 🔥 AQUÍ ESTÁ EL BOTÓN DE DESCARGA INTEGRADO */}
                    <div className={isExpanded ? 'px-0' : 'px-1'}>
                        <DownloadBackupItem collapsed={!isExpanded} />
                    </div>
                </div>

            </nav>

            {/* --- 3. PIE DE PÁGINA (Usuario) --- */}
            <div className="p-3 border-t border-white/5 bg-[#080c17]">
                <div className={`flex items-center gap-3 rounded-xl p-2 transition-all duration-300 ${isExpanded ? 'bg-slate-900/50 border border-slate-800' : 'justify-center'}`}>
                    
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg flex-shrink-0 cursor-default ring-2 ring-[#0b1121]">
                        AD
                    </div>

                    <div className={`flex-grow overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                        <p className="text-xs font-bold text-white truncate">Admin</p>
                        <p className="text-[9px] text-slate-500 truncate">Pro Plan</p>
                    </div>

                    <button 
                        onClick={logout}
                        title="Salir"
                        className={`text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors flex-shrink-0 ${!isExpanded && 'hidden'}`}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;