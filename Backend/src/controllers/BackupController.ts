import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import ExcelJS from 'exceljs';

export class BackupController {

    static downloadFullDatabase = async (req: Request, res: Response) => {
        try {
            console.log("💾 [BACKUP] Generando reporte maestro completo (Formato Extenso)...");

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Vidanova System';
            workbook.created = new Date();

            
            // HOJA 1: DIRECTORIO DE PACIENTES
            
            const sheetPatients = workbook.addWorksheet('Directorio Pacientes');
            
            sheetPatients.columns = [
                { header: 'ID Sistema', key: 'id', width: 8 },
                { header: 'Tipo Doc', key: 'documentType', width: 10 },
                { header: 'Documento', key: 'documentNumber', width: 15 },
                { header: 'Nombres', key: 'firstName', width: 25 },
                { header: 'Apellidos', key: 'lastName', width: 25 },
                { header: 'Fecha Nacimiento', key: 'birthDate', width: 15 },
                { header: 'Edad', key: 'age', width: 8 },
                { header: 'Género', key: 'gender', width: 12 },
                { header: 'Estado Vital', key: 'status', width: 12 },
                { header: 'Aseguradora (Afiliación)', key: 'insurance', width: 30 }, 
                { header: 'Teléfono', key: 'phone', width: 25 },
                { header: 'Ciudad', key: 'city', width: 20 },
                { header: 'Departamento', key: 'department', width: 20 },
                { header: 'Última Act.', key: 'updatedAt', width: 18 },
            ];

            // Estilo Cabecera (Azul Oscuro)
            sheetPatients.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            sheetPatients.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            sheetPatients.autoFilter = { from: 'A1', to: 'N1' };

            const patients = await Patient.findAll({ raw: true });
            
            patients.forEach((p: any) => {
                let age = '';
                if (p.birthDate) {
                    const diff = Date.now() - new Date(p.birthDate).getTime();
                    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
                }

                sheetPatients.addRow({
                    ...p,
                    age,
                    birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : '',
                    updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('es-CO') : ''
                });
            });

            
            // HOJA 2: REPORTE DETALLADO (TIPO "SÁBANA DE DATOS")
            
            const sheetHistory = workbook.addWorksheet('Informe de Gestión');

            sheetHistory.columns = [
                // DATOS BÁSICOS
                { header: 'ID', key: 'id', width: 8 },
                { header: 'ESTADO', key: 'status', width: 18 }, 
                { header: 'FECHA SOLICITUD', key: 'dateRequest', width: 15 },
                { header: 'FECHA CITA', key: 'dateAppointment', width: 15 },
                
                // PACIENTE
                { header: 'DOCUMENTO', key: 'docPatient', width: 15 },
                { header: 'PACIENTE', key: 'namePatient', width: 30 },
                
                // SERVICIO
                { header: 'PROVEE / EPS', key: 'eps', width: 25 }, 
                { header: 'SERVICIO SOLICITADO', key: 'serviceName', width: 45 },
                { header: 'CUPS', key: 'cups', width: 10 },
                { header: 'CATEGORÍA', key: 'category', width: 15 },

                // --- COLUMNAS RECUPERADAS (LAS QUE FALTABAN) ---
                { header: 'PROFESIONAL', key: 'prof', width: 25 },
                { header: 'ESPECIALIDAD', key: 'esp', width: 20 },
                { header: 'LUGAR ATENCIÓN', key: 'lugar', width: 25 },
                { header: 'DIAGNÓSTICO', key: 'dx', width: 30 },
                { header: 'FECHA NOTA', key: 'fnota', width: 15 },
                
                // GESTIÓN
                { header: 'BARRERA', key: 'barrera', width: 20 },
                { header: 'RESPONSABLE', key: 'responsable', width: 20 },
                { header: 'TIPO CASO', key: 'tipoCaso', width: 15 },
                
                // NOTA FINAL
                { header: 'OBSERVACIONES', key: 'obs', width: 60 },
            ];

            // Estilo Cabecera (Verde Corporativo)
            sheetHistory.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            sheetHistory.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            sheetHistory.autoFilter = { from: 'A1', to: 'S1' }; // Filtros hasta la columna S

            const history = await FollowUp.findAll({
                include: [{
                    model: Patient,
                    as: 'patient',
                    attributes: ['documentNumber', 'firstName', 'lastName']
                }],
                order: [['dateRequest', 'DESC']]
            });

            history.forEach((h: any) => {
                const pat = h.patient;
                const fullObs = h.observation || '';

                // --- HELPER: Extraer datos guardados en el string "TAG: Valor |" ---
                const extract = (tag: string) => {
                    if (fullObs.includes(`| ${tag}:`)) {
                        const parts = fullObs.split(`| ${tag}:`);
                        // Tomamos la parte derecha y cortamos en el siguiente pipe "|"
                        if (parts[1]) return parts[1].split('|')[0].trim();
                    }
                    return '';
                };

                // Limpiamos la observación original (quitamos los tags técnicos)
                const cleanObs = fullObs.split('|')[0].trim();

                const row = sheetHistory.addRow({
                    id: h.id,
                    status: h.status,
                    dateRequest: h.dateRequest ? new Date(h.dateRequest).toISOString().split('T')[0] : '',
                    dateAppointment: h.dateAppointment ? new Date(h.dateAppointment).toISOString().split('T')[0] : '',
                    docPatient: pat ? pat.documentNumber : '',
                    namePatient: pat ? `${pat.firstName} ${pat.lastName}` : '---',
                    eps: h.eps || '---',
                    serviceName: h.serviceName,
                    cups: h.cups,
                    category: h.category,
                    
                    // 🔥 Aquí rellenamos las columnas nuevas extrayendo la data
                    prof: extract('PROF'),
                    esp: extract('ESP'),
                    lugar: extract('LUGAR'),
                    dx: extract('DX'),
                    fnota: extract('F.NOTA'),
                    barrera: extract('BARRERA'),
                    responsable: extract('RESP'),
                    tipoCaso: extract('TIPO'),
                    
                    obs: cleanObs // Nota limpia para lectura humana
                });

                // --- COLOREADO SEMÁFORO INTELIGENTE ---
                const statusCell = row.getCell('status');
                const s = h.status ? h.status.toUpperCase() : '';

                if (s.includes('REALIZADO') || s.includes('FINALIZA')) {
                    statusCell.font = { color: { argb: 'FF166534' }, bold: true }; // Verde
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                } else if (s.includes('CANCEL') || s.includes('NO ASISTE')) {
                    statusCell.font = { color: { argb: 'FF991B1B' }, bold: true }; // Rojo
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                } else if (s.includes('AGENDADO') || s.includes('PROGRAMA')) {
                    statusCell.font = { color: { argb: 'FF1E40AF' }, bold: true }; // Azul
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
                } else {
                    statusCell.font = { color: { argb: 'FF92400E' }, bold: true }; // Naranja
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
                }
            });

            // 3. Descarga
            const fileName = `Vidanova_Reporte_Total_${new Date().toISOString().split('T')[0]}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error: any) {
            console.error("❌ Error generando backup:", error);
            res.status(500).json({ success: false, error: "Error al generar el archivo." });
        }
    }
}