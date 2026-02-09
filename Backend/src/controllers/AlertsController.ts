import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Patient } from '../models/Patient';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

export class AlertsController {

    static getAlerts = async (req: Request, res: Response) => {
        try {
            console.log("🔔 [ALERTS] Buscando problemas en la base de datos...");

            // 1. DETECTAR INCONSISTENCIAS DE FECHAS
            // Regla: Fecha Cita es ANTERIOR a Fecha Solicitud (Imposible lógicamente)
            const inconsistencies = await FollowUp.findAll({
                attributes: ['id', 'dateRequest', 'dateAppointment', 'serviceName'],
                include: [{
                    model: Patient,
                    as: 'patient',
                    attributes: ['firstName', 'lastName', 'documentNumber']
                }],
                where: {
                    // 🔥 CORRECCIÓN AQUÍ: Combinamos las condiciones en un solo objeto
                    dateAppointment: { 
                        [Op.ne]: null,                        // 1. Que no sea nula
                        [Op.lt]: sequelize.col('dateRequest') // 2. Y que sea menor a la fecha de solicitud
                    }
                }
            });

            // 2. DETECTAR CASOS VENCIDOS (> 30 Días)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const overdue = await FollowUp.findAll({
                attributes: ['id', 'dateRequest', 'serviceName', 'status', 'cups', 'eps'], 
                include: [{
                    model: Patient,
                    as: 'patient',
                    attributes: ['firstName', 'lastName', 'insurance'] 
                }],
                where: {
                    status: { [Op.in]: ['PENDIENTE', 'EN_GESTION'] },
                    dateRequest: { [Op.lte]: thirtyDaysAgo }
                },
                order: [['dateRequest', 'ASC']], 
                limit: 50 
            });

            // --- PROCESAR DATOS PARA EL FRONTEND ---
            
            const processedInconsistencies = inconsistencies.map((i: any) => ({
                id: i.id,
                paciente: i.patient ? `${i.patient.firstName} ${i.patient.lastName}` : 'DESCONOCIDO',
                proc: i.serviceName,
                fecha_sol: i.dateRequest,
                fecha_cita: i.dateAppointment
            }));

            const today = new Date();
            const processedOverdue = overdue.map((o: any) => {
                const reqDate = new Date(o.dateRequest);
                const diffTime = Math.abs(today.getTime() - reqDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: o.id,
                    paciente: o.patient ? `${o.patient.firstName} ${o.patient.lastName}` : 'DESCONOCIDO',
                    eps: o.eps || o.patient?.insurance || 'N/A', 
                    proc: o.serviceName || `CUPS ${o.cups}`,
                    dias: diffDays
                };
            });

            res.json({
                success: true,
                inconsistencies: processedInconsistencies,
                overdue: processedOverdue
            });

        } catch (error: any) {
            console.error("❌ Error en Alertas:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
} 