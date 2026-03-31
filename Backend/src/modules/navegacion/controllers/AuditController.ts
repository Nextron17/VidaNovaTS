import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import { Op } from 'sequelize';
import { sequelize } from '../../../core/config/db';
import { AuditLog } from '../../../core/models/AuditLog';
import { User } from '../../usuarios/models/User';

export class AuditController {

    
    // 1. OBTENER RASTRO DE USUARIOS (Monitor Admin)
    static getGlobalLogs = async (req: Request, res: Response) => {
        try {
            const { month, year, all } = req.query;
            let whereCondition = {};

            // Si el usuario pide un mes y año específicos
            if (month && year && all !== 'true') {
                const startDate = new Date(Number(year), Number(month) - 1, 1);
                const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
                
                whereCondition = {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                };
            }

            const logs = await AuditLog.findAll({
                where: whereCondition,
                limit: all === 'true' ? 500 : 100, // Limitamos a 500 si es "todo" por rendimiento
                order: [['createdAt', 'DESC']],
                include: [{ 
                    model: User, 
                    attributes: ['name', 'role'] 
                }]
            });

            return res.json({ success: true, data: logs });
        } catch (error) {
            console.error("Error obteniendo auditoría:", error);
            return res.status(500).json({ success: false, message: "Error al cargar logs." });
        }
    }

    
    // 2. OBTENER ESTADÍSTICAS DE CALIDAD (Lectura)
    
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
            res.json({ success: true, ...response });
        }
    }

    
    // 3. CORREGIR FECHAS 
    
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

    
   // 4. FUSIÓN DE DUPLICADOS 
    
    static mergeDuplicates = async (req: Request, res: Response) => {
        try {
            console.log("🧬 [MERGE] Iniciando fusión...");
            const tableName = FollowUp.getTableName();

            // 1. Buscar grupos (SIN transacción global para no bloquear la tabla entera desde el inicio)
            const queryGroups = `
                SELECT "patientId", "dateRequest", COUNT(*)::int as count
                FROM ${tableName}
                WHERE "patientId" IS NOT NULL
                GROUP BY "patientId", "dateRequest"
                HAVING COUNT(*) > 1
                LIMIT 1000
            `;
            
            const groups: any[] = await sequelize.query(queryGroups, { 
                type: (sequelize as any).QueryTypes.SELECT 
            });

            let processedCount = 0;

            // 2. Procesar cada grupo EN TRANSACCIONES INDEPENDIENTES
            for (const group of groups) {
                
                // 🔥 Iniciar una transacción pequeña SOLO para este grupo
                const t = await sequelize.transaction();
                
                try {
                    const records = await FollowUp.findAll({
                        where: {
                            patientId: group.patientId,
                            dateRequest: group.dateRequest
                        },
                        order: [['updatedAt', 'DESC']], // El primero es el MASTER 
                        transaction: t,
                        lock: t.LOCK.UPDATE // 🔥 Bloquea estas filas temporalmente para que CupsController no interfiera
                    });

                    if (records.length < 2) {
                        await t.rollback();
                        continue;
                    }

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

                        // Destruir el slave dentro de esta mini-transacción
                        await slave.destroy({ transaction: t });
                    }

                    if (oldObs.length > 0) {
                        master.observation = `${master.observation || ''} | 📜 HISTORIAL: ${oldObs.join('; ')}`.trim();
                        hasChanges = true;
                    }

                    // Guardar master
                    if (hasChanges) await master.save({ transaction: t });
                    
                    // 🔥 Cerrar la transacción y liberar los bloqueos inmediatamente
                    await t.commit(); 
                    processedCount += slaves.length;

                } catch (groupError) {
                    // Si un paciente falla (por ej. un deadlock raro), hacemos rollback SOLO de ese paciente
                    // y el bucle continúa con el resto de pacientes sin romper el proceso entero.
                    await t.rollback();
                    console.warn(`⚠️ Error fusionando grupo (Patient: ${group.patientId}):`, groupError);
                }
            }

            res.json({ success: true, message: `Se fusionaron exitosamente ${processedCount} registros duplicados.` });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: "Error general al iniciar la fusión de duplicados." });
        }
    }
    
    
    // 5. LIMPIEZA DE DUPLICADOS
    
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