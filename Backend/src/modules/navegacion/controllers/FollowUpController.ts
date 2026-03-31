import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Patient } from '../models/Patient';

import { sequelize } from '../../../core/config/db'; 
import { AuditLog } from '../../../core/models/AuditLog';

export class FollowUpController {

    // Obtener un seguimiento por ID (con datos del paciente)
    static getFollowUpById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Esto asegura que nunca sea tratado como un array 
            const followUpId = String(id);

            const followUp = await FollowUp.findByPk(followUpId, {
                include: [
                    { 
                        model: Patient,
                    }
                ]
            });

            if (!followUp) {
                return res.status(404).json({ error: 'Seguimiento no encontrado' });
            }

            res.json(followUp);
        } catch (error) {
            console.error("Error Get FollowUp:", error);
            res.status(500).json({ error: 'Error al obtener el detalle.' });
        }
    }

    // 2. CREAR NUEVO SEGUIMIENTO 
    static createFollowUp = async (req: Request, res: Response) => {
        try {
            const { patientId, ...data } = req.body;
            
            // Validar que el paciente exista
            const patient = await Patient.findByPk(patientId);
            if (!patient) return res.status(404).json({ success: false, error: 'Paciente no existe' });

            const newFollowUp = await FollowUp.create({
                patientId,
                ...data,
                dateRequest: new Date() // O la fecha que mande el front
            });

            res.status(201).json({ success: true, data: newFollowUp });
        } catch (error) {
            console.error("Error creating followup:", error);
            res.status(500).json({ success: false, error: 'Error al guardar' });
        }
    }

    // 3. EDITAR SEGUIMIENTO 
    static updateFollowUp = async (req: Request, res: Response) => {
        // Iniciamos una transacción de seguridad
        const t = await sequelize.transaction();
        const operatorId = req.user?.id; // El usuario que está haciendo el cambio

        try {
            const { id } = req.params;
            const data = req.body;
            
            const followUp = await FollowUp.findByPk(String(id), {
                include: [{ model: Patient }] // Traemos al paciente para tener su nombre
            });

            if (!followUp) {
                await t.rollback();
                return res.status(404).json({ success: false, error: 'No encontrado' });
            }

            // 1. CAPTURAR EL PASADO
            const oldData = followUp.toJSON();

            // 2. Ejecutar la actualización en la BD
            await followUp.update(data, { transaction: t });

            // 3. DETECTAR LOS CAMBIOS EXACTOS 
            const changesDetected = Object.keys(data).reduce((acc: any, key) => {
                // Si el dato que llegó es diferente al que estaba, lo guardamos
                if (data[key] !== oldData[key] && data[key] !== undefined) {
                    acc[key] = data[key];
                }
                return acc;
            }, {});

            // 4. GUARDAR EN LA AUDITORÍA (Solo si realmente cambió algo)
            if (operatorId && Object.keys(changesDetected).length > 0) {
                // Le pasamos también el nombre y cédula del paciente para que el Frontend lo muestre bonito
                const patientInfo = followUp.patient ? {
                    firstName: followUp.patient.firstName,
                    lastName: followUp.patient.lastName,
                    documentNumber: followUp.patient.documentNumber
                } : {};

                await AuditLog.create({
                    userId: operatorId,
                    action: 'UPDATE',
                    tableName: 'FollowUps',
                    recordId: String(id),
                    oldValues: { ...oldData, ...patientInfo }, // Le inyectamos quién es el paciente
                    newValues: changesDetected // Aquí van solo los campos que tocó el usuario
                }, { transaction: t });
            }

            await t.commit();
            res.json({ success: true, data: followUp });

        } catch (error) {
            await t.rollback();
            console.error("Error updating followup:", error);
            res.status(500).json({ success: false, error: 'Error al actualizar' });
        }
    }
}
