"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user'); 

        if (!userData) {
            // Si no hay sesión, expulsar al Login
            router.replace('/login');
            return;
        }

        try {
            const user = JSON.parse(userData);

            if (!allowedRoles.includes(user.role)) {
                if (user.role === 'NAVIGATOR') {
                    router.replace('/navegacion/atencion/pacientes');
                } else if (user.role === 'SUPER_ADMIN' || user.role === 'COORDINATOR_NAVIGATOR' || user.role === 'AUDITOR') {
                    router.replace('/navegacion/admin');
                } else {
                    router.replace('/login');
                }
            } else {
                // Todo está bien, conceder acceso visual
                setIsAuthorized(true);
            }
        } catch (error) {
            console.error("Error leyendo datos de sesión", error);
            router.replace('/login');
        }
    }, [router, allowedRoles]);

    // Mientras verifica, mostramos un spinner para que no haya "parpadeo" de la vista prohibida
    if (!isAuthorized) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Verificando credenciales...</p>
            </div>
        );
    }

    // Si está autorizado, renderizamos la página real
    return <>{children}</>;
}