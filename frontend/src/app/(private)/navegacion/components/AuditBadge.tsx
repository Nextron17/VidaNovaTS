"use client";

import { History } from 'lucide-react'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditBadgeProps {
    logs: any[];
}

export default function AuditBadge({ logs }: AuditBadgeProps) {
    // 🛡️ Validación estricta para evitar errores de renderizado
    if (!logs || logs.length === 0 || !logs[0]?.user) return null;

    const lastLog = logs[0];

    return (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-blue-200 transition-all duration-300">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <History size={14} />
            </div>
            
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">
                    Última Gestión
                </span>
                <p className="text-xs text-slate-600 font-medium leading-none">
                    <span className="text-slate-900 font-black">
                        {lastLog.user.name}
                    </span>
                    <span className="mx-1 text-slate-300">•</span>
                    <span className="text-slate-500 italic">
                        {format(new Date(lastLog.createdAt), "d 'de' MMM, p", { locale: es })}
                    </span>
                </p>
            </div>
        </div>
    );
}