import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

export class AuditController {

    // =================================================================
    // 1. OBTENER ESTADÍSTICAS (Lectura)
    // =================================================================
    static getGeneralStats = async (req: Request, res: Response) => {
        const response = {
            stats: { total: 0, pacientes: 0, sin_eps: 0, sin_cups: 0, fechas_malas: 0 },
            duplicates: [] as any[]
        };

        try {
            console.log("📊 [AUDIT] Calculando estadísticas...");

            // A. KPIs Básicos
            const totalRecords = await FollowUp.count();
            const totalPatients = await Patient.count();
            const sinEps = await Patient.count({ where: { [Op.or]: [{ insurance: null }, { insurance: '' }] } });
            const sinCups = await FollowUp.count({ where: { [Op.or]: [{ cups: null }, { cups: '' }] } });
            
            // B. Fechas Incoherentes
            const fechasMalas = await FollowUp.count({
                where: {
                    dateAppointment: { [Op.lt]: sequelize.col('dateRequest') },
                    status: 'REALIZADO'
                }
            });

            response.stats = { total: totalRecords, pacientes: totalPatients, sin_eps: sinEps, sin_cups: sinCups, fechas_malas: fechasMalas };

            // C. Duplicados (SQL Seguro)
            try {
                const tableName = FollowUp.getTableName();
                const query = `
                    SELECT "patientId", "dateRequest", COUNT(*)::int as count
                    FROM ${tableName}
                    WHERE "patientId" IS NOT NULL
                    GROUP BY "patientId", "dateRequest"
                    HAVING COUNT(*) > 1
                    ORDER BY count DESC
                    LIMIT 20
                `;

                const dups: any[] = await sequelize.query(query, { type: (sequelize as any).QueryTypes.SELECT });

                if (dups.length > 0) {
                    const ids = dups.map((d: any) => d.patientId);
                    const patients = await Patient.findAll({
                        where: { id: { [Op.in]: ids } },
                        attributes: ['id', 'firstName', 'lastName', 'documentNumber'],
                        raw: true
                    });

                    response.duplicates = dups.map((d: any) => {
                        const p = patients.find((pat: any) => pat.id === d.patientId);
                        return {
                            id: `${d.patientId}-${new Date(d.dateRequest).getTime()}`,
                            cedula: p ? p.documentNumber : '---',
                            nombre: p ? `${p.firstName} ${p.lastName}`.trim() : 'Desconocido',
                            fecha: d.dateRequest,
                            proc: 'Múltiples Registros',
                            count: d.count
                        };
                    });
                }
            } catch (sqlError) {
                console.warn("⚠️ [AUDIT WARNING] Falló búsqueda de duplicados:", sqlError);
            }

            res.json({ success: true, ...response });

        } catch (error: any) {
            console.error("❌ [AUDIT FATAL] Error general:", error);
            // Respuesta de emergencia para no romper el frontend
            res.json({ success: true, ...response });
        }
    }

    // =================================================================
    // 2. CORREGIR FECHAS (Acción)
    // =================================================================
    static fixIncoherentDates = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const tableName = FollowUp.getTableName();
            const query = `
                UPDATE ${tableName}
                SET "dateRequest" = "dateAppointment", 
                    "dateAppointment" = "dateRequest"
                WHERE "dateAppointment" < "dateRequest" 
                AND "status" = 'REALIZADO'
            `;

            const [results, metadata] = await sequelize.query(query, { transaction: t });
            await t.commit();
            
            // @ts-ignore
            const affected = metadata?.rowCount || 0;
            res.json({ success: true, message: `Se corrigieron ${affected} registros de fechas.` });

        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false, error: "Error interno al corregir fechas." });
        }
    }

    // =================================================================
    // 3. FUSIÓN DE DUPLICADOS (Acción)
    // =================================================================
    static mergeDuplicates = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            console.log("🧬 [MERGE] Iniciando fusión...");
            const tableName = FollowUp.getTableName();

            // 1. Buscar grupos
            const queryGroups = `
                SELECT "patientId", "dateRequest", COUNT(*)::int as count
                FROM ${tableName}
                WHERE "patientId" IS NOT NULL
                GROUP BY "patientId", "dateRequest"
                HAVING COUNT(*) > 1
                LIMIT 1000
            `;
            
            const groups: any[] = await sequelize.query(queryGroups, { 
                type: (sequelize as any).QueryTypes.SELECT,
                transaction: t 
            });

            let processedCount = 0;

            // 2. Procesar cada grupo
            for (const group of groups) {
                const records = await FollowUp.findAll({
                    where: {
                        patientId: group.patientId,
                        dateRequest: group.dateRequest
                    },
                    order: [['updatedAt', 'DESC']], // El primero es el MASTER (más reciente)
                    transaction: t
                });

                if (records.length < 2) continue;

                const master = records[0];
                const slaves = records.slice(1);
                let hasChanges = false;
                const oldObs: string[] = [];

                for (const slave of slaves) {
                    // Copiar datos faltantes al master
                    if (!master.cups && slave.cups) { master.cups = slave.cups; hasChanges = true; }
                    if (!master.serviceName && slave.serviceName) { master.serviceName = slave.serviceName; hasChanges = true; }
                    
                    // Guardar observación vieja
                    if (slave.observation && slave.observation !== master.observation) {
                        oldObs.push(`[${slave.id}]: ${slave.observation}`);
                    }

                    await slave.destroy({ transaction: t });
                }

                if (oldObs.length > 0) {
                    master.observation = `${master.observation || ''} | 📜 HISTORIAL: ${oldObs.join('; ')}`.trim();
                    hasChanges = true;
                }

                if (hasChanges) await master.save({ transaction: t });
                processedCount += slaves.length;
            }

            await t.commit();
            res.json({ success: true, message: `Se fusionaron ${processedCount} registros duplicados.` });

        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ success: false, error: "Error al fusionar duplicados." });
        }
    }
    
    // =================================================================
    // 4. LIMPIEZA DE DUPLICADOS (Acción Destructiva)
    // =================================================================
    static cleanDuplicates = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const tableName = FollowUp.getTableName();
            const query = `
                DELETE FROM ${tableName} a
                USING ${tableName} b
                WHERE a.id < b.id
                AND a."patientId" = b."patientId"
                AND a."dateRequest" = b."dateRequest"
            `;

            const [results, metadata] = await sequelize.query(query, { transaction: t });
            await t.commit();
            
            // @ts-ignore
            const affected = metadata?.rowCount || 0;
            res.json({ success: true, message: `Se eliminaron ${affected} duplicados.` });

        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false, error: "Error al limpiar duplicados." });
        }
    }
}