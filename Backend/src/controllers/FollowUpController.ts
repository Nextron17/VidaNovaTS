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
}