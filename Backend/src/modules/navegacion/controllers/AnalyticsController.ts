import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import { sequelize } from '../../../core/config/db';
import { Op } from 'sequelize';

export class AnalyticsController {

    static getDashboardData = async (req: Request, res: Response) => {
        try {
            // 1. Obtener el año desde la Query (?year=2025), o usar el actual
            const currentYear = new Date().getFullYear();
            const selectedYear = parseInt(req.query.year as string) || currentYear;

            console.log(`📊 [ANALYTICS] Generando reporte para el año: ${selectedYear}`);

            // 2. Definir rango de fechas desde el 1 Ene hasta el 31 de Dic
            const startDate = new Date(selectedYear, 0, 1); // 1 Ene 00:00
            const endDate = new Date(selectedYear, 11, 31, 23, 59, 59); // 31 Dic 23:59

            // 3. CONSULTAS A LA BD 
            const patients = await Patient.findAll({
                attributes: ['gender', 'birthDate']
            });

            // B. Solicitudes/Seguimientos
            const followUps = await FollowUp.findAll({
                attributes: ['dateRequest'],
                where: {
                    dateRequest: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            // 1. GÉNERO
            let genderMap: any = { 'M': 0, 'F': 0, 'O': 0 };
            patients.forEach(p => {
                const g = (p.gender || '').toUpperCase().trim();
                if (['M', 'MASC', 'MASCULINO', 'HOMBRE', '1'].includes(g)) genderMap['M']++;
                else if (['F', 'FEM', 'FEMENINO', 'MUJER', '0'].includes(g)) genderMap['F']++;
                else genderMap['O']++; 
            });
            const genderData = [
                { name: 'Femenino', value: genderMap['F'] },
                { name: 'Masculino', value: genderMap['M'] },
                { name: 'Otros', value: genderMap['O'] },
            ].filter(i => i.value > 0);

            // 2. EDAD
            const ageRanges = { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
            const today = new Date(); // Calculamos edad al día de hoy
            patients.forEach(p => {
                if (p.birthDate) {
                    const birth = new Date(p.birthDate);
                    if (!isNaN(birth.getTime())) {
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                        if (age >= 0) {
                            if (age <= 18) ageRanges['0-18']++;
                            else if (age <= 30) ageRanges['19-30']++;
                            else if (age <= 50) ageRanges['31-50']++;
                            else if (age <= 70) ageRanges['51-70']++;
                            else ageRanges['70+']++;
                        }
                    }
                }
            });
            const ageData = Object.keys(ageRanges).map(key => ({ range: key, count: (ageRanges as any)[key] }));

            // 3. Meses
            const monthsBase = [
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            ];
            
            // Inicializar mapa de meses en 0
            const monthsMap: any = {};
            monthsBase.forEach(m => monthsMap[m] = 0);

            followUps.forEach(f => {
                if (f.dateRequest) {
                    const d = new Date(f.dateRequest);
                    // Asegurar que cae en el mes correcto (0 = Ene)
                    const monthIndex = d.getMonth(); 
                    const monthName = monthsBase[monthIndex];
                    if (monthsMap[monthName] !== undefined) {
                        monthsMap[monthName]++;
                    }
                }
            });

            const trendData = monthsBase.map(m => ({
                month: m,
                solicitudes: monthsMap[m]
            }));

            // RESPUESTA
            res.json({
                success: true,
                year: selectedYear,
                totalRequestsInYear: followUps.length, // Total solicitudes este año
                totalPatients: patients.length, // Total histórico base
                genderData,
                ageData,
                trendData
            });

        } catch (error: any) {
            console.error("❌ Error en Analytics:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}