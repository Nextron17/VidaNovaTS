import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

export class CupsController {

    // Helper para normalizar texto (Quita tildes, ñ y espacios extra)
    private static normalizeText(text: string): string {
        return (text || '')
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    // =================================================================
    // MOTOR DE CLASIFICACIÓN (DICCIONARIO ULTIMATE V4)
    // =================================================================
    public static async runAutoCategorization() {
        console.log("🌱 EJECUTANDO CLASIFICACIÓN MASIVA (DICCIONARIO V4 - BLINDADO)...");
        
        const KEYWORDS: Record<string, string[]> = {
            'ESTANCIA': [
                'INTERNACION', 'HABITACION', 'ESTANCIA', 'CAMA', 'UCI', 'UCE', 
                'OBSERVACION', 'HOSPITALIZACION', 'CUIDADO INTENSIVO', 'PENSION',
                'DERECHOS DE SALA'
            ],

            'QUIMIOTERAPIA': [
                'QUIMIO', 'QUYMI', 'ANTINEOPLASIC', 'BEVACIZUMAB', 'RITUXIMAB', 
                'TRASTUZUMAB', 'PEMBROLIZUMAB', 'INFUSION', 'MONOTERAPIA', 
                'POLITERAPIA', 'CARBOPLATINO', 'CISPLATINO', 'INMUNOTERAPIA',
                'ADMINISTRACION DE TRATAMIENTO', 'CICLOFOSFAMIDA', 'TRASTUZUMAB',
                'APLICACION DE MEDICAMENTO'
            ],

            'RADIOTERAPIA': [
                'RADIOTERAPIA', 'TELETERAPIA', 'BRAQUITERAPIA', 'ACELERADOR', 
                'COBALTO', 'DOSIMETRIA', 'I-131', 'YODO', 'RASTREO', 'PLANEACION',
                'SIMULACION'
            ],

            'IMAGENES': [
                'RADIOGRAFIA', 'RX', 'MAMOGRAFIA', 'ECOGRAFIA', 'ULTRASONIDO', 
                'TOMOGRAFIA', 'TAC', 'RESONANCIA', 'RMN', 'GAMAGRAFIA', 'PET', 
                'DOPPLER', 'PERFIL PERINEAL', 'UROGRAFIA', 'CISTOGRAFIA', 
                'ANGIOGRAFIA', 'LOCALIZACION DE LESION', 'ARPON', 'RADIOGUIADA',
                'VERIFICACION INTEGRAL', 'FLUOROSCOPIA', 'DENSITOMETRIA', 'PERFIL HEMODINAMICO',
                'CAMINATA DE 6 MINUTOS', 'MONITOREO AMBULATORIO', 'HOLTER', 'MAPA',
                'ELECTROCARDIOGRAMA', 'ECOCARDIOGRAMA', 'ESPIROMETRIA', 'CURVA DE FLUJO'
            ],

            'LABORATORIO': [
                // Términos Generales
                'LABORATORIO', 'HEMOGRAMA', 'SANGRE', 'ORINA', 'UROCULTIVO', 'CULTIVO', 
                'ANTIBIOGRAMA', 'COLORACION', 'ESTUDIO', 'CITOLOGIA', 'PATOLOGIA', 
                'PERFIL', 'TAMIZAJE', 'PRUEBA', 'DOSIFICACION', 'RECUENTO', 'NIVELES', 
                'ANTICUERPOS', 'ANTIGENO', 'HORMONA', 'DETECT', 'RASTREO', 'TITULACION',
                'CONCENTRACION', 'CAPACIDAD DE', 'ACTIVIDAD DE', 'TIEMPO DE', 'FACTOR',
                'INDEX', 'INDICE', 'ABSORCION', 'SATURACION', 'GLOBULINA',
                
                // Química / Hormonas / Inmunología (Toda tu lista y más)
                'TSH', 'GLUCOSA', 'COLESTEROL', 'CREATININA', 'BUN', 'ELECTROFORESIS', 
                'INMUNO', 'VIRUS', 'PLAQUETAS', 'FOSFATASA', 'TRANSAMINASA', 'BILIRRUBINA', 
                'IONOGRAMA', 'CALCIO', 'BACILOSCOPIA', 'GRAM', 'FROTIS', 'COOMBS', 
                'ERITROSEDIMENTACION', 'BIOPSIA LIQUIDA', 'VIBORA DE RUSSELL', 
                'FACTOR VIII', 'ERITROPOYETINA', 'ERITROPOYETIN', 'RETICULOCITOS', 
                'FERRITINA', 'TRANSFERRINA', 'FOLICO', 'FOLATOS', 'GLICOSILADA', 
                'AMILASA', 'HIERRO', 'CLORO', 'CREATIN', 'QUINASA', 'DESHIDROGENASA', 
                'LIPASA', 'TRIGLICERIDOS', 'PROLACTINA', 'TIROGLOBULINA', 'TIROXINA', 
                'TREPONEMA', 'TREPONEMICA', 'HEPATITIS', 'ANTINUCLEARES', 'CITRULINA', 
                'MICROGLOBULINA', 'CALCITONINA', 'CROMOGRANINA', 'PROCALCITONINA', 
                'REUMATOIDEO', 'UROANALISIS', 'SULFATASA', 'GALACTOSA', 'TIROIDEOS', 
                'TIROGLOBULINICOS', 'MICROSOMALES', 'PEROXIDASA', 'CITRULINADO', 
                'PEPTIDO', 'CARDIOLIPINA', 'TESTOSTERONA', 'ESTRADIOL', 'NITROGENO',
                'UREICO', 'PROTROMBINA', 'TROMBOPLASTINA', 'ALBUMINA', 'PROTEINA',
                
                // Genética / Molecular
                'BCR', 'ABL', 'ERBB2', 'HER-2', 'BRCA1', 'BRCA2', 'GENES', 'SECUENCIACION',
                'MOLECULAR', 'GENETICO', 'HIBRIDACION', 'FISH', 'PCR', 'MUTACION'
            ],

            'CIRUGIA': [
                'CIRUGIA', 'RESECCION', 'ECTOMIA', 'TOMIA', 'SCOPIA', 'BIOPSIA', 
                'CATETER', 'DRENAJE', 'LAVADO', 'SUTURA', 'INJERTO', 'AMPUTACION', 
                'VACIAMIENTO', 'CONIZACION', 'LEGRADO', 'PUNCION', 'ASPIRACION', 
                'EXTIRPACION', 'FULGURACION', 'CAUTERIZACION', 'ANASTOMOSIS', 
                'COLOSTOMIA', 'GASTRECTOMIA', 'NEFRECTOMIA', 'HISTERECTOMIA', 
                'MASTECTOMIA', 'LINFADENECTOMIA', 'ORQUIECTOMIA', 'PROSTATECTOMIA', 
                'CESAREA', 'PARTO', 'LUXACION', 'FRACTURA', 'OSTEOSINTESIS', 
                'LAPAROSCOPIA', 'ENDOSCOPIA', 'COLONOSCOPIA', 'CISTOSCOPIA', 
                'INSERCION', 'RETIRO', 'IMPLANTACION', 'CURACION', 'RECONSTRUCCION', 
                'REEMPLAZO DE DISPOSITIVO', 'GASTROINTESTINAL', 'Y DE ROUX', 
                'DISPOSITIVO URINARIO', 'COLGAJO', 'DESBRIDAMIENTO'
            ],

            'CONSULTA': [
                'CONSULTA', 'VALORACION', 'INTERCONSULTA', 'JUNTA', 'VISITA', 
                'ATENCION', 'URGENCIAS', 'RONDA', 'TRIAGE', 'CONTROL', 'MEDICINA', 
                'ESPECIALISTA', 'PSICOLOGIA', 'NUTRICION', 'ENFERMERIA', 
                'TRABAJO SOCIAL', 'TERAPIA', 'AUDIOMETRIA', 'OPTOMETRIA', 
                'EDUCACION GRUPAL', 'TALLER', 'ASESORIA'
            ],

            'OTROS': [
                'TRANSPORTE', 'AMBULANCIA', 'COPIA', 'HISTORIA', 'CERTIFICADO', 
                'DERECHOS', 'MATERIALES', 'SUMINISTROS', 'OXIGENO', 
                'TRANSFUSION', 'GLOBULOS ROJOS', 'SANGRE TOTAL', 'PLAQUETAS (TRANSFUSION)',
                'KIT', 'PAQUETE'
            ]
        };

        // 1. Identificar registros pendientes
        const unclassified = await FollowUp.findAll({
            where: {
                [Op.or]: [
                    { category: null },
                    { category: 'PENDIENTE' },
                    { category: '' },
                    { category: 'OTROS' }
                ],
                cups: { [Op.ne]: null } 
            },
            attributes: ['cups', 'serviceName', 'id']
        });

        // 2. Mapa de decisión (CUPS -> Categoría)
        const proposals = new Map<string, string>();

        for (const record of unclassified) {
            const texto = CupsController.normalizeText(record.serviceName || '');
            const cups = record.cups;
            
            // Si ya clasificamos este código y no es OTROS, seguimos
            if (proposals.has(cups) && proposals.get(cups) !== 'OTROS') continue;

            for (const [grupo, palabras] of Object.entries(KEYWORDS)) {
                if (palabras.some(p => texto.includes(p))) {
                    if (grupo !== 'OTROS') {
                        proposals.set(cups, grupo);
                        break; // ¡Encontrado! Prioridad máxima
                    } else {
                        // Si es OTROS, lo guardamos pero seguimos buscando algo mejor
                        if (!proposals.has(cups)) proposals.set(cups, grupo);
                    }
                }
            }
        }

        // 3. Aplicar actualizaciones masivas
        let updatedCount = 0;
        const transaction = await sequelize.transaction();

        try {
            for (const [cupsCode, newCategory] of proposals.entries()) {
                const [affected] = await FollowUp.update(
                    { category: newCategory },
                    { 
                        where: { 
                            cups: cupsCode,
                            category: { [Op.or]: [null, 'PENDIENTE', '', 'OTROS'] }
                        },
                        transaction
                    }
                );
                updatedCount += affected;
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error("Error en clasificación masiva:", error);
        }

        console.log(`✅ Clasificación terminada: ${updatedCount} registros actualizados.`);
        return updatedCount;
    }

    // =================================================================
    // 1. LISTAR MAESTRO (CONTRUIDO DESDE LA DATA)
    // =================================================================
    static getCups = async (req: Request, res: Response) => {
        try {
            const cups = await FollowUp.findAll({
                attributes: [
                    [sequelize.fn('DISTINCT', sequelize.col('cups')), 'codigo'],
                    [sequelize.fn('MAX', sequelize.col('serviceName')), 'descripcion'],
                    [sequelize.fn('MAX', sequelize.col('category')), 'grupo'],
                    [sequelize.fn('MAX', sequelize.col('id')), 'id'] 
                ],
                where: {
                    cups: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] }
                },
                group: ['cups'],
                order: [[sequelize.col('cups'), 'ASC']] 
            });

            res.json({
                success: true,
                data: cups.map((c: any) => ({
                    id: c.getDataValue('id'),
                    codigo: c.getDataValue('codigo'),
                    descripcion: c.getDataValue('descripcion'),
                    grupo: c.getDataValue('grupo') || 'PENDIENTE'
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error al cargar maestro.' });
        }
    }

    // =================================================================
    // 2. ACTUALIZACIÓN MANUAL DESDE FRONTEND
    // =================================================================
    static bulkUpdate = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const { ids, grupo } = req.body;
            if (!ids || !grupo) { await t.rollback(); return res.status(400).json({ success: false }); }

            const targetRecords = await FollowUp.findAll({ 
                where: { id: { [Op.in]: ids } }, 
                attributes: ['cups'], 
                transaction: t 
            });
            
            const cupsCodes = targetRecords.map(r => r.cups).filter(c => c);

            if (cupsCodes.length > 0) {
                await FollowUp.update(
                    { category: grupo }, 
                    { where: { cups: { [Op.in]: cupsCodes } }, transaction: t }
                );
            }
            
            await t.commit();
            res.json({ success: true, message: "Actualizado correctamente." });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false });
        }
    }

    // =================================================================
    // 3. ENDPOINT PÚBLICO
    // =================================================================
    static autoCategorize = async (req: Request, res: Response) => {
        try {
            const count = await CupsController.runAutoCategorization();
            res.json({ success: true, updated: count });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }
}