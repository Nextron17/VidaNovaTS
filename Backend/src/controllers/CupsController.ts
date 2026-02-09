import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Op } from 'sequelize';
import { sequelize } from '../config/db';

export class CupsController {

    // Helper to normalize text (Remove accents, special characters, and extra spaces)
    private static normalizeText(text: string): string {
        return (text || '')
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    
    // CLASSIFICATION ENGINE (ULTIMATE DICTIONARY V7 - SYNCHRONIZED)
    
    public static async runAutoCategorization() {
        console.log("🌱 EXECUTING MASS CLASSIFICATION (DICTIONARY V7 - SYNCHRONIZED)...");
        
        // 1. PRIORIDAD: ENFERMEDADES (Nombres idénticos al CIE-10 y Frontend)
        const KEYWORDS: Record<string, string[]> = {
            '1= CAC Mama': [
                'MAMA', 'MAMOGRAFIA', 'MASTOLOGIA', 'HER-2', 'BRCA', 'CUADRANTE', 'MASTECTOMIA'
            ],
            '2= CAC Próstata': [
                'PROSTATA', 'PSA', 'ANTIGENO ESPECIFICO DE PROSTATA', 'PROSTATECTOMIA'
            ],
            '3= CAC Cérvix': [
                'CITOLOGIA', 'VPH', 'CUELLO UTERINO', 'COLPOSCOPIA', 'CONIZACION', 'VAGINECTOMIA'
            ],
            '4= CAC Colorectal': [
                'COLONOSCOPIA', 'SIGMOIDECTOMIA', 'COLOSTOMIA', 'SANGRE OCULTA', 'CARCINOEMBRIONARIO', 'RECTO'
            ],
            '5= CAC Estómago': [
                'GASTRECTOMIA', 'ESOFAGOGASTRO', 'ENDOSCOPIA DIGESTIVA', 'CAMARA GASTRICA', 'HELICOBACTER'
            ],
            '7= CAC Pulmón': [
                'BRONCOSCOPIA', 'LOBECTOMIA', 'PULMON'
            ],
            '22= Glándulas tiroides y endocrinas': [
                'TIROIDES', 'TIROIDECTOMIA', 'TSH', 'TIROGLOBULINA', 'YODO'
            ],
            
            // 2. MODALIDADES (Para lo que no tiene diagnóstico específico)
            'ESTANCIA': [
                'INTERNACION', 'HABITACION', 'ESTANCIA', 'CAMA', 'UCI', 'UCE', 
                'OBSERVACION', 'HOSPITALIZACION', 'CUIDADO INTENSIVO', 'PENSION',
                'DERECHOS DE SALA', 'SALA DE CURACIONES'
            ],

            'QUIMIOTERAPIA': [
                'QUIMIO', 'QUYMI', 'ANTINEOPLASIC', 'BEVACIZUMAB', 'RITUXIMAB', 
                'TRASTUZUMAB', 'PEMBROLIZUMAB', 'INFUSION', 'MONOTERAPIA', 
                'POLITERAPIA', 'CARBOPLATINO', 'CISPLATINO', 'INMUNOTERAPIA',
                'ADMINISTRACION DE TRATAMIENTO', 'CICLOFOSFAMIDA', 'APLICACION DE MEDICAMENTO',
                'INYECCION O INFUSION'
            ],

            'RADIOTERAPIA': [
                'RADIOTERAPIA', 'TELETERAPIA', 'BRAQUITERAPIA', 'ACELERADOR', 
                'COBALTO', 'DOSIMETRIA', 'I-131', 'YODO', 'RASTREO DE METASTASIS', 'PLANEACION',
                'SIMULACION'
            ],

            'IMAGENES': [
                'RADIOGRAFIA', 'RX', 'MAMOGRAFIA', 'ECOGRAFIA', 'ULTRASONIDO', 
                'TOMOGRAFIA', 'TAC', 'RESONANCIA', 'RMN', 'GAMAGRAFIA', 'PET', 
                'DOPPLER', 'UROGRAFIA', 'CISTOGRAFIA', 'ANGIOGRAFIA', 
                'FLUOROSCOPIA', 'DENSITOMETRIA', 'PERFIL HEMODINAMICO',
                'URETROCISTOGRAFIA', 'FARINGOGRAFIA', 'ESOFAGOGRAMA',
                'LOCALIZACION DE LESION', 'ARPON', 'RADIOGUIADA', 'VERIFICACION INTEGRAL',
                'MAPEO CORPORAL', 
                'CAMINATA DE 6 MINUTOS', 'MONITOREO AMBULATORIO', 'HOLTER', 'MAPA',
                'ELECTROCARDIOGRAMA', 'ECOCARDIOGRAMA', 'ESPIROMETRIA', 'CURVA DE FLUJO',
                'NEUROCONDUCCION', 'ELECTROMIOGRAFIA', 'POTENCIALES', 'POLISOMNOGRAFIA',
                'PERFIL PERINEAL'
            ],

            'PROCEDIMIENTOS': [ 
                'BLOQUEO', 'INFILTRACION', 'PUNCION', 'PARACENTESIS', 'TORACOCENTESIS',
                'ELECTROESTIMULACION', 'NEUROLISIS', 'RADIOFRECUENCIA', 'CATETERISMO',
                'LAVADO', 'CURACION', 'RETIRO DE PUNTOS', 'SUTURA', 'DESBRIDAMIENTO',
                'INTRALESIONAL', 'TRIGEMINAL', 'ESFENOPALATINO', 'PLEJO', 'PUDENDOS',
                'SIMPATICO', 'GANGLIO', 'PERINEAL', 'RETIRO DE SUTURAS',
                'INSERCION DE CATETER', 'RETIRO DE CATETER', 'IMPLANTACION DE CATETER',
                'NEFROSTOMIA', 'CISTOSCOPIA', 'NASOLARINGOSCOPIA', 'COLPOSCOPIA',
                'INSERCION DE DISPOSITIVO'
            ],

            'LABORATORIO': [
                'LABORATORIO', 'HEMOGRAMA', 'SANGRE', 'ORINA', 'UROCULTIVO', 'CULTIVO', 
                'ANTIBIOGRAMA', 'COLORACION', 'ESTUDIO', 'CITOLOGIA', 'PATOLOGIA', 
                'PERFIL', 'TAMIZAJE', 'PRUEBA', 'DOSIFICACION', 'RECUENTO', 'NIVELES', 
                'ANTICUERPOS', 'ANTIGENO', 'HORMONA', 'DETECT', 'RASTREO', 'TITULACION',
                'CONCENTRACION', 'CAPACIDAD DE', 'ACTIVIDAD DE', 'TIEMPO DE', 'FACTOR',
                'INDEX', 'INDICE', 'ABSORCION', 'SATURACION', 'GLOBULINA', 'EXTENDIDO',
                'TSH', 'GLUCOSA', 'COLESTEROL', 'CREATININA', 'BUN', 'ELECTROFORESIS', 
                'INMUNO', 'VIRUS', 'PLAQUETAS', 'FOSFATASA', 'TRANSAMINASA', 'BILIRRUBINA', 
                'IONOGRAMA', 'CALCIO', 'BACILOSCOPIA', 'GRAM', 'FROTIS', 'COOMBS', 
                'ERITROSEDIMENTACION', 'BIOPSIA LIQUIDA', 'VIBORA DE RUSSELL', 
                'ERITROPOYETINA', 'RETICULOCITOS', 'FERRITINA', 'TRANSFERRINA', 
                'FOLICO', 'FOLATOS', 'GLICOSILADA', 'AMILASA', 'HIERRO', 'CLORO', 
                'CREATIN', 'QUINASA', 'DESHIDROGENASA', 'LIPASA', 'TRIGLICERIDOS', 
                'PROLACTINA', 'TIROGLOBULINA', 'TIROXINA', 'TREPONEMA', 'TREPONEMICA', 
                'HEPATITIS', 'ANTINUCLEARES', 'CITRULINA', 'MICROGLOBULINA', 'CALCITONINA', 
                'CROMOGRANINA', 'PROCALCITONINA', 'REUMATOIDEO', 'UROANALISIS', 'SULFATASA', 
                'GALACTOSA', 'TIROIDEOS', 'PEROXIDASA', 'PEPTIDO', 'CARDIOLIPINA', 
                'TESTOSTERONA', 'ESTRADIOL', 'NITROGENO', 'UREICO', 'PROTROMBINA', 
                'TROMBOPLASTINA', 'ALBUMINA', 'PROTEINA', 'FIBRINOGENO', 
                'VITAMINA', 'CIANOCOBALAMINA', 'HIDROXI', 'CALCIFEROL', 'CALCIFIDOL',
                'POTASIO', 'SODIO', 'MAGNESIO', 'FOSFORO', 'MICROALBUMINURIA', 'TROPONINA',
                'BCR', 'ABL', 'ERBB2', 'HER-2', 'BRCA1', 'BRCA2', 'GENES', 'SECUENCIACION',
                'MOLECULAR', 'GENETICO', 'HIBRIDACION', 'FISH', 'PCR', 'MUTACION',
                'ESTUDIO ANATOMOPATOLOGICO', 'COLORACION BASICA', 'INMUNOHISTOQUIMICA',
                'MARCADOR', 'VPH', 'PAPILOMA'
            ],

            'CIRUGIA': [
                'CIRUGIA', 'RESECCION', 'ECTOMIA', 'TOMIA', 'SCOPIA', 'BIOPSIA', 
                'INJERTO', 'AMPUTACION', 'VACIAMIENTO', 'CONIZACION', 'LEGRADO', 
                'ASPIRACION', 'EXTIRPACION', 'FULGURACION', 'CAUTERIZACION', 'ANASTOMOSIS', 
                'COLOSTOMIA', 'GASTRECTOMIA', 'NEFRECTOMIA', 'HISTERECTOMIA', 
                'MASTECTOMIA', 'LINFADENECTOMIA', 'ORQUIECTOMIA', 'PROSTATECTOMIA', 
                'CESAREA', 'PARTO', 'LUXACION', 'FRACTURA', 'OSTEOSINTESIS', 
                'LAPAROSCOPIA', 'ENDOSCOPIA', 'COLONOSCOPIA', 'RECONSTRUCCION', 
                'REEMPLAZO DE DISPOSITIVO', 'GASTROINTESTINAL', 'Y DE ROUX', 
                'COLGAJO', 'FLEBOTOMIA', 'MUCOSECTOMIA', 'SIGMOIDECTOMIA',
                'TIROIDECTOMIA', 'PARATIROIDECTOMIA', 'OOFORECTOMIA', 'SALPINGECTOMIA',
                'VAGINECTOMIA', 'TRASPLANTE', 'NEFRECTOMIA'
            ],

            'CONSULTA': [
                'CONSULTA', 'VALORACION', 'INTERCONSULTA', 'JUNTA', 'VISITA', 
                'ATENCION', 'URGENCIAS', 'RONDA', 'TRIAGE', 'CONTROL', 'MEDICINA', 
                'ESPECIALISTA', 'PSICOLOGIA', 'NUTRICION', 'ENFERMERIA', 
                'TRABAJO SOCIAL', 'TERAPIA', 'AUDIOMETRIA', 'OPTOMETRIA', 
                'EDUCACION GRUPAL', 'TALLER', 'ASESORIA', 'SOPORTE ANESTESICO',
                'SOPORTE DE SEDACION', 'LOGOAUDIOMETRIA'
            ],

            'OTROS': [
                'TRANSPORTE', 'AMBULANCIA', 'COPIA', 'HISTORIA', 'CERTIFICADO', 
                'DERECHOS', 'MATERIALES', 'SUMINISTROS', 'OXIGENO', 
                'TRANSFUSION', 'GLOBULOS ROJOS', 'SANGRE TOTAL', 'PLAQUETAS (TRANSFUSION)',
                'KIT', 'PAQUETE', 'CONSUMO DE OXIGENO', 'VACUNACION'
            ]
        };

        // 1. Identify pending records
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

        // 2. Decision Map (CUPS -> Category)
        const proposals = new Map<string, string>();

        for (const record of unclassified) {
            const texto = CupsController.normalizeText(record.serviceName || '');
            const cups = record.cups;
            
            if (proposals.has(cups) && proposals.get(cups) !== 'OTROS') continue;

            for (const [grupo, palabras] of Object.entries(KEYWORDS)) {
                if (palabras.some(p => texto.includes(p))) {
                    // Si es un grupo "OTRO" o similar, lo marcamos pero seguimos buscando algo mejor
                    if (grupo !== 'OTROS') {
                        proposals.set(cups, grupo);
                        break; 
                    } else {
                        if (!proposals.has(cups)) proposals.set(cups, grupo);
                    }
                }
            }
        }

        // 3. Apply updates
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
            console.error("Error in mass classification:", error);
        }

        console.log(`✅ Classification finished: ${updatedCount} records updated.`);
        return updatedCount;
    }

    
    // 🔥 MÉTODO DE REPARACIÓN MASIVA (EJECUTAR UNA SOLA VEZ)
    
    static fixLegacyCategories = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            console.log("🧹 INICIANDO REPARACIÓN DE CATEGORÍAS ANTIGUAS...");
            
            // Mapa de Corrección: "Nombre Viejo" -> "Nombre Nuevo Oficial"
            const MAPPING: Record<string, string> = {
                // Corrección de Nombres Genéricos a Oficiales CAC
                'CAC MAMA': '1= CAC Mama',
                'MAMA': '1= CAC Mama',
                
                'CAC PROSTATA': '2= CAC Próstata',
                'PROSTATA': '2= CAC Próstata',
                
                'CAC CERVIX': '3= CAC Cérvix',
                'CERVIX': '3= CAC Cérvix',
                
                'CAC COLON': '4= CAC Colorectal',
                'COLORECTAL': '4= CAC Colorectal',
                
                'CAC GASTRICO': '5= CAC Estómago',
                'ESTOMAGO': '5= CAC Estómago',
                
                'CAC MELANOMA': '6= CAC Melanoma',
                'MELANOMA': '6= CAC Melanoma',
                
                'CAC PULMON': '7= CAC Pulmón',
                'PULMON': '7= CAC Pulmón',
                
                'CAC TIROIDES': '22= Glándulas tiroides y endocrinas',
                'TIROIDES': '22= Glándulas tiroides y endocrinas',
                
                'CAC HEMATO': '24= Otros tumores tejido linfático/hematopoyético',
                
                // Normalización de Modalidades
                'IMAGENES': 'IMAGENES', 
                'LABORATORIO': 'LABORATORIO',
                'PROCEDIMIENTOS': 'PROCEDIMIENTOS',
                'CIRUGIA': 'CIRUGIA',
                'CONSULTA': 'CONSULTA',
                'QUIMIOTERAPIA': 'QUIMIOTERAPIA',
                'RADIOTERAPIA': 'RADIOTERAPIA'
            };

            let totalUpdated = 0;

            for (const [oldName, newName] of Object.entries(MAPPING)) {
                // Solo actualizamos si son diferentes
                if (oldName !== newName) {
                    const [affected] = await FollowUp.update(
                        { category: newName },
                        { 
                            where: { category: oldName },
                            transaction: t
                        }
                    );
                    if (affected > 0) console.log(`✅ Corregidos ${affected} registros de "${oldName}" a "${newName}"`);
                    totalUpdated += affected;
                }
            }

            await t.commit();
            return res.json({ success: true, message: `Reparación completada. ${totalUpdated} registros actualizados.` });

        } catch (error: any) {
            await t.rollback();
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    
    // 1. LIST MASTER (BUILT FROM DATA)
    
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
            res.status(500).json({ success: false, error: 'Error loading master.' });
        }
    }

    
    // 2. MANUAL UPDATE FROM FRONTEND
    
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
            res.json({ success: true, message: "Updated successfully." });
        } catch (error) {
            await t.rollback();
            res.status(500).json({ success: false });
        }
    }

    
    // 3. PUBLIC ENDPOINT
    
    static autoCategorize = async (req: Request, res: Response) => {
        try {
            const count = await CupsController.runAutoCategorization();
            res.json({ success: true, updated: count });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }
}