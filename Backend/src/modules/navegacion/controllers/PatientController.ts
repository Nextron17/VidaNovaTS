import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp'; 
import { ImportService } from '../services/ImportService';
import { Op } from 'sequelize';
import { sequelize } from '../../../core/config/db'; 
import { CupsController } from './CupsController';
import { User } from '../../usuarios/models/User'; 

import { AuditLog } from '../../../core/models/AuditLog'; 

export class PatientController {

    // 1. IMPORTACIÓN MASIVA (EN SEGUNDO PLANO)
    static importPatients = async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Falta archivo para procesar o el formato no es válido.' 
                });
            }
            
            // 1. CLONAMOS LA MEMORIA: Guardamos el archivo y los datos del usuario 
            // antes de cerrar la conexión HTTP.
            const fileBuffer = Buffer.from(req.file.buffer);
            const operatorId = req.user?.id;

            // 2. RESPUESTA INMEDIATA (202 Accepted): Le decimos al Frontend que todo está bien 
            // ANTES de procesar las miles de filas.
            res.status(202).json({ 
                success: true,
                message: 'Archivo recibido correctamente. El sistema está procesando los datos en segundo plano.', 
            });

            // 3. PROCESAMIENTO ASÍNCRONO ("Fire and Forget")
            // Esto se ejecuta en la sombra sin bloquear a nadie.
            setTimeout(async () => {
                try {
                    console.log("⚙️ [BACKGROUND TASK] Iniciando procesamiento de Excel...");
                    const result = await ImportService.processPatientExcel(fileBuffer);
                    
                    // 🕵️‍♂️ AUDITORÍA: Registro de importación masiva al terminar
                    if (operatorId) {
                        await AuditLog.create({
                            userId: operatorId,
                            action: 'IMPORT',
                            tableName: 'Patients/FollowUps',
                            recordId: 'MASIVO',
                            oldValues: null,
                            newValues: { sheetsProcessed: result.createdPatients, updates: result.updatedPatients }
                        });
                    }
                    console.log("✅ [BACKGROUND TASK] Importación finalizada con éxito.");
                } catch (bgError) {
                    console.error("❌ [BACKGROUND TASK] Error procesando Excel:", bgError);
                    // Aquí podrías agregar lógica para enviar un email al admin avisando del error
                }
            }, 0);

        } catch (error: any) {
            console.error("❌ Error recibiendo archivo:", error);
            res.status(500).json({ success: false, error: 'Error interno al recibir el archivo.' });
        }
    }

// 2. LISTAR PACIENTES (ARREGLADO PARA PENDIENTES AUTOMÁTICOS)
    static getPatients = async (req: Request, res: Response) => {
        try {
            const { 
                page = 1, limit = 10, search = '', eps = '', status = '', 
                cohorte = '', startDate, endDate, onlyStats = 'false' 
            } = req.query;

            // 🚀 MEJORA 1: ESTADÍSTICAS GLOBALES INTELIGENTES
            if (onlyStats === 'true') {
                const total = await Patient.count();
                const realizados = await FollowUp.count({ where: { status: 'REALIZADO' } });
                const agendados = await FollowUp.count({ where: { status: 'AGENDADO' } });
                const enGestion = await FollowUp.count({ where: { status: 'EN_GESTION' } });
                const cancelados = await FollowUp.count({ where: { status: 'CANCELADO' } });

                // 💡 PENDIENTES = Total de pacientes - (Los que ya tienen un estado diferente)
                const pendientes = total - (realizados + agendados + enGestion + cancelados);

                const topProcedures = await FollowUp.findAll({
                    attributes: [
                        ['category', 'name'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
                    ],
                    where: { category: { [Op.ne]: null } },
                    group: ['category'],
                    order: [[sequelize.literal('cantidad'), 'DESC']],
                    limit: 7,
                    raw: true // Crucial para agregaciones
                });

                // 1. Traemos solo las observaciones que contienen la palabra BARRERA
                const followUpsConBarrera = await FollowUp.findAll({
                    attributes: ['observation'],
                    where: { observation: { [Op.like]: '%BARRERA:%' } },
                    raw: true
                });

                // 2. Extraemos y contamos (omitiendo "Ninguna")
                const conteoBarreras: Record<string, number> = {};
                followUpsConBarrera.forEach((f: any) => {
                    const match = f.observation?.match(/BARRERA:\s*([^|]+)/i);
                    if (match) {
                        const barrera = match[1].trim();
                        // Ignoramos si la barrera es "Ninguna" o "NO"
                        if (barrera && !['NINGUNA / SIN BARRERA', 'NO', 'NINGUNA'].includes(barrera.toUpperCase())) {
                            conteoBarreras[barrera] = (conteoBarreras[barrera] || 0) + 1;
                        }
                    }
                });

                // 3. Convertimos a formato Recharts, ordenamos y sacamos el Top 5
                const topBarreras = Object.entries(conteoBarreras)
                    .map(([name, cantidad]) => ({ name, cantidad }))
                    .sort((a, b) => b.cantidad - a.cantidad)
                    .slice(0, 5);

                return res.json({
                    success: true,
                    stats: { total, pendientes, realizados, agendados, topProcedures, topBarreras } // 👈 topBarreras añadido aquí
                });
            }

            // --- LÓGICA DE FILTRADO PARA LA TABLA ---
            const offset = (Number(page) - 1) * Number(limit);
            
            const patientWhere: any = {};
            const andConditions: any[] = []; 

            if (eps && eps !== 'TODAS') {
                andConditions.push({ insurance: { [Op.like]: `%${eps}%` } });
            }

            if (search) {
                // Convertimos la búsqueda a mayúsculas por si acaso (para evitar fallos por minúsculas)
                const cleanSearch = String(search).toUpperCase();
                andConditions.push({
                    [Op.or]: [
                        { documentNumber: { [Op.like]: `%${cleanSearch}%` } },
                        { firstName: { [Op.like]: `%${cleanSearch}%` } },
                        { lastName: { [Op.like]: `%${cleanSearch}%` } },
                        // 👇 AÑADIMOS LOS CAMPOS DEL SEGUIMIENTO (CUPS, Servicio, Categoría y Notas)
                        { '$followups.cups$': { [Op.like]: `%${cleanSearch}%` } },
                        { '$followups.category$': { [Op.like]: `%${cleanSearch}%` } },
                        { '$followups.serviceName$': { [Op.like]: `%${cleanSearch}%` } },
                        { '$followups.observation$': { [Op.like]: `%${cleanSearch}%` } }
                    ]
                });
            }

            const followUpWhere: any = {};
            let hasFollowUpFilters = false; 

            // 🚀 MEJORA 2: INCLUIR PACIENTES NUEVOS COMO PENDIENTES
            if (status === 'PENDIENTE') {
                andConditions.push({
                    [Op.or]: [
                        { '$followups.status$': 'PENDIENTE' },
                        { '$followups.id$': null } // Si no tiene FollowUp, es pendiente automáticamente
                    ]
                });
            } else if (status && status !== 'TODOS') {
                followUpWhere.status = status;
                hasFollowUpFilters = true;
            }

            if (andConditions.length > 0) {
                patientWhere[Op.and] = andConditions;
            }

            if (startDate && endDate) {
                followUpWhere.dateRequest = {
                    [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
                };
                hasFollowUpFilters = true;
            }

            if (cohorte) {
                const filtrosList = (cohorte as string).split(',').map(f => f.trim()).filter(f => f);
                if (filtrosList.length > 0) {
                    followUpWhere[Op.or] = filtrosList.map(filtro => ({
                        [Op.or]: [
                            { category: { [Op.like]: `%${filtro}%` } },
                            { observation: { [Op.like]: `%${filtro}%` } }
                        ]
                    }));
                    hasFollowUpFilters = true;
                }
            }

            // ⚠️ subQuery: false es OBLIGATORIO para que el filtro de PENDIENTES funcione sin errores SQL
            const { count, rows } = await Patient.findAndCountAll({
                where: patientWhere,
                include: [{
                    model: FollowUp,
                    as: 'followups',
                    required: hasFollowUpFilters, 
                    where: hasFollowUpFilters ? followUpWhere : undefined,
                }],
                distinct: true,
                limit: Number(limit),
                offset: offset,
                order: [['updatedAt', 'DESC']],
                subQuery: false 
            });

            // Reordenar seguimientos en memoria
            rows.forEach((p: any) => {
                if (p.followups && p.followups.length > 0) {
                    p.followups.sort((a: any, b: any) => 
                        new Date(b.dateRequest).getTime() - new Date(a.dateRequest).getTime()
                    );
                }
            });

            res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    totalPages: Math.ceil(count / Number(limit)),
                    currentPage: Number(page)
                }
            });

        } catch (error: any) {
            console.error("❌ Error GET Patients:", error); 
            res.status(500).json({ success: false, error: 'Error al consultar base de datos.' });
        }
    }

    // 3. GESTIÓN MASIVA 
    static bulkUpdate = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const { ids, status, observation } = req.body;
            const operatorId = req.user?.id;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                await t.rollback();
                return res.status(400).json({ success: false, message: "No se seleccionaron pacientes." });
            }

            const newFollowUps = ids.map(patientId => ({
                patientId,
                status: status || 'EN_GESTION',
                observation: observation ? `[MASIVO]: ${observation}` : '[MASIVO] Actualización.',
                dateRequest: new Date(),
                category: 'GESTION_ADMINISTRATIVA'
            }));

            await FollowUp.bulkCreate(newFollowUps, { transaction: t });

            // 🕵️‍♂️ AUDITORÍA: Actualización Masiva
            if (operatorId) {
                await AuditLog.create({
                    userId: operatorId,
                    action: 'BULK_UPDATE',
                    tableName: 'FollowUps',
                    recordId: `[${ids.join(',')}]`,
                    oldValues: null,
                    newValues: { status, observation }
                }, { transaction: t });
            }

            await t.commit();
            res.json({ success: true, message: "Registros actualizados." });

        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false, message: "Error interno." });
        }
    }

    // 4. MAESTRO DE CUPS
    static getCups = async (req: Request, res: Response) => {
        try {
            const cups = await FollowUp.findAll({
                attributes: [
                    'cups', 
                    [sequelize.fn('MAX', sequelize.col('serviceName')), 'descripcion'],
                    [sequelize.fn('MAX', sequelize.col('category')), 'grupo'],
                    [sequelize.fn('MAX', sequelize.col('id')), 'id']
                ],
                where: {
                    cups: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }, { [Op.ne]: '0' }] }
                },
                group: ['cups'], 
                order: [[sequelize.col('cups'), 'ASC']]
            });

            res.json({
                success: true,
                data: cups.map((c: any) => ({
                    id: c.getDataValue('id'),
                    codigo: c.getDataValue('cups'),
                    descripcion: c.getDataValue('descripcion'),
                    grupo: c.getDataValue('grupo') || 'PENDIENTE'
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error al obtener CUPS.' });
        }
    }

    static bulkUpdateCups = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        const operatorId = req.user?.id;

        try {
            const { ids, grupo } = req.body;
            if (!ids || !Array.isArray(ids) || !grupo) {
                await t.rollback();
                return res.status(400).json({ success: false, message: "Datos incompletos." });
            }

            const targets = await FollowUp.findAll({
                where: { id: { [Op.in]: ids } },
                attributes: ['cups'],
                transaction: t
            });

            const cupsCodes = targets.map((t: any) => t.cups).filter((c: any) => c);

            if (cupsCodes.length > 0) {
                await FollowUp.update(
                    { category: grupo },
                    { where: { cups: { [Op.in]: cupsCodes } }, transaction: t }
                );

                // 🕵️‍♂️ AUDITORÍA: Cambios en el maestro de CUPS
                if (operatorId) {
                    await AuditLog.create({
                        userId: operatorId, action: 'UPDATE_CUPS', tableName: 'FollowUps',
                        recordId: `[${cupsCodes.join(',')}]`, oldValues: null, newValues: { category: grupo }
                    }, { transaction: t });
                }
            }

            await t.commit();
            res.json({ success: true, message: "Categorías actualizadas correctamente." });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false });
        }
    }

    static syncCups = async (req: Request, res: Response) => {
        await CupsController.runAutoCategorization();
        res.json({ success: true, newFound: 0, message: "Sincronizado." });
    }

    // 5. DETALLES Y CRUD
    static getPatientById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        
        // 1. Buscamos el paciente con sus seguimientos
        const patient = await Patient.findByPk(id, {
            include: [{ model: FollowUp, as: 'followups' }],
            order: [[{ model: FollowUp, as: 'followups' }, 'dateRequest', 'DESC']]
        });

        if (!patient) return res.status(404).json({ success: false, error: 'No encontrado' });

        // 2. 🕵️ Buscamos los logs manualmente forzando el ID a String
        const history = await AuditLog.findAll({
            where: {
                tableName: 'Patients',
                recordId: id // Aquí 'id' ya es un String, así que Postgres no fallará
            },
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['name'] }]
        });

        // 3. Enviamos todo junto
        res.json({ 
            success: true, 
            data: {
                ...patient.toJSON(),
                auditLogs: history // El frontend recibirá los logs aquí
            } 
        }); 

    } catch (error) {
        console.error("❌ Error en detalle de paciente:", error);
        res.status(500).json({ success: false });
    }
}

    static createPatient = async (req: Request, res: Response) => {
        try {
            const operatorId = req.user?.id;
            const exists = await Patient.findOne({ where: { documentNumber: req.body.documentNumber } });
            if (exists) return res.status(400).json({ success: false, error: 'Ya existe.' });
            
            // En lugar de Patient.create(req.body), haz esto:
                const { 
                    documentType, documentNumber, firstName, lastName, 
                    phone, email, insurance, city, department, gender, birthDate, status 
                } = req.body;

                const newPatient = await Patient.create({
                    documentType, documentNumber, firstName, lastName, 
                    phone, email, insurance, city, department, gender, birthDate, status
                });

            // 🕵️‍♂️ AUDITORÍA: Creación Manual
            if (operatorId) {
                await AuditLog.create({
                    userId: operatorId, action: 'CREATE', tableName: 'Patients',
                    recordId: String(newPatient.id), oldValues: null, newValues: newPatient.toJSON()
                });
            }

            res.status(201).json({ success: true, data: newPatient });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    // 6. ACTUALIZAR PACIENTE CON TRAZABILIDAD DINÁMICA
    static updatePatient = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        const operatorId = req.user?.id; // Extraído del middleware de autenticación

        try {
            const id = String(req.params.id); 
            const data = req.body;

            // 1. Buscar paciente actual
            const patient = await Patient.findByPk(id);
            
            if (!patient) {
                await t.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: "Paciente no encontrado en la base de datos." 
                });
            }

            // 2. 🕵️‍♂️ Capturar estado anterior
            const oldData = patient.toJSON();

            // 3. Ejecutar actualización
            await patient.update(data, { transaction: t });

            // 4. 🕵️‍♂️ DETERMINAR CAMBIOS REALES (Opcional pero recomendado)
            // Filtramos 'data' para guardar solo lo que el usuario intentó cambiar
            const changesDetected = Object.keys(data).reduce((acc: any, key) => {
                if (data[key] !== oldData[key]) {
                    acc[key] = data[key];
                }
                return acc;
            }, {});

            // 5. 🛡️ REGISTRO DE AUDITORÍA
            // Solo creamos el log si hay un operador identificado y hubo cambios
            if (operatorId && Object.keys(changesDetected).length > 0) {
                await AuditLog.create({
                    userId: operatorId,
                    action: 'UPDATE',
                    tableName: 'Patients',
                    recordId: id,
                    oldValues: oldData,      // El objeto completo original
                    newValues: changesDetected, // Solo los campos que cambiaron
                    ipAddress: req.ip || req.socket.remoteAddress // Rastro de red
                }, { transaction: t });
            }

            await t.commit();

            // 6. LOG DE CONSOLA PARA DESARROLLO
            console.log(`✅ Auditoría: Paciente ${id} actualizado por Usuario ${operatorId}`);

            return res.json({ 
                success: true, 
                message: "Paciente actualizado y rastro de auditoría generado.",
                data: patient 
            });

        } catch (error: any) {
            // 🚨 Si algo falla, revertimos TODO (Paciente y Log)
            await t.rollback();
            console.error("❌ Error Crítico en updatePatient:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error interno al procesar la actualización.",
                error: error.message 
            });
        }
    }

    // 7. ELIMINAR PACIENTE
    static deletePatient = async (req: Request, res: Response) => {
        try {
            const id = String(req.params.id);
            const operatorId = req.user?.id;
            const patient = await Patient.findByPk(id);

            if (!patient) return res.status(404).json({ success: false, error: 'No encontrado' });

            const oldData = patient.toJSON(); // 🕵️‍♂️ Rescatamos datos antes de destruir
            await patient.destroy(); 

            // 🕵️‍♂️ AUDITORÍA: Eliminación (Crítico)
            if (operatorId) {
                await AuditLog.create({
                    userId: operatorId, action: 'DELETE', tableName: 'Patients',
                    recordId: id, oldValues: oldData, newValues: null
                });
            }

            res.json({ success: true, message: 'Eliminado' });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    // 8. AUDITORÍA BLINDADA (Lectura de DB, no crea Logs)
    static getAuditStats = async (req: Request, res: Response) => {
        const response = {
            stats: { total: 0, pacientes: 0, sin_eps: 0, sin_cups: 0, fechas_malas: 0 },
            duplicates: [] as any[]
        };

        try {
            const [totalRecords, totalPatients] = await Promise.all([ FollowUp.count(), Patient.count() ]);
            const sinEps = await Patient.count({ where: { [Op.or]: [{ insurance: null }, { insurance: '' }] } });
            const sinCups = await FollowUp.count({ where: { [Op.or]: [{ cups: null }, { cups: '' }] } });
            const fechasMalas = await FollowUp.count({
                where: {
                    dateAppointment: { [Op.lt]: sequelize.col('dateRequest') },
                    status: 'REALIZADO'
                }
            });

            response.stats = { total: totalRecords, pacientes: totalPatients, sin_eps: sinEps, sin_cups: sinCups, fechas_malas: fechasMalas };

            try {
                const tableName = FollowUp.getTableName(); 
                const rawQuery = `
                    SELECT "patientId", "dateRequest", "serviceName", COUNT(*)::int as count
                    FROM ${tableName} 
                    GROUP BY "patientId", "dateRequest", "serviceName"
                    HAVING COUNT(*) > 1
                    ORDER BY count DESC
                    LIMIT 50;
                `;

                const duplicateGroups: any[] = await sequelize.query(rawQuery, {
                    type: (sequelize as any).QueryTypes.SELECT
                });

                if (duplicateGroups.length > 0) {
                    const patientIds = duplicateGroups.map((d: any) => d.patientId).filter((id: any) => id);
                    
                    if (patientIds.length > 0) {
                        const patients = await Patient.findAll({
                            where: { id: { [Op.in]: patientIds } },
                            attributes: ['id', 'firstName', 'lastName', 'documentNumber'],
                            raw: true
                        });

                        response.duplicates = duplicateGroups.map((group: any) => {
                            const patient = patients.find((p: any) => p.id === group.patientId);
                            return {
                                id: `${group.patientId}-${new Date(group.dateRequest).getTime()}`,
                                cedula: patient ? patient.documentNumber : '---',
                                nombre: patient ? `${patient.firstName} ${patient.lastName}` : 'PACIENTE DESCONOCIDO',
                                fecha: group.dateRequest,
                                proc: group.serviceName,
                                count: group.count
                            };
                        });
                    }
                }
            } catch (dupError: any) {
                console.warn("⚠️ [AUDIT WARNING] Falló SQL de duplicados:", dupError.original?.message || dupError.message);
                response.duplicates = []; 
            }

            res.json({ success: true, ...response });

        } catch (error: any) {
            console.error("❌ [AUDIT FATAL] Error general:", error);
            res.json({ success: true, ...response });
        }
    }

    // 9. HERRAMIENTA: ELIMINAR DUPLICADOS
    static cleanDuplicates = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        const operatorId = req.user?.id;

        try {
            console.log("🧹 [CLEAN] Iniciando limpieza de duplicados...");

            const cleanQuery = `
                DELETE FROM "FollowUps" a
                USING "FollowUps" b
                WHERE a.id < b.id
                AND a."patientId" = b."patientId"
                AND a."dateRequest" = b."dateRequest"
                AND a."serviceName" = b."serviceName";
            `;

            await sequelize.query(cleanQuery, { transaction: t });
            
            // 🕵️‍♂️ AUDITORÍA: Limpieza de Base de Datos
            if (operatorId) {
                await AuditLog.create({
                    userId: operatorId, action: 'CLEAN_DUPLICATES', tableName: 'FollowUps',
                    recordId: 'MULTIPLE', oldValues: null, newValues: null
                }, { transaction: t });
            }

            await t.commit();
            res.json({ success: true, message: "Limpieza de duplicados completada." });

        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false, error: "Error al limpiar duplicados." });
        }
    }
}