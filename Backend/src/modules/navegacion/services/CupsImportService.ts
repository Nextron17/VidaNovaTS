import * as XLSX from 'xlsx';
import { MasterCUP } from '../models/MasterCUP'; // Asegúrate de tener este modelo en Sequelize
import { sequelize } from '../../../core/config/db';

export class CupsImportService {
    
    static normalizeHeader(text: string): string {
        if (!text) return '';
        return String(text).trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '_');
    }

    static async processCupsExcel(buffer: Buffer) {
        try {
            console.log("🛠️ INICIANDO IMPORTACIÓN DE MAESTRO DE CUPS/SERVICIOS...");
            
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let recordsProcessed = 0;
            let recordsUpdated = 0;
            let cupsToUpsert: any[] = [];

            for (const sheetName of workbook.SheetNames) {
                // Solo leemos hojas que parezcan catálogos
                if (['FICHA TECNICA', 'RESUMEN'].some(k => sheetName.toUpperCase().includes(k))) continue;

                const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
                if (rawData.length === 0) continue;

                const firstRow: any = rawData[0];
                const keys = Object.keys(firstRow).map(k => this.normalizeHeader(k));
                
                // Validar que tenga al menos una columna de código y una de descripción
                const hasCode = keys.some(k => k.includes('codigo') || k === 'cups');
                const hasDesc = keys.some(k => k.includes('descrip'));

                if (!hasCode || !hasDesc) {
                    console.log(`⚠️ Hoja "${sheetName}" omitida: No tiene columnas de código y descripción.`);
                    continue;
                }

                for (const row of rawData as any[]) {
                    // Mapeo flexible para encontrar las columnas en tus archivos
                    const normalizedRow = Object.keys(row).reduce((acc, k) => { 
                        acc[this.normalizeHeader(k)] = String(row[k]).trim(); return acc; 
                    }, {} as any);

                    // Buscar el código (ej: "Codigo propio Asmet Salud", "codigo")
                    const codKey = Object.keys(normalizedRow).find(k => k.includes('codigo') || k === 'cups');
                    // Buscar la descripción (ej: "Descripcion Tecnologia Asmet Salud", "descripcion")
                    const descKey = Object.keys(normalizedRow).find(k => k.includes('descrip') || k.includes('tecnolo'));

                    if (codKey && descKey) {
                        const codigo = normalizedRow[codKey].toUpperCase();
                        const descripcion = normalizedRow[descKey];

                        if (codigo && descripcion) {
                            cupsToUpsert.push({
                                codigo: codigo.substring(0, 20),
                                descripcion: descripcion.substring(0, 255),
                                grupo: 'PENDIENTE' // Entran como pendientes para que luego la IA los clasifique
                            });
                        }
                    }
                }
            }

            if (cupsToUpsert.length === 0) {
                throw new Error("No se encontraron registros válidos de CUPS en el archivo.");
            }

            // 🚀 Inserción Masiva (Upsert: Crea si no existe, actualiza si existe)
            await MasterCUP.bulkCreate(cupsToUpsert, {
                updateOnDuplicate: ['descripcion'], // Actualiza el nombre si ya existía
                logging: false
            });

            console.log(`✅ MAESTRO ACTUALIZADO: ${cupsToUpsert.length} códigos procesados.`);
            return { success: true, totalProcessed: cupsToUpsert.length };

        } catch (error: any) {
            console.error("❌ ERROR IMPORTANDO CUPS:", error);
            throw new Error(String(error.message));
        }
    }
}