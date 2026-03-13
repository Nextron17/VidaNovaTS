import { Request, Response } from 'express';
import { FollowUp } from '../models/FollowUp';
import { MasterCUP } from '../models/MasterCUP'; 
import { Op } from 'sequelize';
import { sequelize } from '../../../core/config/db';
import { CupsImportService } from '../services/CupsImportService';

export class CupsController {

    private static normalizeText(text: string): string {
        return (text || '')
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    public static async runAutoCategorization() {
        console.log("🌱 EJECUTANDO CLASIFICACIÓN V18 (JERARQUÍA EXACTA ASMET SALUD)...");
        // Evita que "Consulta de Cirugía" termine en "Cirugía".
        const REGLAS_CLASIFICACION = [
            {
                grupo: 'Consulta Externa',
                palabras: ['CONSULTA', 'VALORACION', 'INTERCONSULTA', 'JUNTA MEDICA', 'VISITA', 'ATENCION DOMICILIARIA', 'RONDA', 'TRIAGE', 'CONTROL MEDICO', 'PSICOTERAPIA', 'ACOMPAÑAMIENTO', 'SESION', 'TERAPIA FISICA', 'TERAPIA RESPIRATORIA', 'EDUCACION GRUPAL', 'ASESORIA']
            },
            {
                grupo: 'Apoyo y Soporte',
                palabras: ['HOGAR DE PASO', 'ALOJAMIENTO', 'DESAYUNO', 'ALMUERZO', 'CENA', 'ACOMPAÑANTE', 'ESTADIA POR USUARIO', 'ESTADIA POR ACOMPAÑANTE', 'TRANSPORTE', 'TRASLADO', 'AMBULANCIA', 'MOVILIZACION']
            },
            {
                grupo: 'Medicamentos',
                palabras: [' MG', ' MG/', 'MG/', ' ML', ' ML/', '/ML', 'SOL INY', 'AMPX', 'TAB -', 'LAPROFF', 'ECAR', 'CAPSULA', 'JARABE', 'SOL ORL', 'GTS ', 'GOTAS', 'TABLETA', 'AMPOLLA', 'SUSPENSION', 'SULFATO FERROSO', 'HIERRO SACARATO', 'DEXAMETASONA', 'HIDROXIUREA', 'ACIDO FOLICO', 'VITAMINA D']
            },
            {
                grupo: 'Quimioterapia',
                palabras: ['QUIMIO', 'QUYMI', 'ANTINEOPLASIC', 'BEVACIZUMAB', 'RITUXIMAB', 'TRASTUZUMAB', 'PEMBROLIZUMAB', 'CARBOPLATINO', 'CISPLATINO', 'INMUNOTERAPIA', 'CICLOFOSFAMIDA', 'FILGRASTIM', 'SALA DE QUIMIOTERAPIA']
            },
            {
                grupo: 'Radioterapia',
                palabras: ['RADIOTERAPIA', 'TELETERAPIA', 'BRAQUITERAPIA', 'ACELERADOR', 'COBALTO', 'DOSIMETRIA', 'I-131', 'YODO', 'PLANEACION', 'SIMULACION', 'RADIOCIRUGIA']
            },
            {
                grupo: 'Estancia',
                palabras: ['INTERNACION', 'HABITACION MULTIPLE', 'HABITACION INDIVIDUAL', 'ESTANCIA', 'CAMA ', 'UCI', 'UCE', 'OBSERVACION EN URGENCIAS', 'HOSPITALIZACION', 'CUIDADO INTENSIVO', 'PENSION', 'DERECHOS DE SALA', 'AISLAMIENTO GENERAL']
            },
            {
                grupo: 'Laboratorio',
                palabras: ['CARIOTIPO', 'HISTOQUIMICA', 'BACAF', 'TRANSLOCACION', 'ONCOGEN', 'MUTACION', 'REARREGLO', 'FISH', 'BCR', 'ABL', 'ERBB2', 'SECUENCIACION', 'MOLECULAR', 'GENETICO', 'HIBRIDACION', 'PCR', 'HEMOGRAMA', 'SANGRE', 'ORINA', 'UROCULTIVO', 'CULTIVO', 'ANTIBIOGRAMA', 'COLORACION', 'CITOLOGIA', 'PATOLOGIA', 'DOSIFICACION', 'RECUENTO', 'ANTICUERPOS', 'ANTIGENO', 'HORMONA', 'TITULACION', 'UROANALISIS', 'PERFIL', 'PRUEBA', 'ESTUDIO DE', 'BIOPSIA LIQUIDA']
            },
            {
                grupo: 'Imagenología',
                palabras: ['RADIOGRAFIA', 'RX ', 'MAMOGRAFIA', 'ECOGRAFIA', 'ULTRASONIDO', 'TOMOGRAFIA', 'TAC', 'RESONANCIA', 'RMN', 'PET', 'DOPPLER', 'UROGRAFIA', 'CISTOGRAFIA', 'ANGIOGRAFIA', 'FLUOROSCOPIA', 'DENSITOMETRIA', 'GAMAGRAFIA', 'GAMMAGRAFIA', 'ELECTROCARDIOGRAMA', 'ECOCARDIOGRAMA', 'ESPIROMETRIA', 'NEUROCONDUCCION', 'ELECTROMIOGRAFIA', 'NASOLARINGOSCOPIA', 'COLONOSCOPIA', 'ESOFAGOGASTRO', 'CISTOSCOPIA', 'BRONCOSCOPIA', 'ENDOSCOPIA', 'MAPA', 'HOLTER']
            },
            {
                grupo: 'Clínica del Dolor',
                palabras: ['PALIATIVO', 'ANALGESIA', 'BLOQUEO', 'INFILTRACION', 'NEUROLISIS', 'RADIOFRECUENCIA', 'ESTIMULACION']
            },
            {
                grupo: 'Cirugía',
                palabras: ['CIRUGIA', 'RESECCION', 'ECTOMIA', 'TOMIA', 'SCOPIA', 'INJERTO', 'AMPUTACION', 'VACIAMIENTO', 'CONIZACION', 'LEGRADO', 'ASPIRACION', 'EXTIRPACION', 'FULGURACION', 'CAUTERIZACION', 'ANASTOMOSIS', 'OSTEOSINTESIS', 'RECONSTRUCCION', 'REEMPLAZO', 'TRASPLANTE', 'NEFROSTOMIA', 'INSERCION', 'RETIRO', 'CATETER', 'BIOPSIA', 'SUTURA', 'PUNCION', 'PARACENTESIS', 'LAVADO', 'CURACION', 'DRENAJE', 'CRANIECTOMIA', 'CRANEOTOMIA', 'TREPANACION', 'DERIVACION', 'DUROPLASTIA', 'COLECCION']
            },
            {
                grupo: 'Oncología',
                palabras: ['ONCOLOGIA', 'CANCER', 'TUMOR', 'NEOPLASIA', 'CARCINOMA', 'SARCOMA', 'LINFOMA', 'LEUCEMIA', 'MELANOMA', 'BLASTOMA']
            }
        ];

        const DIAGNOSTICOS: Record<string, string[]> = {
            '1= CAC Mama': ['C50', 'D05', 'MAMA', 'MASTOLOGIA', 'HER-2', 'BRCA', 'CUADRANTE', 'MASTECTOMIA'],
            '2= CAC Próstata': ['C61', 'D075', 'PROSTATA', 'PSA', 'PROSTATECTOMIA'],
            '3= CAC Cérvix': ['C53', 'D06', 'CITOLOGIA', 'VPH', 'CUELLO UTERINO', 'COLPOSCOPIA', 'CERVIX'],
            '4= CAC Colorectal': ['C18', 'C19', 'C20', 'D010', 'COLON', 'RECTO', 'COLORECTAL', 'COLOSTOMIA', 'SIGMOIDE'],
            '5= CAC Estómago': ['C16', 'D002', 'GASTRICO', 'GASTRECTOMIA', 'ESOFAGOGASTRO', 'ESTOMAGO'],
            '6= CAC Melanoma': ['C43', 'D03', 'MELANOMA', 'PIEL', 'CUTANEO', 'LUNARES'],
            '7= CAC Pulmón': ['C33', 'C34', 'D022', 'PULMON', 'BRONCOSCOPIA', 'LOBECTOMIA', 'BRONQUIO'],
            '8= CAC Linfoma Hodgkin': ['C81', 'LINFOMA HODGKIN', 'ESCLEROSIS NODULAR'],
            '9= CAC Linfoma No Hodgkin': ['C82', 'C83', 'C84', 'C85', 'C96', 'LINFOMA', 'NO HODGKIN', 'FOLICULAR', 'DIFUSO'],
            '10= CAC Leucemia Linfocítica Aguda': ['C910', 'LEUCEMIA LINFOCITICA AGUDA', 'LINFOBLASTICA', 'LLA'],
            '11= CAC Leucemia Mielocítica Aguda': ['C920', 'C924', 'LEUCEMIA MIELOCITICA AGUDA', 'MIELOBLASTICA', 'LMA'],
            '12= Labio, cavidad bucal y faringe': ['C0', 'C10', 'C11', 'C12', 'C13', 'C14', 'LABIO', 'BUCAL', 'FARINGE', 'LENGUA'],
            '13= Otros órganos digestivos': ['C15', 'C17', 'C21', 'C22', 'C23', 'C24', 'ESOFAGO', 'PANCREAS', 'HIGADO', 'BILIAR'],
            '14= Otros órganos respiratorios e intratorácicos': ['C30', 'C31', 'C32', 'C37', 'LARINGE', 'FOSAS NASALES'],
            '15= Huesos y cartílagos articulares': ['C40', 'C41', 'HUESO', 'CARTILAGO', 'OSTEOSARCOMA'],
            '16= Otros tumores de la piel': ['C44', 'BASOCELULAR', 'ESCAMOCELULAR', 'CARCINOMA DE PIEL'],
            '17= Tejidos mesoteliales y blandos': ['C45', 'C46', 'C47', 'C48', 'C49', 'MESOTELIOMA', 'SARCOMA DE KAPOSI'],
            '18= Otros órganos genitales femeninos': ['C51', 'C52', 'C56', 'OVARIO', 'VULVA', 'VAGINA'],
            '19= Otros órganos genitales masculinos': ['C60', 'C62', 'C63', 'PENE', 'TESTICULO', 'ESCROTO'],
            '20= Vías urinarias': ['C64', 'C65', 'C66', 'C67', 'C68', 'RIÑON', 'VEJIGA', 'URETER'],
            '21= Ojo, encéfalo y sistema nervioso central': ['C69', 'C70', 'C71', 'C72', 'OJO', 'ENCEFALO', 'CEREBRO', 'MENINGES'],
            '22= Glándulas tiroides y endocrinas': ['C73', 'C74', 'C75', 'TIROIDES', 'SUPRARRENAL', 'HIPOFISIS'],
            '23= Sitios mal definidos / No especificados': ['C76', 'C80', 'C97', 'SITIO MAL DEFINIDO', 'METASTASIS DESCONOCIDA'],
            '24= Otros tumores tejido linfático/hematopoyético': ['C88', 'C90', 'MIELOMA', 'PLASMOCITOMA'],
            '25= Tumores secundarios': ['C77', 'C78', 'C79', 'SECUNDARIO', 'METASTASIS']
        };

        let updatedCount = 0;

        // 🚀 PASO 1: CLASIFICAR EL DICCIONARIO (MASTERCUP)
        const pendingDictionary = await MasterCUP.findAll({
            where: { grupo: 'PENDIENTE' }
        });

        for (const dictRecord of pendingDictionary) {
            const texto = CupsController.normalizeText(dictRecord.descripcion || '');
            let newCategory = 'Otros'; 
            
            // Evaluamos en estricto orden
            for (const regla of REGLAS_CLASIFICACION) {
                if (regla.palabras.some(p => texto.includes(p))) {
                    newCategory = regla.grupo;
                    break; 
                }
            }
            await dictRecord.update({ grupo: newCategory });
        }
        console.log(`✅ DICCIONARIO ACTUALIZADO: ${pendingDictionary.length} códigos clasificados.`);

        // 🚀 PASO 2: CLASIFICAR LAS CITAS DE LOS PACIENTES (FOLLOWUP)
        const recordsToCategorize = await FollowUp.findAll({
            attributes: ['id', 'serviceName', 'category', 'observation'],
            where: {
                [Op.or]: [
                    { category: null },
                    { category: '' },
                    { category: 'PENDIENTE' },
                    { category: { [Op.iLike]: '%CAC%' } } 
                ]
            }
        });

        if (recordsToCategorize.length > 0) {
            const transaction = await sequelize.transaction();
            try {
                for (const record of recordsToCategorize) {
                    const texto = CupsController.normalizeText(record.serviceName || '');
                    let newCategory = 'Oncología';
                    let foundModality = false;

                    // Evaluamos en estricto orden
                    for (const regla of REGLAS_CLASIFICACION) {
                        if (regla.palabras.some(p => texto.includes(p))) {
                            newCategory = regla.grupo;
                            foundModality = true;
                            break; 
                        }
                    }
                    
                    // Fallback
                    if (!foundModality) {
                        if (texto.includes('PROCEDIMIENTO') || texto.includes('DISPOSITIVO') || texto.includes('TUTOR') || texto.includes('PLACA') || texto.includes('TORNILLO')) {
                            newCategory = 'Cirugía';
                        } else if (texto.includes('PAQUETE') || texto.includes('KIT')) {
                            newCategory = 'Estancia';
                        } else {
                            newCategory = 'Otros';
                        }
                    }

                    // Detectar Diagnóstico CAC en el servicio
                    let detectedDiagnosis = null;
                    for (const [cac, palabras] of Object.entries(DIAGNOSTICOS)) {
                        if (palabras.some(p => texto.includes(p))) {
                            detectedDiagnosis = cac;
                            break;
                        }
                    }

                    // Preparar Observación
                    let newObservation = record.observation || '';
                    let needsUpdate = false;

                    if (detectedDiagnosis && !newObservation.includes('DX SUGERIDO:')) {
                        newObservation = `${newObservation} | DX SUGERIDO: ${detectedDiagnosis}`;
                        needsUpdate = true;
                    }

                    const currentCategory = record.category || '';
                    const isPending = !currentCategory || currentCategory === 'PENDIENTE' || currentCategory === '';
                    const isLegacy = currentCategory.includes('CAC');

                    if (isPending || isLegacy) {
                        if (isLegacy && !newObservation.includes('COHORTE ANTERIOR')) {
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
                    else if (needsUpdate) {
                        await FollowUp.update(
                            { observation: newObservation },
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
        }

        console.log(`✅ FIN PROCESO. PACIENTES ACTUALIZADOS: ${updatedCount}`);
        return updatedCount + pendingDictionary.length;
    }

    static fixLegacyCategories = async (req: Request, res: Response) => {
        try {
            const count = await CupsController.runAutoCategorization();
            return res.json({ success: true, message: `Proceso finalizado. ${count} registros actualizados.` });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // 🚀 LECTURA DESDE EL DICCIONARIO OFICIAL MASTERCUP
    static getCups = async (req: Request, res: Response) => {
        try {
            const cups = await MasterCUP.findAll({
                order: [['codigo', 'ASC']] 
            });
            res.json({ 
                success: true, 
                data: cups.map((c: any) => ({
                    id: c.id, 
                    codigo: c.codigo,
                    descripcion: c.descripcion, 
                    grupo: c.grupo || 'PENDIENTE'
                }))
            });
        } catch (error) { 
            console.error("Error al cargar diccionario:", error);
            res.status(500).json({ success: false, error: 'Error loading master.' }); 
        }
    }

    // 🚀 ACTUALIZACIÓN MASIVA EN DICCIONARIO Y PACIENTES
    static bulkUpdate = async (req: Request, res: Response) => {
        const t = await sequelize.transaction();
        try {
            const { ids, grupo } = req.body;
            if (!ids || !grupo) { await t.rollback(); return res.status(400).json({ success: false }); }
            
            // 1. Actualizar el Diccionario
            await MasterCUP.update({ grupo }, { where: { id: { [Op.in]: ids } }, transaction: t });

            // 2. Obtener los códigos afectados
            const targetCups = await MasterCUP.findAll({ where: { id: { [Op.in]: ids } }, transaction: t });
            const cupsCodes = targetCups.map(c => c.codigo);

            // 3. Replicar la categoría en las citas de los pacientes
            if (cupsCodes.length > 0) {
                await FollowUp.update({ category: grupo }, { where: { cups: { [Op.in]: cupsCodes } }, transaction: t });
            }
            
            await t.commit();
            res.json({ success: true });
        } catch (error) { 
            await t.rollback(); 
            console.error("Error en bulkUpdate CUPS:", error);
            res.status(500).json({ success: false }); 
        }
    }

    static autoCategorize = async (req: Request, res: Response) => {
        try {
            const count = await CupsController.runAutoCategorization();
            res.json({ success: true, updated: count });
        } catch (error) { res.status(500).json({ success: false }); }
    }

    static importCupsFile = async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'Falta el archivo.' });
            }
            
            const result = await CupsImportService.processCupsExcel(req.file.buffer);
            res.json({ success: true, message: `Se importaron ${result.totalProcessed} códigos exitosamente.` });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}