"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/src/app/services/api';

// 🛡️ 1. DEFINIMOS TODOS LOS ROLES VÁLIDOS (Añadido AUDITOR que existía en tu backend)
export type UserRole = 'SUPER_ADMIN' | 'COORDINATOR_NAVIGATOR' | 'NAVIGATOR' | 'AUDITOR';

export interface User {
    id: number;
    name: string;
    documentNumber: string; 
    email?: string;         
    phone?: string;
    role: UserRole; // Enlace estricto al tipo de roles
    status: "online" | "offline" | "busy";
    avatarColor?: string;   
}

// 🛡️ 2. EXPORTAMOS LA INTERFAZ (Para que el RoleGuard pueda usar 'isLoading')
export interface UserContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isLoading: boolean; // Vital para que el Guardián sepa cuándo terminó de leer el localStorage
    refreshUser: () => Promise<void>; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    
    // Inicia en TRUE para que la app no intente dibujar vistas protegidas hasta leer el localStorage
    const [isLoading, setIsLoading] = useState(true); 
    const router = useRouter();

    // --- CARGA INICIAL SILENCIOSA ---
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                setToken(storedToken);
                
                // Restauramos estilo visual
                const userWithStyle = { 
                    ...parsedUser, 
                    avatarColor: parsedUser.avatarColor || 'from-slate-700 to-slate-900' 
                };
                
                setUser(userWithStyle);
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (e) {
                console.error("Error recuperando sesión:", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        
        // Finaliza la carga, ahora el RoleGuard sabe que puede verificar los roles
        setIsLoading(false);
    }, []);

    // --- LOGIN Y REDIRECCIÓN ESTRATÉGICA ---
    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        console.log(`🔐 Acceso autorizado: ${userData.role}`);

        // 🚀 LÓGICA DE REDIRECCIÓN (Redirige basándose en el rol estricto)
        if (['SUPER_ADMIN', 'COORDINATOR_NAVIGATOR', 'AUDITOR'].includes(userData.role)) {
            router.push('/navegacion/admin'); 
        } else if (userData.role === 'NAVIGATOR') {
            router.push('/navegacion/atencion/pacientes'); // Corregido: apunto directo a la lista de pacientes
        } else {
            alert("Tu rol no tiene acceso al módulo de Navegación.");
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        router.push('/login');
    };

    const refreshUser = async () => {
        if (!token) return;
        try {
            const response = await api.get('/users/me'); 
            const fetchedUser: User = response.data;
            setUser(fetchedUser); 
            localStorage.setItem('user', JSON.stringify(fetchedUser));
        } catch (error: any) {
            // Si el backend responde 401 (token expirado o cuenta suspendida), lo sacamos a patadas.
            if (error.response?.status === 401) logout();
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
    if (context === undefined) throw new Error('useUser debe usarse dentro de un UserProvider');
    return context;
};