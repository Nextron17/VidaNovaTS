import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import ExcelJS from 'exceljs';
import { getFechaLocal, getFechaYHoraLocal } from '../../../core/utils/dateUtils'; // 👈 Importación agregada

export class BackupController {

    static downloadFullDatabase = async (req: Request, res: Response) => {
        try {
            console.log("💾 [BACKUP] Generando reporte maestro detallado (Formato Sábana)...");

            // 1. Crear el libro de Excel
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Vidanova System';
            workbook.created = new Date();

            
            // HOJA 1: DIRECTORIO (Datos Demográficos)
            
            const sheetPatients = workbook.addWorksheet('Directorio Pacientes');
            
            sheetPatients.columns = [
                { header: 'ID Sistema', key: 'id', width: 10 },
                { header: 'Tipo Doc', key: 'documentType', width: 10 },
                { header: 'Documento', key: 'documentNumber', width: 15 },
                { header: 'Nombres', key: 'firstName', width: 25 },
                { header: 'Apellidos', key: 'lastName', width: 25 },
                { header: 'Fecha Nacimiento', key: 'birthDate', width: 15 },
                { header: 'Edad', key: 'age', width: 8 },
                { header: 'Género', key: 'gender', width: 12 },
                { header: 'Estado Vital', key: 'status', width: 12 },
                { header: 'Aseguradora (Afiliación)', key: 'insurance', width: 30 }, 
                { header: 'Teléfono', key: 'phone', width: 20 },
                { header: 'Ciudad', key: 'city', width: 20 },
                { header: 'Dirección', key: 'address', width: 30 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Última Act.', key: 'updatedAt', width: 18 },
            ];

            // Estilo Cabecera Hoja 1 (Azul Corporativo)
            sheetPatients.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            sheetPatients.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            sheetPatients.autoFilter = { from: 'A1', to: 'O1' };

            const patients = await Patient.findAll({ raw: true });
            
            // Calculamos el offset de Colombia una sola vez para rendimiento
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;

            patients.forEach((p: any) => {
                let age = '';
                if (p.birthDate) {
                    const diff = Date.now() - new Date(p.birthDate).getTime();
                    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
                }

                // Función auxiliar para forzar la fecha a UTC-5 (Colombia) en el Excel
                const formatDateToColombia = (dateStr: string) => {
                    if (!dateStr) return '';
                    return new Date(new Date(dateStr).getTime() - tzoffset).toISOString().split('T')[0];
                };

                sheetPatients.addRow({
                    ...p,
                    age,
                    birthDate: formatDateToColombia(p.birthDate),
                    updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('es-CO') : ''
                });
            });

            
            // HOJA 2: INFORME DE GESTIÓN (Detallado / Sábana)
            
            const sheetHistory = workbook.addWorksheet('Informe de Gestión');

            sheetHistory.columns = [
                // INFO GESTIÓN
                { header: 'ID GESTIÓN', key: 'id', width: 10 },
                { header: 'ESTADO', key: 'status', width: 15 },
                { header: 'FECHA SOLICITUD', key: 'dateRequest', width: 15 },
                { header: 'FECHA CITA', key: 'dateAppointment', width: 15 },
                
                // PACIENTE
                { header: 'DOCUMENTO', key: 'docPatient', width: 15 },
                { header: 'PACIENTE', key: 'namePatient', width: 35 },
                { header: 'TELEFONO', key: 'phonePatient', width: 15 },
                
                // SERVICIO
                { header: 'EPS / PROVEE', key: 'eps', width: 25 },
                { header: 'SERVICIO SOLICITADO', key: 'serviceName', width: 40 },
                { header: 'CUPS', key: 'cups', width: 12 },
                { header: 'MODALIDAD', key: 'category', width: 15 },

                // CAMPOS EXTRAÍDOS DE LA NOTA (Parsing Inteligente)
                { header: 'PROFESIONAL', key: 'prof', width: 20 },
                { header: 'ESPECIALIDAD', key: 'esp', width: 20 },
                { header: 'LUGAR ATENCIÓN', key: 'lugar', width: 25 },
                { header: 'DIAGNÓSTICO (DX)', key: 'dx', width: 30 },
                { header: 'TIPO CASO', key: 'tipoCaso', width: 15 },
                { header: 'RESPONSABLE', key: 'responsable', width: 20 },
                { header: 'BARRERA DETECTADA', key: 'barrera', width: 25 }, // 👈 Añadí la barrera aquí por si acaso
                
                // OBSERVACIONES
                { header: 'OBSERVACIÓN LIMPIA', key: 'obsClean', width: 50 },
                { header: 'OBSERVACIÓN TÉCNICA', key: 'obsFull', width: 30 },
            ];

            // Estilo Cabecera Hoja 2 (Verde Reporte)
            sheetHistory.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            sheetHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            sheetHistory.autoFilter = { from: 'A1', to: 'S1' };

            const history = await FollowUp.findAll({
                include: [{
                    model: Patient,
                    as: 'patient',
                    attributes: ['documentNumber', 'firstName', 'lastName', 'phone']
                }],
                order: [['dateRequest', 'DESC']]
            });

            // Reutilizamos el offset
            const tzoffsetHistory = (new Date()).getTimezoneOffset() * 60000;
            const formatDateToColombia = (dateStr: string) => {
                if (!dateStr) return '';
                return new Date(new Date(dateStr).getTime() - tzoffsetHistory).toISOString().split('T')[0];
            };

            history.forEach((h: any) => {
                const pat = h.patient;
                const fullObs = h.observation || '';

                // --- HELPER PARA EXTRAER DATOS OCULTOS ---
                const extract = (tag: string) => {
                    const regex = new RegExp(`\\|\\s*${tag}:\\s*([^|]+)`, 'i');
                    const match = fullObs.match(regex);
                    return match ? match[1].trim() : '';
                };

                // Limpia la observación para lectura humana
                const cleanObs = fullObs.split('|')[0].trim();

                const row = sheetHistory.addRow({
                    id: h.id,
                    status: h.status ? h.status.replace('_', ' ') : 'PENDIENTE',
                    dateRequest: formatDateToColombia(h.dateRequest), // 👈 Fechas corregidas
                    dateAppointment: formatDateToColombia(h.dateAppointment), // 👈 Fechas corregidas
                    
                    docPatient: pat ? pat.documentNumber : '',
                    namePatient: pat ? `${pat.firstName} ${pat.lastName}`.trim() : '---',
                    phonePatient: pat ? pat.phone : '',
                    
                    eps: h.eps || '---',
                    serviceName: h.serviceName,
                    cups: h.cups,
                    category: h.category,
                    
                    // Columnas calculadas
                    prof: extract('PROF'),
                    esp: extract('ESP'),
                    lugar: extract('LUGAR'),
                    dx: extract('DX') || extract('DX SUGERIDO'), 
                    tipoCaso: extract('TIPO'),
                    responsable: extract('RESP') || extract('GESTOR'),
                    barrera: extract('BARRERA'), 
                    
                    obsClean: cleanObs,
                    obsFull: fullObs
                });

                // --- COLORES AUTOMÁTICOS SEGÚN ESTADO ---
                const statusCell = row.getCell('status');
                const s = (h.status || '').toUpperCase();

                if (s.includes('REALIZADO') || s.includes('FINALIZA')) {
                    statusCell.font = { color: { argb: 'FF166534' }, bold: true }; // Verde
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                } else if (s.includes('CANCEL') || s.includes('NO ASISTE')) {
                    statusCell.font = { color: { argb: 'FF991B1B' }, bold: true }; // Rojo
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                } else if (s.includes('AGENDADO')) {
                    statusCell.font = { color: { argb: 'FF1E40AF' }, bold: true }; // Azul
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
                }
            });

            // 4. Descargar con nombre de archivo sincronizado a Colombia
            const timestamp = getFechaYHoraLocal().replace(/[: ]/g, '-'); // Usamos nuestra nueva función 👈
            const fileName = `Vidanova_Reporte_Maestro_${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error: any) {
            console.error("❌ Error generando backup:", error);
            res.status(500).json({ success: false, error: "Error interno al generar Excel." });
        }
    }
}