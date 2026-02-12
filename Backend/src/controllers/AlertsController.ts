import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Patient } from '../models/Patient';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

export class AlertsController {

    // 1. OBTENER DETALLE DE ALERTAS (Para la página de alertas)
    static getAlerts = async (req: Request, res: Response) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Ejecutamos ambas búsquedas en paralelo para mayor velocidad
            const [inconsistencies, overdue] = await Promise.all([
                // Inconsistencias: Fecha Cita < Fecha Solicitud
                FollowUp.findAll({
                    attributes: ['id', 'dateRequest', 'dateAppointment', 'serviceName'],
                    include: [{
                        model: Patient,
                        as: 'patient',
                        attributes: ['firstName', 'lastName', 'documentNumber']
                    }],
                    where: {
                        dateAppointment: { 
                            [Op.ne]: null,
                            [Op.lt]: sequelize.col('dateRequest') 
                        }
                    }
                }),
                // Vencidos: PENDIENTE/EN_GESTION y > 30 días
                FollowUp.findAll({
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
                })
            ]);

            // Procesamiento de datos para el Frontend
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
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // 2. OBTENER CONTEO TOTAL (Para la campana del Header)
    static getAlertCount = async (req: Request, res: Response) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Contamos ambos tipos de problemas directamente en la base de datos
            const [countInconsistencies, countOverdue] = await Promise.all([
                FollowUp.count({
                    where: {
                        dateAppointment: { 
                            [Op.ne]: null,
                            [Op.lt]: sequelize.col('dateRequest') 
                        }
                    }
                }),
                FollowUp.count({
                    where: {
                        status: { [Op.in]: ['PENDIENTE', 'EN_GESTION'] },
                        dateRequest: { [Op.lte]: thirtyDaysAgo }
                    }
                })
            ]);

            res.json({ 
                success: true, 
                count: countInconsistencies + countOverdue 
            });

        } catch (error) {
            console.error("Error al contar alertas:", error);
            res.status(500).json({ success: false, count: 0 });
        }
    }
}