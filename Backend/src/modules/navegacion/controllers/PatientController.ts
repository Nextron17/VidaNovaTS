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
            
            const fileBuffer = Buffer.from(req.file.buffer);
            const operatorId = req.user?.id;

            res.status(202).json({ 
                success: true,
                message: 'Archivo recibido correctamente. El sistema está procesando los datos en segundo plano.', 
            });

            setTimeout(async () => {
                try {
                    console.log("⚙️ [BACKGROUND TASK] Iniciando procesamiento de Excel...");
                    const result = await ImportService.processPatientExcel(fileBuffer);
                    
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
                }
            }, 0);

        } catch (error: any) {
            console.error("❌ Error recibiendo archivo:", error);
            res.status(500).json({ success: false, error: 'Error interno al recibir el archivo.' });
        }
    }

    // 2. LISTAR PACIENTES
    static getPatients = async (req: Request, res: Response) => {
        try {
            const { 
                page = 1, limit = 10, search = '', eps = '', status = '', 
                cohorte = '', startDate, endDate, onlyStats = 'false' 
            } = req.query;

            // 1. ESTADÍSTICAS GLOBALES
            if (onlyStats === 'true') {
                const realizados = await FollowUp.count({ where: { status: 'REALIZADO' } });
                const agendados = await FollowUp.count({ where: { status: 'AGENDADO' } });
                const enGestion = await FollowUp.count({ where: { status: 'EN_GESTION' } });
                const cancelados = await FollowUp.count({ where: { status: 'CANCELADO' } });
                const pendientesDirectos = await FollowUp.count({ where: { status: 'PENDIENTE' } });

                const totalPacientes = await Patient.count();
                const pacientesConCitas = await FollowUp.count({ distinct: true, col: 'patientId' });
                const pacientesNuevosSinCitas = Math.max(0, totalPacientes - pacientesConCitas);

                const pendientes = pendientesDirectos + pacientesNuevosSinCitas;
                const total = realizados + agendados + enGestion + cancelados + pendientes;

                const topProcedures = await FollowUp.findAll({
                    attributes: [
                        ['category', 'name'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
                    ],
                    where: { category: { [Op.ne]: null } },
                    group: ['category'],
                    order: [[sequelize.literal('cantidad'), 'DESC']],
                    limit: 7,
                    raw: true 
                });

                const followUpsConBarrera = await FollowUp.findAll({
                    attributes: ['observation'],
                    where: { observation: { [Op.like]: '%BARRERA:%' } },
                    raw: true
                });

                const conteoBarreras: Record<string, number> = {};
                followUpsConBarrera.forEach((f: any) => {
                    const match = f.observation?.match(/BARRERA:\s*([^|]+)/i);
                    if (match) {
                        const barrera = match[1].trim();
                        if (barrera && !['NINGUNA / SIN BARRERA', 'NO', 'NINGUNA'].includes(barrera.toUpperCase())) {
                            conteoBarreras[barrera] = (conteoBarreras[barrera] || 0) + 1;
                        }
                    }
                });

                const topBarreras = Object.entries(conteoBarreras)
                    .map(([name, cantidad]) => ({ name, cantidad }))
                    .sort((a, b) => b.cantidad - a.cantidad)
                    .slice(0, 5);

                return res.json({
                    success: true,
                    stats: { 
                        total, 
                        pendientes, 
                        en_gestion: enGestion,
                        agendados, 
                        realizados, 
                        cancelados,           
                        topProcedures, 
                        topBarreras 
                    } 
                });
            }

            // 2. BÚSQUEDA Y FILTRADO CON "TWO-STEP LOOKUP"
            const offset = (Number(page) - 1) * Number(limit);
            const patientWhere: any = {};
            const followUpWhere: any = {};
            
            let matchedPatientIds: number[] | null = null; // Guardará los IDs validados

            // A) Filtro de EPS
            if (eps && eps !== 'TODAS') {
                patientWhere.insurance = { [Op.like]: `%${eps}%` };
            }

            // B) Búsqueda Global por texto
            if (search) {
                const cleanSearch = String(search).toUpperCase();
                
                const matchingFollowUps = await FollowUp.findAll({
                    attributes: ['patientId'],
                    where: {
                        [Op.or]: [
                            { cups: { [Op.like]: `%${cleanSearch}%` } },
                            { category: { [Op.like]: `%${cleanSearch}%` } },
                            { serviceName: { [Op.like]: `%${cleanSearch}%` } },
                            { observation: { [Op.like]: `%${cleanSearch}%` } }
                        ]
                    },
                    raw: true
                });
                const searchIds = matchingFollowUps.map((f: any) => f.patientId);

                const textMatchingPatients = await Patient.findAll({
                    attributes: ['id'],
                    where: {
                        [Op.or]: [
                            { documentNumber: { [Op.like]: `%${cleanSearch}%` } },
                            { firstName: { [Op.like]: `%${cleanSearch}%` } },
                            { lastName: { [Op.like]: `%${cleanSearch}%` } }
                        ]
                    },
                    raw: true
                });
                const textIds = textMatchingPatients.map((p: any) => p.id);

                matchedPatientIds = [...new Set([...searchIds, ...textIds])];
            }

            // C) Filtro por Estado 
            if (status === 'PENDIENTE') {
                const pendingCitas = await FollowUp.findAll({ attributes: ['patientId'], where: { status: 'PENDIENTE' }, raw: true });
                const pendingIds = pendingCitas.map((f: any) => f.patientId);
                
                const allPacientesCitas = await FollowUp.findAll({ attributes: ['patientId'], group: ['patientId'], raw: true });
                const withCitasIds = allPacientesCitas.map((f: any) => f.patientId);

                const allPatients = await Patient.findAll({ attributes: ['id'], raw: true });
                const huerfanosIds = allPatients.map((p: any) => p.id).filter(id => !withCitasIds.includes(id));

                const validPendingIds = [...new Set([...pendingIds, ...huerfanosIds])];

                if (matchedPatientIds !== null) {
                    matchedPatientIds = matchedPatientIds.filter(id => validPendingIds.includes(id));
                } else {
                    matchedPatientIds = validPendingIds;
                }

                followUpWhere.status = 'PENDIENTE';
            } else if (status && status !== 'TODOS') {
                // Buscamos directamente qué pacientes tienen este estado (ej. AGENDADO)
                const statusCitas = await FollowUp.findAll({ attributes: ['patientId'], where: { status: status }, raw: true });
                const statusIds = statusCitas.map((f: any) => f.patientId);

                if (matchedPatientIds !== null) {
                    matchedPatientIds = matchedPatientIds.filter(id => statusIds.includes(id));
                } else {
                    matchedPatientIds = statusIds;
                }

                followUpWhere.status = status;
            }

            // D) Filtro por Fechas
            if (startDate && endDate) {
                followUpWhere.dateRequest = { [Op.between]: [new Date(startDate as string), new Date(endDate as string)] };
                
                const dateCitas = await FollowUp.findAll({ attributes: ['patientId'], where: { dateRequest: followUpWhere.dateRequest }, raw: true });
                const dateIds = dateCitas.map((f: any) => f.patientId);
                
                if (matchedPatientIds !== null) {
                    matchedPatientIds = matchedPatientIds.filter(id => dateIds.includes(id));
                } else {
                    matchedPatientIds = dateIds;
                }
            }

            // E) Filtro por Modalidad/Cohorte
            if (cohorte) {
                const filtrosList = (cohorte as string).split(',').map(f => f.trim()).filter(f => f);
                if (filtrosList.length > 0) {
                    const orConditions = filtrosList.map(filtro => ({
                        [Op.or]: [
                            { category: { [Op.like]: `%${filtro}%` } },
                            { observation: { [Op.like]: `%${filtro}%` } }
                        ]
                    }));
                    followUpWhere[Op.or] = orConditions;

                    const cohorteCitas = await FollowUp.findAll({ attributes: ['patientId'], where: { [Op.or]: orConditions }, raw: true });
                    const cohorteIds = cohorteCitas.map((f: any) => f.patientId);

                    if (matchedPatientIds !== null) {
                        matchedPatientIds = matchedPatientIds.filter(id => cohorteIds.includes(id));
                    } else {
                        matchedPatientIds = cohorteIds;
                    }
                }
            }

            // INYECCIÓN DE LOS IDs ENCONTRADOS
            if (matchedPatientIds !== null) {
                // Si la lista quedó vacía tras los cruces, mandamos un ID inexistente [0] para que retorne vacío rápido.
                patientWhere.id = matchedPatientIds.length > 0 ? { [Op.in]: matchedPatientIds } : { [Op.in]: [0] };
            }

            // EJECUCIÓN LIMPIA SIN PROBLEMAS DE SUBQUERIES
            const { count, rows } = await Patient.findAndCountAll({
                where: patientWhere,
                include: [{
                    model: FollowUp,
                    as: 'followups',
                    required: false, 
                    where: Object.keys(followUpWhere).length > 0 ? followUpWhere : undefined,
                }],
                distinct: true,
                limit: Number(limit),
                offset: offset,
                order: [['updatedAt', 'DESC']]
            });

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
            
            if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
                return res.status(400).json({ success: false, error: 'ID de paciente inválido o no proporcionado.' });
            }

            const patient = await Patient.findByPk(id, {
                include: [{ model: FollowUp, as: 'followups' }],
                order: [[{ model: FollowUp, as: 'followups' }, 'dateRequest', 'DESC']]
            });

            if (!patient) return res.status(404).json({ success: false, error: 'No encontrado' });

            const history = await AuditLog.findAll({
                where: {
                    tableName: 'Patients',
                    recordId: id 
                },
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [{ model: User, attributes: ['name'] }]
            });

            res.json({ 
                success: true, 
                data: {
                    ...patient.toJSON(),
                    auditLogs: history 
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
            
            const { 
                documentType, documentNumber, firstName, lastName, 
                phone, email, insurance, city, department, gender, birthDate, status 
            } = req.body;

            const newPatient = await Patient.create({
                documentType, documentNumber, firstName, lastName, 
                phone, email, insurance, city, department, gender, birthDate, status
            });

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
        const operatorId = req.user?.id; 

        try {
            const id = String(req.params.id); 
            const data = req.body;

            const patient = await Patient.findByPk(id);
            
            if (!patient) {
                await t.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: "Paciente no encontrado en la base de datos." 
                });
            }

            const oldData = patient.toJSON();

            await patient.update(data, { transaction: t });

            const changesDetected = Object.keys(data).reduce((acc: any, key) => {
                if (data[key] !== oldData[key]) {
                    acc[key] = data[key];
                }
                return acc;
            }, {});

            if (operatorId && Object.keys(changesDetected).length > 0) {
                await AuditLog.create({
                    userId: operatorId,
                    action: 'UPDATE',
                    tableName: 'Patients',
                    recordId: id,
                    oldValues: oldData,      
                    newValues: changesDetected, 
                    ipAddress: req.ip || req.socket.remoteAddress 
                }, { transaction: t });
            }

            await t.commit();

            console.log(`✅ Auditoría: Paciente ${id} actualizado por Usuario ${operatorId}`);

            return res.json({ 
                success: true, 
                message: "Paciente actualizado y rastro de auditoría generado.",
                data: patient 
            });

        } catch (error: any) {
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

            const oldData = patient.toJSON(); 
            await patient.destroy(); 

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

    // 8. AUDITORÍA BLINDADA
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