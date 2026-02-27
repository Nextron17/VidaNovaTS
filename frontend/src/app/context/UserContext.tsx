"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/src/app/services/api';

export type UserRole = 'SUPER_ADMIN' | 'COORDINATOR_NAVIGATOR' | 'NAVIGATOR' | 'AUDITOR';

export interface User {
    id: number;
    name: string;
    documentNumber: string; 
    email?: string;         
    phone?: string;
    role: UserRole;
    status: "online" | "offline" | "busy";
    avatarColor?: string;   
}

export interface UserContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: (reason?: string) => void; // 👈 Añadimos un motivo opcional
    isLoading: boolean;
    refreshUser: () => Promise<void>; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ⏱️ TIEMPO DE INACTIVIDAD PERMITIDO (Ej: 15 minutos en milisegundos)
const INACTIVITY_LIMIT = 15 * 60 * 1000; 

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); 
    const router = useRouter();

    // --- CARGA INICIAL (Mantenemos tu lógica igual) ---
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                setToken(storedToken);
                setUser({ ...parsedUser, avatarColor: parsedUser.avatarColor || 'from-slate-700 to-slate-900' });
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    // --- 🛡️ SISTEMA DE CIERRE POR INACTIVIDAD ---
    const logout = useCallback((reason?: string) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        
        if (reason) {
            alert(reason); // Opcional: Cambiar por un Toast bonito si usas Sonner/React-Hot-Toast
        }
        
        router.push('/login');
    }, [router]);

    useEffect(() => {
        let inactivityTimer: NodeJS.Timeout;

        // Solo activamos el vigilante si hay un usuario logueado
        if (!token) return;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                logout("⚠️ Tu sesión ha sido cerrada por seguridad tras 15 minutos de inactividad.");
            }, INACTIVITY_LIMIT);
        };

        // Escuchamos eventos clave (No usamos mousemove para no saturar la memoria)
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        events.forEach(event => window.addEventListener(event, resetTimer));
        
        // Inicializar el primer timer
        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [token, logout]); // Se re-ejecuta si el token cambia o si hacen logout


    // --- LOGIN Y REFRESH (Mantenemos tu lógica igual) ---
    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        if (['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'AUDITOR'].includes(userData.role)) {
            router.push('/navegacion/admin'); 
        } else if (userData.role === 'NAVIGATOR') {
            router.push('/navegacion/atencion/pacientes');
        } else {
            logout("Rol no autorizado.");
        }
    };

    const refreshUser = async () => {
        if (!token) return;
        try {
            const response = await api.get('/users/me'); 
            const fetchedUser: User = response.data;
            setUser(fetchedUser); 
            localStorage.setItem('user', JSON.stringify(fetchedUser));
        } catch (error: any) {
            if (error.response?.status === 401) logout("Sesión expirada");
        }
    };

    return (
        <UserContext.Provider value={{ user, token, login, logout, isLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) throw new Error('useUser error');
    return context;
};