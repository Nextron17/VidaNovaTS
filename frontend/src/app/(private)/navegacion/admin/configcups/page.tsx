"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Filter, AlertCircle, 
  CheckCircle2, X, RefreshCw, Layers, 
  FlaskConical, Stethoscope, Scissors, Activity, FileQuestion, 
  Loader2, Syringe, Bed, HeartPulse, FileText, ChevronRight, HelpCircle
} from "lucide-react";
import api from "@/src/app/services/api"; 

// --- 1. LAS 10 CATEGORÍAS OFICIALES (VISUALES) ---
const CATEGORIAS_VISUALES = [
  "Consulta Externa", 
  "Quimioterapia", 
  "Radioterapia", 
  "Cirugía", 
  "Imagenología", 
  "Laboratorio", 
  "Clínica del Dolor", 
  "Estancia", 
  "Oncología",
  "Otros" // 🔥 NUEVA
];

// --- 2. MAPEO: DB -> VISUAL ---
const mapCategoryToModality = (dbCategory: string): string => {
    if (!dbCategory) return 'PENDIENTE';
    const c = String(dbCategory).trim();
    const cUpper = c.toUpperCase();

    if (CATEGORIAS_VISUALES.includes(c)) return c;

    if (cUpper.includes('QUIMIO')) return 'Quimioterapia';
    if (cUpper.includes('RADIO')) return 'Radioterapia';
    if (cUpper.includes('IMAGEN')) return 'Imagenología';
    if (cUpper.includes('LAB')) return 'Laboratorio';
    if (cUpper.includes('CIRUGIA') || cUpper.includes('PROCEDIMIENTOS')) return 'Cirugía';
    if (cUpper.includes('CONSULTA') || cUpper.includes('VALORACION')) return 'Consulta Externa';
    if (cUpper.includes('ESTANCIA') || cUpper.includes('HOSPITAL')) return 'Estancia';
    if (cUpper.includes('DOLOR') || cUpper.includes('PALIATIVO')) return 'Clínica del Dolor';
    
    // Mapeo para Otros
    if (cUpper.includes('TRANSPORTE') || cUpper.includes('COPIA') || cUpper.includes('OTROS')) return 'Otros';

    if (cUpper.includes('CAC') || cUpper.includes('TUMOR') || cUpper.includes('LEUCEMIA') || cUpper.includes('LINFOMA') || cUpper.includes('CANCER')) {
        return 'Oncología';
    }

    return 'PENDIENTE';
};

// --- 3. ESTILOS VISUALES ---
const getBadgeStyles = (grupoVisual: string) => {
    const g = String(grupoVisual || "").toUpperCase(); 
    
    if (g === 'QUIMIOTERAPIA') return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', icon: Syringe };
    if (g === 'RADIOTERAPIA') return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: Activity };
    if (g === 'IMAGENOLOGÍA') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Layers };
    if (g === 'LABORATORIO') return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: FlaskConical };
    if (g === 'CIRUGÍA') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Scissors };
    if (g === 'CONSULTA EXTERNA') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Stethoscope };
    if (g === 'ESTANCIA') return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Bed };
    if (g === 'CLÍNICA DEL DOLOR') return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: HeartPulse };
    if (g === 'ONCOLOGÍA') return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: FileText };
    
    // Estilo para OTROS (Gris)
    if (g === 'OTROS') return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', icon: HelpCircle };
    
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertCircle };
};

export default function ConfigCupsPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState(""); 
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { setIsClient(true); fetchCups(); }, []);

  const fetchCups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/navegacion/patients/cups"); 
      if (res.data.success) {
        const mappedData = (res.data.data || []).map((item: any) => ({
            ...item,
            modalidadVisual: mapCategoryToModality(item.grupo) 
        }));
        setData(mappedData);
      }
    } catch (error) {
      console.error("Error cargando CUPS:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/navegacion/patients/cups/sync", {}, { timeout: 120000 }); 
      if (res.data.success) {
        alert(`Sincronización completa.`);
        fetchCups();
      }
    } catch (error) {
      alert("Error sincronizando.");
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newGroup = formData.get('bulk_group') as string;
    
    if (!newGroup || selectedItems.length === 0) return;

    try {
      setLoading(true);
      const res = await api.put("/navegacion/patients/cups/bulk-update", {
        ids: selectedItems,
        grupo: newGroup
      });

      if (res.data.success) {
        const newVisual = mapCategoryToModality(newGroup);
        setData(prev => prev.map(item => 
          selectedItems.includes(item.id) ? { ...item, grupo: newGroup, modalidadVisual: newVisual } : item
        ));
        setSelectedItems([]);
      }
    } catch (error) {
      alert("Error en la actualización.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const codigo = String(item.codigo || "");
      const desc = String(item.descripcion || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = codigo.includes(term) || desc.includes(term);
      const matchesGroup = filterGroup ? item.modalidadVisual === filterGroup : true;
      return matchesSearch && matchesGroup;
    });
  }, [searchTerm, filterGroup, data]);

  const pendientesCount = data.filter(i => i.modalidadVisual === 'PENDIENTE').length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedItems(filteredData.map(i => i.id));
    else setSelectedItems([]);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!isClient) return null;

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800 pb-40">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                    <Layers className="text-blue-600" size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Maestro de Procedimientos</h1>
            </div>
            <p className="text-slate-500 font-medium ml-1">
                Clasificación de CUPS ({data.length} códigos en total).
            </p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className={`flex-1 lg:flex-none px-5 py-3 rounded-2xl border transition-all duration-300 ${pendientesCount > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 shadow-sm' : 'bg-white border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${pendientesCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        <AlertCircle size={20}/>
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Sin Clasificar</span>
                        <span className="block text-xl font-black leading-none mt-0.5 text-amber-900">{pendientesCount}</span>
                    </div>
                </div>
            </div>

            <button 
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
            >
                {syncing ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18}/>}
                <span className="hidden sm:inline">Sincronizar Nuevos</span>
            </button>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-1.5 rounded-[1.5rem] shadow-xl shadow-slate-200/60 border border-white mb-8 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500">
                <Search size={20}/>
            </div>
            <input 
                type="text" 
                placeholder="Buscar por código o descripción..." 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-semibold focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="w-full md:w-72 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500">
                <Filter size={20}/>
            </div>
            <select 
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold appearance-none cursor-pointer outline-none focus:bg-white transition-all text-slate-700"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
            >
                <option value="">Todas las Categorías</option>
                <option value="PENDIENTE">⚠️ Pendientes de Revisión</option>
                {CATEGORIAS_VISUALES.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={14} className="rotate-90"/>
            </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-400 text-xs font-black uppercase tracking-widest">
                        <th className="p-5 w-16 text-center">
                            <input type="checkbox" className="w-5 h-5 rounded-md border-2 border-slate-300 text-blue-600 cursor-pointer" onChange={handleSelectAll} checked={filteredData.length > 0 && selectedItems.length === filteredData.length} />
                        </th>
                        <th className="py-5 px-4 w-40">Código</th>
                        <th className="py-5 px-4">Descripción del Servicio</th>
                        <th className="py-5 px-4 w-64">Categoría Asignada</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={40}/></td></tr>
                    ) : filteredData.map((item) => {
                        const isSelected = selectedItems.includes(item.id);
                        const styles = getBadgeStyles(item.modalidadVisual); 
                        const BadgeIcon = styles.icon;
                        
                        return (
                            <tr key={item.id} onClick={() => handleSelectItem(item.id)} className={`group transition-all duration-200 cursor-pointer ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'} ${(item.modalidadVisual === 'PENDIENTE') && !isSelected ? 'bg-amber-50/20' : ''}`}>
                                <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" className="w-5 h-5 rounded-md border-2 border-slate-300 text-blue-600 cursor-pointer" checked={isSelected} onChange={() => handleSelectItem(item.id)} />
                                </td>
                                <td className="py-5 px-4">
                                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200">{item.codigo}</span>
                                </td>
                                <td className="py-5 px-4">
                                    <p className="text-sm font-semibold text-slate-700 line-clamp-2">{item.descripcion}</p>
                                </td>
                                <td className="py-5 px-4">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${styles.bg} ${styles.text} ${styles.border} shadow-sm`} title={`Valor DB: ${item.grupo || 'Vacío'}`}>
                                        <BadgeIcon size={12} strokeWidth={3} /> {item.modalidadVisual}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    {!loading && filteredData.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-20 text-center">
                                <div className="flex flex-col items-center gap-4 text-slate-400">
                                    <FileQuestion size={48} className="opacity-50"/>
                                    <div>
                                        <p className="text-lg font-bold text-slate-600">No se encontraron procedimientos</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* BARRA FLOTANTE */}
      <div className={`fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-500 ${selectedItems.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}>
        <form onSubmit={handleBulkUpdate} className="bg-slate-900/90 backdrop-blur-md text-white rounded-3xl shadow-2xl py-3 pl-6 pr-3 flex items-center gap-6 pointer-events-auto border border-white/10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-500 text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black">{selectedItems.length}</div>
                <div className="flex flex-col"><span className="text-xs font-bold text-slate-400">Items</span><span className="text-sm font-bold">Seleccionados</span></div>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
                <select name="bulk_group" defaultValue="" className="bg-white/10 text-white text-sm font-bold py-2 pl-4 pr-10 rounded-xl border border-white/10 outline-none cursor-pointer appearance-none" required>
                    <option value="" disabled className="text-slate-900">Categoría...</option>
                    {CATEGORIAS_VISUALES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                </select>
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg"><CheckCircle2 size={18}/> Actualizar</button>
            <button type="button" onClick={() => setSelectedItems([])} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white"><X size={20}/></button>
        </form>
      </div>
    </div>
  );
}