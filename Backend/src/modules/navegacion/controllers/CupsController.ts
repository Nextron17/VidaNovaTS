import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { Op } from 'sequelize';
import { sequelize } from '../../../core/config/db';

export class CupsController {

    private static normalizeText(text: string): string {
        return (text || '')
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    
    // MOTOR DE INTELIGENCIA DE NEGOCIO PARA CATEGORIZAR CUPS
    
    public static async runAutoCategorization() {
        console.log("🌱 EJECUTANDO CLASIFICACIÓN V15 (CON 'OTROS')...");
        
        const MODALIDADES: Record<string, string[]> = {
            'Consulta Externa': [
                'CONSULTA', 'VALORACION', 'INTERCONSULTA', 'JUNTA', 'VISITA', 
                'ATENCION DOMICILIARIA', 'ATENCION (VISITA)', 'URGENCIAS', 'RONDA', 'TRIAGE', 'CONTROL', 
                'MEDICINA GENERAL', 'MEDICINA INTERNA', 'MEDICINA FAMILIAR', 'MEDICINA ESPECIALIZADA',
                'ESPECIALISTA', 'PSICOLOGIA', 'NUTRICION', 'ENFERMERIA', 'ODONTOLOGIA',
                'TRABAJO SOCIAL', 'TERAPIA', 'REHABILITACION', 'FONOAUDIOLOGIA',
                'EDUCACION GRUPAL', 'TALLER', 'ASESORIA', 'SOPORTE ANESTESICO', 'SOPORTE DE SEDACION',
                'PSICOTERAPIA', 'ACOMPAÑAMIENTO'
            ],
            'Laboratorio': [
                'LABORATORIO', 'HEMOGRAMA', 'SANGRE', 'ORINA', 'UROCULTIVO', 'CULTIVO', 
                'ANTIBIOGRAMA', 'COLORACION', 'ESTUDIO', 'CITOLOGIA', 'PATOLOGIA', 
                'PERFIL', 'TAMIZAJE', 'PRUEBA', 'DOSIFICACION', 'RECUENTO', 'NIVELES', 
                'ANTICUERPOS', 'ANTIGENO', 'HORMONA', 'DETECT', 'TITULACION',
                'CONCENTRACION', 'CAPACIDAD DE', 'ACTIVIDAD DE', 'TIEMPO DE', 'FACTOR',
                'INDEX', 'INDICE', 'ABSORCION', 'SATURACION', 'GLOBULINA', 'EXTENDIDO',
                'TSH', 'GLUCOSA', 'COLESTEROL', 'CREATININA', 'BUN', 'ELECTROFORESIS', 
                'INMUNO', 'VIRUS', 'PLAQUETAS', 'FOSFATASA', 'TRANSAMINASA', 'BILIRRUBINA', 
                'IONOGRAMA', 'CALCIO', 'BACILOSCOPIA', 'GRAM', 'FROTIS', 'COOMBS', 
                'ERITROSEDIMENTACION', 'BIOPSIA LIQUIDA', 'VIBORA DE RUSSELL', 
                'RETICULOCITOS', 'TRANSFERRINA', 'FOLICO', 'FOLATOS', 
                'GLICOSILADA', 'AMILASA', 'HIERRO', 'CLORO', 'CREATIN', 'QUINASA', 
                'DESHIDROGENASA', 'LIPASA', 'PROLACTINA', 'TIROXINA', 'TREPONEMA', 
                'HEPATITIS', 'ANTINUCLEARES', 'CITRULINA', 'MICROGLOBULINA', 'CALCITONINA', 
                'CROMOGRANINA', 'PROCALCITONINA', 'REUMATOIDEO', 'SULFATASA', 'GALACTOSA', 
                'PEROXIDASA', 'PEPTIDO', 'CARDIOLIPINA', 'TESTOSTERONA', 'ESTRADIOL', 'NITROGENO', 
                'UREICO', 'PROTROMBINA', 'TROMBOPLASTINA', 'ALBUMINA', 'PROTEINA', 
                'FIBRINOGENO', 'VITAMINA', 'CIANOCOBALAMINA', 'HIDROXI', 'CALCIFEROL', 
                'CALCIFIDOL', 'POTASIO', 'SODIO', 'MAGNESIO', 'FOSFORO', 'MICROALBUMINURIA', 
                'TROPONINA', 'BCR', 'ABL', 'ERBB2', 'HER-2', 'BRCA1', 'BRCA2', 'GENES', 
                'SECUENCIACION', 'MOLECULAR', 'GENETICO', 'HIBRIDACION', 'FISH', 'PCR', 
                'MUTACION', 'ESTUDIO ANATOMOPATOLOGICO', 'INMUNOHISTOQUIMICA', 'MARCADOR', 
                'VPH', 'PAPILOMA', 'FERRITINA', 'TRIGLICERIDOS', 'TIROGLOBULINA', 'UROANALISIS',
                'ERITROPOYETINA', 'ARILSULFATASA'
            ],
            'Imagenología': [
                'RADIOGRAFIA', 'RX', 'MAMOGRAFIA', 'ECOGRAFIA', 'ULTRASONIDO', 
                'TOMOGRAFIA', 'TAC', 'RESONANCIA', 'RMN', 'GAMAGRAFIA', 'PET', 
                'DOPPLER', 'UROGRAFIA', 'CISTOGRAFIA', 'ANGIOGRAFIA', 
                'FLUOROSCOPIA', 'DENSITOMETRIA', 'PERFIL HEMODINAMICO',
                'URETROCISTOGRAFIA', 'FARINGOGRAFIA', 'ESOFAGOGRAMA',
                'LOCALIZACION DE LESION', 'ARPON', 'RADIOGUIADA', 'VERIFICACION INTEGRAL',
                'MAPEO CORPORAL', 'GAMMAGRAFIA', 'CEREBRO', 'COLUMNA', 'TORAX', 'ABDOMEN',
                'CAMINATA DE 6 MINUTOS', 'MONITOREO AMBULATORIO', 'HOLTER', 'MAPA',
                'ELECTROCARDIOGRAMA', 'ECOCARDIOGRAMA', 'ESPIROMETRIA', 'CURVA DE FLUJO',
                'NEUROCONDUCCION', 'ELECTROMIOGRAFIA', 'POTENCIALES', 'POLISOMNOGRAFIA',
                'PERFIL PERINEAL', 'MAPEO', 'RASTREO', 'CONSUMO DE OXIGENO',
                'AUDIOMETRIA', 'LOGOAUDIOMETRIA', 'OPTOMETRIA',
                'NASOLARINGOSCOPIA', 'COLONOSCOPIA', 'ESOFAGOGASTRO', 'CISTOSCOPIA',
                'RECTOSIGMOIDOSCOPIA', 'COLPOSCOPIA', 'BRONCOSCOPIA', 'ENDOSCOPIA', 'ANOSCOPIA'
            ],
            'Quimioterapia': [
                'QUIMIO', 'QUYMI', 'ANTINEOPLASIC', 'BEVACIZUMAB', 'RITUXIMAB', 
                'TRASTUZUMAB', 'PEMBROLIZUMAB', 'INFUSION', 'MONOTERAPIA', 
                'POLITERAPIA', 'CARBOPLATINO', 'CISPLATINO', 'INMUNOTERAPIA',
                'ADMINISTRACION DE TRATAMIENTO', 'CICLOFOSFAMIDA', 'APLICACION DE MEDICAMENTO',
                'INYECCION O INFUSION', 'QT', 'FILGRASTIM', 'MEDICAMENTO'
            ],
            'Radioterapia': [
                'RADIOTERAPIA', 'TELETERAPIA', 'BRAQUITERAPIA', 'ACELERADOR', 
                'COBALTO', 'DOSIMETRIA', 'I-131', 'YODO', 'RASTREO DE METASTASIS', 'PLANEACION',
                'SIMULACION', 'RT'
            ],
            'Clínica del Dolor': [
                'DOLOR', 'PALIATIVO', 'ANALGESIA', 'BLOQUEO', 'INFILTRACION', 
                'NEUROLISIS', 'RADIOFRECUENCIA', 'ESTIMULACION', 'CATETERISMO',
                'GANGLIO', 'PLEJO', 'SIMPATICO', 'TRIGEMINAL'
            ],
            'Estancia': [
                'INTERNACION', 'HABITACION', 'ESTANCIA', 'CAMA', 'UCI', 'UCE', 
                'OBSERVACION', 'HOSPITALIZACION', 'CUIDADO INTENSIVO', 'PENSION',
                'SALA DE CURACIONES', 'TRANSFUSION', 'DERECHOS DE SALA'
            ],
            'Cirugía': [
                'CIRUGIA', 'RESECCION', 'ECTOMIA', 'TOMIA', 'SCOPIA', 
                'INJERTO', 'AMPUTACION', 'VACIAMIENTO', 'CONIZACION', 'LEGRADO', 
                'ASPIRACION', 'EXTIRPACION', 'FULGURACION', 'CAUTERIZACION', 'ANASTOMOSIS', 
                'COLOSTOMIA', 'GASTRECTOMIA', 'NEFRECTOMIA', 'HISTERECTOMIA', 
                'MASTECTOMIA', 'LINFADENECTOMIA', 'ORQUIECTOMIA', 'PROSTATECTOMIA', 
                'CESAREA', 'PARTO', 'LUXACION', 'FRACTURA', 'OSTEOSINTESIS', 
                'LAPAROSCOPIA', 'ENDOSCOPIA TERAPEUTICA', 'RECONSTRUCCION', 
                'REEMPLAZO', 'GASTROINTESTINAL', 'Y DE ROUX', 
                'COLGAJO', 'FLEBOTOMIA', 'MUCOSECTOMIA', 'SIGMOIDECTOMIA',
                'TIROIDECTOMIA', 'PARATIROIDECTOMIA', 'OOFORECTOMIA', 'SALPINGECTOMIA',
                'VAGINECTOMIA', 'TRASPLANTE', 'NEFROSTOMIA', 'INSERCION', 
                'RETIRO', 'CATETER', 'BIOPSIA', 'SUTURA', 'PUNCION', 'PARACENTESIS', 
                'TORACOCENTESIS', 'LAVADO', 'CURACION', 'DESBRIDAMIENTO'
            ],
            'Oncología': [ 
                'ONCOLOGIA', 'CANCER', 'TUMOR', 'NEOPLASIA', 'CARCINOMA',
                'SARCOMA', 'LINFOMA', 'LEUCEMIA', 'MELANOMA', 'BLASTOMA'
            ],

            // ESTA CATEGORIA ES PARA LOS CUPS QUE NO ENCAJAN EN NINGUNA DE LAS ANTERIORES  
            'Otros': [
                'TRANSPORTE', 'TRASLADO', 'AMBULANCIA', 'MOVILIZACION', 
                'COPIA', 'FOTOCOPIA', 'CERTIFICADO', 'HISTORIA CLINICA',
                'DOCUMENTO', 'ADMINISTRATIVO', 'NO POS', 'CUOTA MODERADORA',
                'COPAGO', 'PARTICULAR'
            ]
        };

               // 2. DICCIONARIO DE CAC 
        const DIAGNOSTICOS: Record<string, string[]> = {
            '1= CAC Mama': ['C50', 'C500', 'C501', 'C502', 'C503', 'C504', 'C505', 'C506', 'C508', 'C509', 'D05', 'D050', 'D051', 'D057', 'D059', 'MAMA', 'MASTOLOGIA', 'HER-2', 'BRCA', 'CUADRANTE', 'MASTECTOMIA', 'PEZON', 'AREOLA', 'AXILAR', 'CARCINOMA IN SITU DE LA MAMA', 'INTRACANALICULAR', 'LOBULAR'],
            '2= CAC Próstata': ['C61', 'C61X', 'D075', 'PROSTATA', 'PSA', 'ANTIGENO ESPECIFICO DE PROSTATA', 'PROSTATECTOMIA', 'TUMOR MALIGNO DE LA PROSTATA', 'CARCINOMA IN SITU DE LA PROSTATA'],
            '3= CAC Cérvix': ['C53', 'C530', 'C531', 'C538', 'C539', 'D06', 'D060', 'D061', 'D067', 'D069', 'CITOLOGIA', 'VPH', 'CUELLO UTERINO', 'COLPOSCOPIA', 'CONIZACION', 'CERVIX', 'ENDOCERVIX', 'EXOCERVIX', 'CERVICOVAGINAL'],
            '4= CAC Colorectal': ['C18', 'C180', 'C181', 'C182', 'C183', 'C184', 'C185', 'C186', 'C187', 'C188', 'C189', 'C19', 'C19X', 'C20', 'C20X', 'D010', 'D011', 'D012', 'COLON', 'RECTO', 'COLORECTAL', 'SIGMOIDECTOMIA', 'COLOSTOMIA', 'SANGRE OCULTA', 'CARCINOEMBRIONARIO', 'CIEGO', 'APENDICE', 'SIGMOIDE', 'RECTOSIGMOIDE', 'ANO', 'CONDUCTO ANAL'],
            '5= CAC Estómago': ['C16', 'C160', 'C161', 'C162', 'C163', 'C164', 'C165', 'C166', 'C168', 'C169', 'D002', 'GASTRICO', 'GASTRECTOMIA', 'ESOFAGOGASTRO', 'HELICOBACTER', 'ESTOMAGO', 'CARDIAS', 'FUNDUS', 'PILORO', 'CURVATURA'],
            '6= CAC Melanoma': ['C43', 'C430', 'C431', 'C432', 'C433', 'C434', 'C435', 'C436', 'C437', 'C438', 'C439', 'D03', 'D030', 'D031', 'D032', 'D033', 'D034', 'D035', 'D036', 'D037', 'D038', 'D039', 'MELANOMA', 'PIEL', 'CUTANEO', 'DERMATOLOGIA', 'LUNARES', 'LABIO', 'PARPADO', 'OREJA', 'CARA', 'CUERO CABELLUDO', 'TRONCO', 'HOMBRO', 'MIEMBRO SUPERIOR', 'MIEMBRO INFERIOR'],
            '7= CAC Pulmón': ['C33', 'C33X', 'C34', 'C340', 'C341', 'C342', 'C343', 'C348', 'C349', 'D022', 'PULMON', 'BRONCOSCOPIA', 'LOBECTOMIA', 'BRONQUIO', 'TRAQUEA', 'LOBULO SUPERIOR', 'LOBULO MEDIO', 'LOBULO INFERIOR'],
            '8= CAC Linfoma Hodgkin': ['C81', 'C810', 'C811', 'C812', 'C813', 'C817', 'C819', 'LINFOMA HODGKIN', 'PREDOMINIO LINFOCITICO', 'ESCLEROSIS NODULAR', 'CELULARIDAD MIXTA', 'DEPLECION LINFOCITICA'],
            '9= CAC Linfoma No Hodgkin': ['C82', 'C820', 'C821', 'C822', 'C827', 'C829', 'C83', 'C830', 'C831', 'C833', 'C835', 'C837', 'C838', 'C839', 'C84', 'C840', 'C841', 'C844', 'C845', 'C85', 'C850', 'C851', 'C857', 'C859', 'C96', 'LINFOMA', 'NO HODGKIN', 'FOLICULAR', 'DIFUSO', 'CELULAS GRANDES', 'BURKITT', 'MATURE', 'LINFOSARCOMA', 'RETICULOSARCOMA', 'RITUXIMAB', 'MICOSIS FUNGOIDE', 'SEZARY'],
            '10= CAC Leucemia Linfocítica Aguda': ['C910', 'LEUCEMIA LINFOCITICA AGUDA', 'LINFOBLASTICA', 'LLA'],
            '11= CAC Leucemia Mielocítica Aguda': ['C920', 'C924', 'C925', 'C930', 'C940', 'C942', 'LEUCEMIA MIELOCITICA AGUDA', 'MIELOBLASTICA', 'PROMIELOCITICA', 'MIELOMONOCITICA', 'LMA'],
            '12= Labio, cavidad bucal y faringe': ['C00', 'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C14', 'LABIO', 'BUCAL', 'FARINGE', 'LENGUA', 'ENCIA', 'PISO DE LA BOCA', 'PALADAR', 'PAROTIDA', 'AMIGDALA', 'OROFARINGE', 'NASOFARINGE', 'HIPOFARINGE'],
            '13= Otros órganos digestivos': ['C15', 'C150', 'C151', 'C152', 'C153', 'C154', 'C155', 'C158', 'C159', 'C17', 'C21', 'C22', 'C23', 'C24', 'C25', 'C26', 'ESOFAGO', 'PANCREAS', 'HIGADO', 'BILIAR', 'VESICULA', 'INTESTINO DELGADO', 'DUODENO', 'YEYUNO', 'ILEON', 'ANO', 'CONDUCTO BILIAR'],
            '14= Otros órganos respiratorios e intratorácicos': ['C30', 'C31', 'C32', 'C37', 'C38', 'C39', 'LARINGE', 'FOSAS NASALES', 'SENOS PARANASALES', 'TIMO', 'CORAZON', 'MEDIASTINO', 'PLEURA', 'GLOTIS', 'SUPRAGLOTIS', 'SUBGLOTIS'],
            '15= Huesos y cartílagos articulares': ['C40', 'C41', 'HUESO', 'CARTILAGO', 'ARTICULAR', 'OSTEOSARCOMA', 'CONDROSARCOMA', 'EWING', 'OMOPLATO', 'HUESOS LARGOS', 'COLUMNA VERTEBRAL', 'COSTILLAS', 'PELVIS'],
            '16= Otros tumores de la piel': ['C44', 'C440', 'C441', 'C442', 'C443', 'C444', 'C445', 'C446', 'C447', 'C448', 'C449', 'BASOCELULAR', 'ESCAMOCELULAR', 'CARCINOMA DE PIEL', 'BASAL', 'ESCAMOSO'],
            '17= Tejidos mesoteliales y blandos': ['C45', 'C46', 'C47', 'C48', 'C49', 'MESOTELIOMA', 'SARCOMA DE KAPOSI', 'NERVIOS PERIFERICOS', 'PERITONEO', 'TEJIDO CONJUNTIVO', 'CABEZA', 'CUELLO', 'ABDOMEN', 'PELVIS', 'GIST'],
            '18= Otros órganos genitales femeninos': ['C51', 'C52', 'C56', 'C57', 'C58', 'OVARIO', 'VULVA', 'VAGINA', 'TROPA DE FALOPIO', 'PLACENTA', 'LABIO MAYOR', 'LABIO MENOR', 'CLITORIS'],
            '19= Otros órganos genitales masculinos': ['C60', 'C62', 'C63', 'PENE', 'TESTICULO', 'EPIDIDIMO', 'CORDON ESPERMATICO', 'ESCROTO', 'PREPUCIO', 'GLANDE'],
            '20= Vías urinarias': ['C64', 'C65', 'C66', 'C67', 'C68', 'RIÑON', 'VEJIGA', 'URETER', 'PELVIS RENAL', 'URACHO', 'URETRA', 'NEFRECTOMIA'],
            '21= Ojo, encéfalo y sistema nervioso central': ['C69', 'C70', 'C71', 'C72', 'OJO', 'ENCEFALO', 'CEREBRO', 'MENINGES', 'MEDULA ESPINAL', 'NERVIOS CRANEALES', 'RETINA', 'COROIDES', 'ORBITA', 'LOBULO FRONTAL', 'LOBULO TEMPORAL', 'LOBULO PARIETAL', 'LOBULO OCCIPITAL', 'VENTRICULO', 'CEREBELO'],
            '22= Glándulas tiroides y endocrinas': ['C73', 'C73X', 'C74', 'C75', 'TIROIDES', 'SUPRARRENAL', 'ADRENAL', 'PARATIROIDES', 'HIPOFISIS', 'CRANEOFARINGEO', 'PINEAL', 'TIROIDECTOMIA', 'YODO', 'TSH'],
            '23= Sitios mal definidos / No especificados': ['C76', 'C80', 'C97', 'SITIO MAL DEFINIDO', 'NO ESPECIFICADO', 'SITIO PRIMARIO DESCONOCIDO', 'TUMORES MALIGNOS DE SITIOS MULTIPLES'],
            '24= Otros tumores tejido linfático/hematopoyético': ['C88', 'C90', 'C91', 'C92', 'C93', 'C94', 'C95', 'C96', 'C900', 'MIELOMA', 'PLASMOCITOMA', 'CELULAS PLASMATICAS', 'MASTOCITOS', 'HISTIOCITOSIS', 'MONOCITICA', 'ERITREMIA', 'MEGACARIOBLASTICA'],
            '25= Tumores secundarios': ['C77', 'C78', 'C79', 'SECUNDARIO', 'METASTASIS', 'GANGLIOS LINFATICOS SECUNDARIOS', 'RESPIRATORIOS SECUNDARIOS', 'DIGESTIVOS SECUNDARIOS']
        };



        const allRecords = await FollowUp.findAll({
            attributes: ['id', 'serviceName', 'category', 'observation']
        });

        console.log(`📊 TOTAL REGISTROS: ${allRecords.length}`);

        let updatedCount = 0;
        const transaction = await sequelize.transaction();

        try {
            for (const record of allRecords) {
                const texto = CupsController.normalizeText(record.serviceName || '');
                let newCategory = 'Oncología';
                let foundModality = false;

                // 1. Detectar Modalidad
                for (const [grupo, palabras] of Object.entries(MODALIDADES)) {
                    if (palabras.some(p => texto.includes(p))) {
                        newCategory = grupo;
                        foundModality = true;
                        break; 
                    }
                }
                
                // Fallback
                if (!foundModality) {
                    if (texto.includes('PROCEDIMIENTO') || texto.includes('DISPOSITIVO')) {
                        newCategory = 'Cirugía';
                    } else if (texto.includes('PAQUETE') || texto.includes('KIT')) {
                        newCategory = 'Estancia';
                    }
                }

                // 2. Detectar CAC
                let detectedDiagnosis = null;
                for (const [cac, palabras] of Object.entries(DIAGNOSTICOS)) {
                    if (palabras.some(p => texto.includes(p))) {
                        detectedDiagnosis = cac;
                        break;
                    }
                }

                // 3. Update
                let newObservation = record.observation || '';
                let needsUpdate = false;

                if (detectedDiagnosis && !newObservation.includes('DX SUGERIDO:')) {
                    newObservation = `${newObservation} | DX SUGERIDO: ${detectedDiagnosis}`;
                    needsUpdate = true;
                }

                const currentCategory = record.category || '';
                const isPending = !currentCategory || currentCategory === 'PENDIENTE' || currentCategory === '';
                const isLegacy = !Object.keys(MODALIDADES).includes(currentCategory);

                if (currentCategory !== newCategory || isPending || isLegacy || needsUpdate) {
                    
                    if (isLegacy && currentCategory.includes('CAC') && !newObservation.includes('COHORTE ANTERIOR')) {
                        newObservation = `${newObservation} | COHORTE ANTERIOR: ${currentCategory}`;
                    }

                    await FollowUp.update(
                        { 
                            category: newCategory,
                            observation: newObservation 
                        },
                        { where: { id: record.id }, transaction }
                    );
                    updatedCount++;
                }
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error("❌ ERROR CRÍTICO EN CLASIFICACIÓN:", error);
        }

        console.log(`✅ FIN PROCESO. REGISTROS ACTUALIZADOS: ${updatedCount}`);
        return updatedCount;
    }

    
    

    static fixLegacyCategories = async (req: Request, res: Response) => {
        try {
            const count = await CupsController.runAutoCategorization();
            return res.json({ success: true, message: `Proceso finalizado. ${count} registros actualizados.` });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    static getCups = async (req: Request, res: Response) => {
        try {
            const cups = await FollowUp.findAll({
                attributes: [
                    [sequelize.fn('DISTINCT', sequelize.col('cups')), 'codigo'],
                    [sequelize.fn('MAX', sequelize.col('serviceName')), 'descripcion'],
                    [sequelize.fn('MAX', sequelize.col('category')), 'grupo'],
                    [sequelize.fn('MAX', sequelize.col('id')), 'id'] 
                ],
                where: { cups: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
                group: ['cups'],
                order: [[sequelize.col('cups'), 'ASC']] 
            });
            res.json({ success: true, data: cups.map((c: any) => ({
                id: c.getDataValue('id'), codigo: c.getDataValue('codigo'),
                descripcion: c.getDataValue('descripcion'), grupo: c.getDataValue('grupo') || 'PENDIENTE'
            }))});
        } catch (error) { res.status(500).json({ success: false, error: 'Error loading master.' }); }
    }

    static bulkUpdate = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const { ids, grupo } = req.body;
            if (!ids || !grupo) { await t.rollback(); return res.status(400).json({ success: false }); }
            const targetRecords = await FollowUp.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['cups'], transaction: t });
            const cupsCodes = targetRecords.map(r => r.cups).filter(c => c);
            if (cupsCodes.length > 0) {
                await FollowUp.update({ category: grupo }, { where: { cups: { [Op.in]: cupsCodes } }, transaction: t });
            }
            await t.commit();
            res.json({ success: true });
        } catch (error) { await t.rollback(); res.status(500).json({ success: false }); }
    }

    static autoCategorize = async (req: Request, res: Response) => {
        try {
            const count = await CupsController.runAutoCategorization();
            res.json({ success: true, updated: count });
        } catch (error) { res.status(500).json({ success: false }); }
    }
}