import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp'; 
import { ImportService } from '../services/ImportService';
import { Op } from 'sequelize';
import { sequelize } from '../../../core/config/db'; 
import { CupsController } from './CupsController';

export class PatientController {

    // 1. IMPORTACIÓN MASIVA (EXCEL/CSV) CON BLINDAJE
    static importPatients = async (req: Request, res: Response) => {
        try {
            // 🛡️ 1. Validación de existencia del archivo (Por si Multer lo bloqueó por peso/formato)
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Falta archivo para procesar o el formato/peso no es válido.' 
                });
            }
            
            // 2. Procesamiento del Excel
            const result = await ImportService.processPatientExcel(req.file.buffer);
            
            // 3. Respuesta exitosa
            res.json({ 
                success: true,
                message: 'Proceso de importación finalizado', 
                details: result 
            });
        } catch (error: any) {
            console.error("❌ Error Importando:", error);

            // 🛡️ 4. Manejo de Errores Específicos
            if (error.message && error.message.includes('FORMATO_INVALIDO')) {
                return res.status(400).json({ success: false, error: error.message });
            }

            res.status(500).json({ success: false, error: 'Error interno al procesar el archivo.' });
        }
    }

    // 2. LISTAR PACIENTES (Filtros Múltiples + Estadísticas)
    static getPatients = async (req: Request, res: Response) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                eps = '', 
                status = '', 
                cohorte = '', 
                startDate,
                endDate
            } = req.query;
            
            // Log para verificar que el filtro llega al servidor
            console.log("🔍 FILTRO RECIBIDO:", { cohorte, status }); 

            const offset = (Number(page) - 1) * Number(limit);
            
            // A. Filtros del PACIENTE
            const patientWhere: any = {};

            if (eps && eps !== 'TODAS') {
                patientWhere.insurance = { [Op.like]: `%${eps}%` };
            }

            if (search) {
                patientWhere[Op.or] = [
                    { documentNumber: { [Op.like]: `%${search}%` } },
                    { firstName: { [Op.like]: `%${search}%` } },
                    { lastName: { [Op.like]: `%${search}%` } }
                ];
            }

            // B. Filtros del SEGUIMIENTO 
            const followUpWhere: any = {};
            let hasFollowUpFilters = false; 

            // 1. Estado
            if (status && status !== 'TODOS') {
                followUpWhere.status = status;
                hasFollowUpFilters = true;
            }

            // 2. Fechas
            if (startDate && endDate) {
                followUpWhere.dateRequest = {
                    [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
                };
                hasFollowUpFilters = true;
            }

            // 3. Modalidad / Cohorte 
            if (cohorte) {
                const filtrosList = (cohorte as string).split(',').map(f => f.trim()).filter(f => f);
                
                if (filtrosList.length > 0) {
                    followUpWhere[Op.or] = filtrosList.map(filtro => ({
                        [Op.or]: [
                            // Busca en Categoría ("Imagenología")
                            { category: { [Op.like]: `%${filtro}%` } },
                            // Busca en Observación ("1= CAC Mama")
                            { observation: { [Op.like]: `%${filtro}%` } }
                        ]
                    }));
                    hasFollowUpFilters = true;
                }
            }

            // Configuración del JOIN
            const includeOptions: any[] = [{
                model: FollowUp,
                as: 'followups',
                required: hasFollowUpFilters,
                where: hasFollowUpFilters ? followUpWhere : undefined,
                order: [['dateRequest', 'DESC']]
            }];

            // C. Ejecutar Consulta
            const { count, rows } = await Patient.findAndCountAll({
                where: patientWhere,
                include: includeOptions,
                distinct: true,
                limit: Number(limit),
                offset: offset,
                order: [['updatedAt', 'DESC']]
            });

            // Reordenar followups en memoria para que el 0 sea siempre el más reciente
            rows.forEach((p: any) => {
                if (p.followups && p.followups.length > 0) {
                    p.followups.sort((a: any, b: any) => new Date(b.dateRequest).getTime() - new Date(a.dateRequest).getTime());
                }
            });

            // D. Estadístics
            const stats = {
                total: await Patient.count(),
                pendientes: await FollowUp.count({ where: { status: 'PENDIENTE' } }),
                realizados: await FollowUp.count({ where: { status: 'REALIZADO' } }),
                agendados: await FollowUp.count({ where: { status: 'AGENDADO' } }),
                topProcedures: await FollowUp.findAll({
                    attributes: [
                        ['category', 'name'],
                        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
                    ],
                    where: { category: { [Op.ne]: null } },
                    group: ['category'],
                    order: [[sequelize.literal('cantidad'), 'DESC']],
                    limit: 7
                })
            };

            res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    totalPages: Math.ceil(count / Number(limit)),
                    currentPage: Number(page)
                },
                stats
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
            const patient = await Patient.findByPk(id, {
                include: [{ model: FollowUp, as: 'followups' }],
                order: [[{ model: FollowUp, as: 'followups' }, 'dateRequest', 'DESC']]
            });
            if (!patient) return res.status(404).json({ success: false, error: 'No encontrado' });
            res.json({ success: true, data: patient }); 
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    static createPatient = async (req: Request, res: Response) => {
        try {
            const exists = await Patient.findOne({ where: { documentNumber: req.body.documentNumber } });
            if (exists) return res.status(400).json({ success: false, error: 'Ya existe.' });
            const newPatient = await Patient.create(req.body);
            res.status(201).json({ success: true, data: newPatient });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    // 6. ACTUALIZAR PACIENTE
    static updatePatient = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const id = String(req.params.id); 
            const data = req.body;

            const patient = await Patient.findByPk(id);
            
            if (!patient) {
                await t.rollback();
                return res.status(404).json({ success: false, message: "Paciente no encontrado en BD." });
            }

            await patient.update(data, { transaction: t });

            await t.commit();

            return res.json({ 
                success: true, 
                message: "Paciente actualizado correctamente.",
                data: patient 
            });

        } catch (error: any) {
            await t.rollback();
            console.error("Error actualizando paciente:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error interno al actualizar.",
                error: error.message 
            });
        }
    }

    // 7. ELIMINAR PACIENTE
    static deletePatient = async (req: Request, res: Response) => {
        try {
            const id = String(req.params.id);
            await Patient.destroy({ where: { id: id } }); 
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
            console.log("🔍 [AUDIT] Iniciando diagnóstico...");

            const [totalRecords, totalPatients] = await Promise.all([
                FollowUp.count(),
                Patient.count()
            ]);

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
            
            await t.commit();
            res.json({ success: true, message: "Limpieza de duplicados completada." });

        } catch (error) {
            await t.rollback();
            console.error("❌ Error limpiando duplicados:", error);
            res.status(500).json({ success: false, error: "Error al limpiar duplicados." });
        }
    }
}