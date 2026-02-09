"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/src/app/services/api';

// 1. DEFINIMOS ROLES Y ÁREAS
export type UserRole = 'ADMIN' | 'MEDICO' | 'NAVEGADOR' | 'FARMACEUTICO' | 'GESTOR';
export type UserArea = 'NAVEGACION' | 'ASISTENCIAL' | 'FARMACIA' | 'GERENCIA' | 'SISTEMAS';

export interface User {
    id_persona: number;
    nombre_usuario: string;
    correo: string;
    rol: UserRole;
    area?: UserArea; // Nuevo campo opcional
    estado: "ACTIVO" | "PENDIENTE" | "INACTIVO";
    foto_url?: string;
    perfil?: {
        foto_url?: string;
    };
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

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                setToken(storedToken);
                const fotoUrl = parsedUser.perfil?.foto_url || parsedUser.foto_url || "/img/user.jpg";
                setUser({ ...parsedUser, foto_url: fotoUrl });
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (e) {
                console.error("Error parsing stored user data:", e);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        const fotoUrl = userData.perfil?.foto_url || userData.foto_url || "/img/user.jpg";
        const userToStore = { ...userData, foto_url: fotoUrl };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userToStore));
        setToken(newToken);
        setUser(userToStore);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // 🚀 LÓGICA DE REDIRECCIÓN POR ÁREA
        console.log(`Login: Rol=${userData.rol}, Área=${userData.area}`);

        if (userData.estado === 'PENDIENTE') {
            alert("Cuenta pendiente de aprobación.");
            logout();
            return;
        }

        // 1. SI ES JEFE (ADMIN)
        if (userData.rol === 'ADMIN') {
            switch (userData.area) {
                case 'NAVEGACION':
                    router.push('/navegacion/admin'); // <--- TU OBJETIVO
                    break;
                case 'ASISTENCIAL':
                    router.push('/asistencial/admin');
                    break;
                case 'FARMACIA':
                    router.push('/farmacia/admin');
                    break;
                default:
                    router.push('/admin/reportes'); // Super Admin
            }
            return;
        }

        // 2. SI ES OPERATIVO
        switch (userData.rol) {
            case 'MEDICO':
                router.push('/medico/pacientes');
                break;
            case 'NAVEGADOR':
            case 'GESTOR':
                router.push('/navegacion/pacientes');
                break;
            case 'FARMACEUTICO':
                router.push('/farmacia/despacho');
                break;
            default:
                router.push('/');
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
            const response = await api.get('/perfil');
            const fetchedUser: User = response.data;
            const fotoUrl = fetchedUser.perfil?.foto_url || fetchedUser.foto_url || "/img/user.jpg";
            const updatedUser = { ...fetchedUser, foto_url: fotoUrl };
            setUser(updatedUser); 
            localStorage.setItem('user', JSON.stringify(updatedUser));
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
    if (context === undefined) throw new Error('useUser must be used within a UserProvider');
    return context;
};