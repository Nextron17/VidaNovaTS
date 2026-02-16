"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/src/app/services/api';

// ✅ DEFINIMOS SOLO LOS ROLES ACTIVOS DEL SISTEMA
export type UserRole = 'SUPER_ADMIN' | 'COORDINATOR_NAVIGATOR' | 'NAVIGATOR';

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

interface UserContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isLoading: boolean;
    refreshUser: () => Promise<void>; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // --- CARGA INICIAL ---
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
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    // --- LOGIN Y REDIRECCIÓN ESTRATÉGICA ---
    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        console.log(`🔐 Acceso: ${userData.role}`);

        // 🚀 LÓGICA DE REDIRECCIÓN (SOLO 2 CAMINOS)
        switch (userData.role) {
            // CAMINO A: GESTIÓN Y ADMINISTRACIÓN
            case 'SUPER_ADMIN':
            case 'COORDINATOR_NAVIGATOR':
                router.push('/navegacion/admin'); 
                break;

            // CAMINO B: OPERACIÓN DIARIA
            case 'NAVIGATOR':
                router.push('/navegacion/atencion'); 
                break;

            // SI ES UN ROL NO PERMITIDO O VIEJO
            default:
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
    if (context === undefined) throw new Error('useUser error');
    return context;
};