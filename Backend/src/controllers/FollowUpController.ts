import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Patient } from '../models/Patient';

export class FollowUpController {

    // Obtener un seguimiento por ID (con datos del paciente)
    static getFollowUpById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // 🔥 CORRECCIÓN: Convertir explícitamente a string para calmar a TypeScript
            // Esto asegura que nunca sea tratado como un array (string[])
            const followUpId = String(id);

            const followUp = await FollowUp.findByPk(followUpId, {
                include: [
                    { 
                        model: Patient,
                        // Traemos los datos del paciente para llenar la columna izquierda del detalle
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

    // 2. CREAR NUEVO SEGUIMIENTO (Faltaba este)
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

    // 3. EDITAR SEGUIMIENTO (Faltaba este)
    static updateFollowUp = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const followUp = await FollowUp.findByPk(String(id));

            if (!followUp) return res.status(404).json({ success: false, error: 'No encontrado' });

            await followUp.update(req.body);

            res.json({ success: true, data: followUp });
        } catch (error) {
            console.error("Error updating followup:", error);
            res.status(500).json({ success: false, error: 'Error al actualizar' });
        }
    }
}
