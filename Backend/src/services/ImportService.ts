import * as XLSX from 'xlsx';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import { sequelize } from '../config/db';
import { CupsController } from '../controllers/CupsController';

export class ImportService {

    // =================================================================
    // 1. HELPERS DE LIMPIEZA Y NORMALIZACIÓN (NIVEL EXPERTO)
    // =================================================================

    private static parseDocType(raw: any): string {
        const t = String(raw || '').toUpperCase().trim();
        if (!t) return 'CC'; 
        if (t.includes('CIUDADANIA') || t === 'CC' || t === 'C.C') return 'CC';
        if (t.includes('TARJETA') || t.includes('IDENTIDAD') || t === 'TI' || t === 'T.I') return 'TI';
        if (t.includes('EXTRANJERIA') || t === 'CE' || t === 'C.E') return 'CE';
        if (t.includes('REGISTRO') || t.includes('CIVIL') || t === 'RC') return 'RC';
        if (t.includes('PASAPORTE') || t === 'PA' || t === 'PP') return 'PA';
        if (t.includes('PROTECCION') || t.includes('PPT') || t.includes('TEMPORAL')) return 'PPT';
        if (t.includes('PERMISO') || t.includes('ESPECIAL') || t.includes('PEP')) return 'PE';
        if (t.includes('NIT')) return 'NIT';
        return t.length <= 3 ? t : 'CC';
    }

    private static isGarbageID(id: string): boolean {
        if (!id) return true;
        const text = String(id).toUpperCase().replace(/\s/g, ''); 
        const forbiddenWords = [
            'CEDULA', 'TARJETA', 'REGISTRO', 'CIVIL', 'NACIMIENTO', 'IDENTIDAD',
            'PERMISO', 'ESPECIAL', 'PERMANENCIA', 'PEP', 'PASAPORTE', 'ADULTO',
            'MENOR', 'IDENTIFICACION', 'EXTRANJERIA', 'SALVOCONDUCTO', 'NUMERO', 
            'NOTA', 'DOCUMENTO', 'PACIENTE', 'AFILIADO', 'TIPO', 'NOMBRE', 'FECHA',
            'TOTAL', 'SUBTOTAL', 'PAGINA', 'HOJA'
        ];
        if (forbiddenWords.some(word => text.includes(word))) return true;
        
        const letterCount = text.replace(/[^A-Z]/g, '').length;
        const numberCount = text.replace(/[^0-9]/g, '').length;
        
        if (numberCount === 0) return true; 
        if (letterCount > 3 && letterCount > numberCount) return true; // Más letras que números = Basura
        return false;
    }

    private static cleanText(val: any): string {
        if (!val) return '';
        let str = String(val).trim();
        if (str.startsWith('"') && str.endsWith('"')) str = str.slice(1, -1);
        str = str.replace(/(\r\n|\n|\r)/gm, " "); // Quitar saltos de línea
        str = str.replace(/\s\s+/g, ' '); // Quitar dobles espacios
        return str.toUpperCase();
    }

    private static normalizeHeader(text: string): string {
        if (!text) return '';
        return String(text).trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-z0-9]/g, '_'); 
    }

    private static cleanPhone(val: any): string {
        if (!val) return '';
        let str = String(val).replace(/[:/;,]/g, '|'); 
        const parts = str.split('|');
        const validNumbers: string[] = [];
        for (let part of parts) {
            let num = part.replace(/[^0-9]/g, '');
            if (num.startsWith('57') && num.length >= 12) num = num.substring(2); 
            if (part.includes('E+')) num = ''; 
            if (num.length >= 7 && !validNumbers.includes(num)) validNumbers.push(num);
        }
        return validNumbers.join(' / ');
    }

    private static calculateBirthDate(age: any): Date | null {
        if (!age) return null;
        const cleanAge = String(age).replace(/[^0-9]/g, '');
        const ageNum = Number(cleanAge);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) return null;
        const year = new Date().getFullYear() - ageNum;
        return new Date(`${year}-01-01`);
    }

    private static parseDate(val: any): Date | null {
        if (!val) return null;
        let date: Date | null = null;
        try {
            if (typeof val === 'number' && val > 20000 && val < 60000) {
                date = new Date(Math.round((val - 25569) * 86400 * 1000) + (5 * 3600 * 1000));
            } else {
                let str = String(val).trim().replace(/"/g, '');
                if (str.includes(':') || str.includes('T')) {
                    const tryDate = new Date(str);
                    if (!isNaN(tryDate.getTime())) return tryDate;
                }
                if (str.includes(' ')) str = str.split(' ')[0]; 
                str = str.replace(/-/g, '/'); 
                const parts = str.split('/');
                if (parts.length === 3) {
                    const p0 = parseInt(parts[0]);
                    const p1 = parseInt(parts[1]);
                    const p2 = parseInt(parts[2]);
                    if (parts[0].length === 4) date = new Date(p0, p1 - 1, p2); 
                    else if (parts[2].length === 4) date = new Date(p2, p1 - 1, p0);
                }
            }
            // Validar fechas futuras irreales (ej: año 2900) o muy pasadas (año 1900 para una cita)
            if (date && !isNaN(date.getTime())) {
                if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return null;
                return date;
            }
        } catch (e) { return null; }
        return null;
    }

    // =================================================================
    // 2. MOTOR DE DIAGNÓSTICOS HÍBRIDO (CIE-10 + TEXTO)
    // =================================================================
    
    // Método principal: Busca por código CIE-10
    private static getCohortFromCie10(code: any): string | null {
        if (!code) return null;
        const c = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (c.startsWith('C50') || c.startsWith('D05')) return '1= CAC Mama';
        if (c.startsWith('C61') || c.startsWith('D075')) return '2= CAC Próstata';
        if (c.startsWith('C53') || c.startsWith('D06') || c.startsWith('N87') || c.startsWith('C54') || c.startsWith('C55')) return '3= CAC Cérvix';
        if (c.startsWith('C18') || c.startsWith('C19') || c.startsWith('C20') || c.startsWith('D010') || c.startsWith('D011') || c.startsWith('D012')) return '4= CAC Colorectal';
        if (c.startsWith('C16') || c.startsWith('D002')) return '5= CAC Estómago';
        if (c.startsWith('C43') || c.startsWith('D03')) return '6= CAC Melanoma';
        if (c.startsWith('C33') || c.startsWith('C34') || c.startsWith('D022')) return '7= CAC Pulmón';
        if (c.startsWith('C81')) return '8= CAC Linfoma Hodgkin';
        if (c.startsWith('C82') || c.startsWith('C83') || c.startsWith('C84') || c.startsWith('C85') || c.startsWith('C96')) return '9= CAC Linfoma No Hodgkin';
        if (c.startsWith('C910')) return '10= CAC Leucemia Linfocítica Aguda';
        if (c.startsWith('C920')) return '11= CAC Leucemia Mielocítica Aguda';
        if (c.startsWith('C0') || c.startsWith('C10') || c.startsWith('C11') || c.startsWith('C12') || c.startsWith('C13') || c.startsWith('C14')) return '12= Labio, cavidad bucal y faringe';
        if (c.startsWith('C15') || c.startsWith('C17') || c.startsWith('C21') || c.startsWith('C22') || c.startsWith('C23') || c.startsWith('C24') || c.startsWith('C25') || c.startsWith('C26')) return '13= Otros órganos digestivos';
        if (c.startsWith('C30') || c.startsWith('C31') || c.startsWith('C32') || c.startsWith('C37') || c.startsWith('C38') || c.startsWith('C39')) return '14= Otros órganos respiratorios e intratorácicos';
        if (c.startsWith('C40') || c.startsWith('C41')) return '15= Huesos y cartílagos articulares';
        if (c.startsWith('C44')) return '16= Otros tumores de la piel';
        if (c.startsWith('C45') || c.startsWith('C46') || c.startsWith('C47') || c.startsWith('C48') || c.startsWith('C49')) return '17= Tejidos mesoteliales y blandos';
        if (c.startsWith('C51') || c.startsWith('C52') || c.startsWith('C56') || c.startsWith('C57') || c.startsWith('C58')) return '18= Otros órganos genitales femeninos';
        if (c.startsWith('C60') || c.startsWith('C62') || c.startsWith('C63')) return '19= Otros órganos genitales masculinos';
        if (c.startsWith('C64') || c.startsWith('C65') || c.startsWith('C66') || c.startsWith('C67') || c.startsWith('C68')) return '20= Vías urinarias (Riñón/Vejiga)';
        if (c.startsWith('C69') || c.startsWith('C70') || c.startsWith('C71') || c.startsWith('C72')) return '21= Ojo, encéfalo y sistema nervioso central';
        if (c.startsWith('C73') || c.startsWith('C74') || c.startsWith('C75')) return '22= Glándulas tiroides y endocrinas';
        if (c.startsWith('C76') || c.startsWith('C80') || c.startsWith('C97')) return '23= Sitios mal definidos / No especificados';
        if (c.startsWith('C86') || c.startsWith('C88') || c.startsWith('C90') || c.startsWith('C91') || c.startsWith('C92') || c.startsWith('C93') || c.startsWith('C94') || c.startsWith('C95')) return '24= Otros tumores tejido linfático/hematopoyético';
        if (c.startsWith('C77') || c.startsWith('C78') || c.startsWith('C79')) return '25= Tumores secundarios';

        return null;
    }

    // Método de Respaldo: Busca por descripción de texto (Futuro-Proof)
    private static getCohortFromText(text: string): string | null {
        if (!text) return null;
        const t = text.toUpperCase();
        
        if (t.includes('MAMA') || t.includes('SENO')) return '1= CAC Mama';
        if (t.includes('PROSTATA')) return '2= CAC Próstata';
        if (t.includes('CERVIX') || t.includes('CUELLO UTERINO')) return '3= CAC Cérvix';
        if (t.includes('COLON') || t.includes('RECTO') || t.includes('ANAL')) return '4= CAC Colorectal';
        if (t.includes('ESTOMAGO') || t.includes('GASTRIC')) return '5= CAC Estómago';
        if (t.includes('PIEL') || t.includes('MELANOMA')) return '6= CAC Melanoma';
        if (t.includes('PULMON') || t.includes('BRONQUI')) return '7= CAC Pulmón';
        if (t.includes('TIROIDES')) return '22= Glándulas tiroides y endocrinas';
        if (t.includes('LEUCEMIA')) return '10= CAC Leucemia Linfocítica Aguda'; // Default aproximado
        if (t.includes('LINFOMA')) return '8= CAC Linfoma Hodgkin'; // Default aproximado
        
        return null;
    }

    // =================================================================
    // 3. LECTOR CSV MANUAL (FALLBACK)
    // =================================================================
    // ... (Se mantiene el lector manual por si acaso falla la librería XLSX)
    private static splitCSVRow(row: string, delimiter: string = ';'): string[] {
        const matches = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') inQuotes = !inQuotes; 
            else if (char === delimiter && !inQuotes) { matches.push(current); current = ''; } 
            else current += char;
        }
        matches.push(current); 
        return matches;
    }

    private static parseManualCSV(buffer: Buffer): any[] {
        console.log("⚠️ Activando Lector Manual CSV Avanzado...");
        const text = buffer.toString('binary'); 
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return [];

        let headerIndex = -1;
        for (let i = 0; i < Math.min(50, lines.length); i++) {
            const lineNorm = this.normalizeHeader(lines[i]);
            if (
                (lineNorm.includes('numero') && lineNorm.includes('identi')) || 
                lineNorm.includes('cedula') || 
                lineNorm.includes('tipo_de_nota') ||
                lineNorm.includes('estado_de_la_solicitud')
            ) {
                headerIndex = i; break;
            }
        }
        if (headerIndex === -1) return [];

        const headerLine = lines[headerIndex];
        const delimiter = headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';
        const headers = this.splitCSVRow(headerLine, delimiter).map(h => this.normalizeHeader(this.cleanText(h)));

        const data = [];
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = this.splitCSVRow(line, delimiter);
            if (values.length < headers.length * 0.3) continue; 
            const row: any = {};
            headers.forEach((h, index) => { row[h] = values[index] ? this.cleanText(values[index]) : ''; });
            data.push(row);
        }
        return data;
    }

    // =================================================================
    // 4. PROCESO PRINCIPAL: CARGA MASIVA MULTI-HOJA
    // =================================================================

    static async processPatientExcel(buffer: Buffer) {
        try {
            console.log("📂 INICIANDO IMPORTACIÓN DEFINITIVA (FUTURE-PROOF)...");

            const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
            
            let pCreated = 0, pUpdated = 0, fCreated = 0, errors = 0;
            let totalSheetsProcessed = 0;

            for (const sheetName of workbook.SheetNames) {
                console.log(`📄 Analizando hoja: "${sheetName}"`);
                
                if (['VALIDACIONES', 'DINAMICA', 'HOJA1', 'RESUMEN', 'LOG', 'REPORTE', 'TABLA'].some(k => sheetName.toUpperCase().includes(k))) {
                    console.log(`⏭️ Saltando hoja irrelevante.`);
                    continue;
                }

                const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
                if (rawData.length === 0) continue;

                const firstRow: any = rawData[0];
                const keys = Object.keys(firstRow).map(k => ImportService.normalizeHeader(k));
                const hasId = keys.some(k => k.includes('identificacion') || k.includes('cedula') || k.includes('documento'));
                
                if (!hasId) {
                    console.log(`⚠️ Hoja "${sheetName}" no tiene columnas de identificación. Omitiendo.`);
                    continue;
                }

                totalSheetsProcessed++;

                // MAPEO EXTENDIDO (Future-Proof: Cubre cualquier nombre de columna posible)
                const mapKeys: Record<string, string[]> = {
                    'tipo_doc': ['tipo_de_identificacion', 'tipo_identificacion', 'tipo_documento', 'tipo_id', 'td'],
                    'doc': ['numero_de_identificacion', 'num_identificacion', 'numero_identificacion', 'cedula', 'documento', 'identificacion', 'numero_documento', 'id_paciente'],
                    'nom1': ['nombre_1', 'primer_nombre', 'nombres', 'nombre'],
                    'nom2': ['nombre_2', 'segundo_nombre'],
                    'ape1': ['apellido_1', 'primer_apellido', 'apellidos', 'apellido'],
                    'ape2': ['apellido_2', 'segundo_apellido'],
                    'tel': ['telefonos', 'telefono', 'celular', 'movil', 'contacto', 'tel'],
                    'email': ['correos', 'correo', 'email', 'e-mail'],
                    'eps': ['entidad', 'aseguradora', 'eps', 'prestador', 'provee', 'pagador'], 
                    'edad': ['edad', 'anos'],
                    'genero': ['genero', 'sexo'],
                    'ciudad': ['ciudad', 'municipio', 'residencia', 'procedencia'],
                    'depto': ['departamento'],
                    
                    'fecha_aten': ['fecha_de_atencion', 'fecha_atencion', 'fecha_solicitud', 'fecha_servicio', 'fecha_ingreso', 'servicios_solicitados', 'fecha_de_captacion', 'fecha_captacion', 'fecha_orden'],
                    'fecha_cita': ['fecha_de_la_cita', 'fecha_cita', 'fecha_programada', 'con_cita_programada', 'fecha_asignada'],
                    
                    'cups': ['cups', 'codigo', 'codigo_procedimiento', 'cod_cups'],
                    'servicio': ['servicio', 'descripcion', 'procedimiento', 'nombre_del_procedimiento', 'servicios_solicitados', 'examen'],
                    'cie10': ['codigo_diagnostico', 'cie10', 'dx', 'diagnostico_principal', 'codigo_dx'], 
                    'desc_dx': ['diagnostico', 'descripcion_diagnostico', 'nombre_dx'], // Nuevo para respaldo por texto
                    
                    // 🔥 SÚPER ESTADOS
                    'estado_general': [
                        'estado_de_la_solicitud', 'estado_solicitud', 'estado_cita', 'estado_de_la_cita', 
                        'estado', 'situacion', 'solicitud', 'estado_asistencial', 'estado_administrativo', 'estado_autorizacion'
                    ],
                    
                    'nota_realizada': ['nota_realizada', 'numero_nota_realizada', 'nota_factura', 'numero_factura'], 
                    'obs': ['observacion', 'nota', 'descripcion', 'observaciones', 'comentario', 'detalle'],
                    'barrera': ['barrera', 'motivo_no_gestion'],
                    'responsable': ['responsable_1', 'responsable_2', 'usuario_responsable', 'gestor'],
                    'tipo_caso': ['tipo_de_caso', 'tipo_caso', 'clasificacion_caso']
                };

                for (const row of rawData as any[]) {
                    const t = await sequelize.transaction();

                    try {
                        const getVal = (key: string) => {
                            const normalizedRow = Object.keys(row).reduce((acc, k) => { 
                                acc[ImportService.normalizeHeader(k)] = row[k]; return acc; 
                            }, {} as any);
                            for (const alias of mapKeys[key]) {
                                const foundKey = Object.keys(normalizedRow).find(k => k.includes(alias));
                                if (key === 'doc' && foundKey && foundKey.includes('tipo')) continue; 
                                if (foundKey) return normalizedRow[foundKey];
                            }
                            return '';
                        };

                        const rawDoc = getVal('doc');
                        if (!rawDoc) { await t.commit(); continue; } 
                        const docClean = String(rawDoc).replace(/[^a-zA-Z0-9]/g, '');
                        if (ImportService.isGarbageID(docClean)) { await t.commit(); continue; } 

                        // 1. Datos Paciente
                        const fullNom1 = ImportService.cleanText(getVal('nom1'));
                        const fullNom2 = ImportService.cleanText(getVal('nom2'));
                        const fullApe1 = ImportService.cleanText(getVal('ape1'));
                        const fullApe2 = ImportService.cleanText(getVal('ape2'));
                        let firstName = `${fullNom1} ${fullNom2}`.trim() || 'PACIENTE';
                        let lastName = `${fullApe1} ${fullApe2}`.trim() || 'IMPORTADO';
                        const phoneClean = ImportService.cleanPhone(getVal('tel'));
                        const epsClean = ImportService.cleanText(getVal('eps'));
                        const birthDateSafe = ImportService.calculateBirthDate(getVal('edad'));
                        const rawType = getVal('tipo_doc');
                        const finalDocType = ImportService.parseDocType(rawType);

                        // 2. Fechas
                        let dRequest = ImportService.parseDate(getVal('fecha_aten'));
                        if (!dRequest) dRequest = new Date(); 
                        let dAppoint = ImportService.parseDate(getVal('fecha_cita'));

                        // 3. Lógica de Estados Definitiva (Incluye Comodines)
                        const rawStatus = ImportService.cleanText(getVal('estado_general')); 
                        const notaRealizada = ImportService.cleanText(getVal('nota_realizada')); 
                        
                        let status = 'PENDIENTE'; // Default (Naranja)

                        // >>> ESTADO: CANCELADO (Rojo)
                        if (
                            rawStatus.includes('CANCEL') || 
                            rawStatus.includes('NO ASISTE') || 
                            rawStatus.includes('FALLID') ||
                            rawStatus.includes('FALLEC') ||
                            rawStatus.includes('NO ACEPTA') ||
                            rawStatus.includes('INASIST') ||
                            rawStatus.includes('DESIST') ||
                            rawStatus.includes('RECHAZ') ||
                            rawStatus.includes('ANULAD')
                        ) {
                            status = 'CANCELADO';
                        } 
                        // >>> ESTADO: REALIZADO (Verde)
                        else if (
                            (notaRealizada.length > 2 && !notaRealizada.includes('NO')) || 
                            rawStatus.includes('REALIZAD') || 
                            rawStatus.includes('CUMPLID') || 
                            rawStatus.includes('ATENDID') || 
                            rawStatus.includes('FACTURA') ||
                            rawStatus.includes('CERRAD') ||
                            rawStatus.includes('ENTREGAD') ||
                            rawStatus.includes('EJECUTAD') ||
                            rawStatus.includes('FINALIZAD') ||
                            rawStatus.includes('TERMINAD') ||
                            rawStatus.includes('TOMAD') || 
                            rawStatus.includes('LEID') ||
                            rawStatus.includes('RESULTADO')
                        ) {
                            status = 'REALIZADO';
                        } 
                        // >>> ESTADO: AGENDADO (Azul)
                        else if (
                            rawStatus.includes('ASIGNA') || 
                            rawStatus.includes('PROGRAMA') || 
                            rawStatus.includes('AGENDA') || 
                            rawStatus.includes('CITA') ||
                            (dAppoint && dAppoint > new Date()) 
                        ) {
                            status = 'AGENDADO';
                        } 
                        // >>> ESTADO: EN GESTIÓN (Amarillo) - Aquí entra todo lo que no es vacío
                        else if (
                            rawStatus.includes('TRAMITE') || 
                            rawStatus.includes('GESTION') || 
                            rawStatus.includes('AUTORI') ||
                            rawStatus.includes('PROCESO') ||
                            rawStatus.includes('ESPERA') ||
                            rawStatus.includes('REQUERIMIENTO') ||
                            rawStatus.includes('SOLICITADO') || // <--- Lo mueve de Pendiente a Gestión
                            rawStatus.includes('ENVIAD') ||
                            rawStatus.includes('RADICAD') ||
                            rawStatus.includes('DIFERIDO') || // Comodín nuevo
                            rawStatus.includes('AVAL') || // Comodín nuevo
                            rawStatus.includes('CAMBIO DE ORDEN') // Comodín nuevo
                        ) {
                            status = 'EN_GESTION';
                        }

                        // Auto-cierre
                        if (dAppoint && dAppoint < new Date() && status === 'AGENDADO') { status = 'REALIZADO'; }
                        if (status === 'REALIZADO' && !dAppoint) { dAppoint = dRequest; }

                        // 4. Metadata Completa
                        const obsBase = ImportService.cleanText(getVal('obs'));
                        const barrera = ImportService.cleanText(getVal('barrera'));
                        const resp = ImportService.cleanText(getVal('responsable'));
                        const tipoCaso = ImportService.cleanText(getVal('tipo_caso'));
                        const cie10Code = ImportService.cleanText(getVal('cie10'));
                        const descDx = ImportService.cleanText(getVal('desc_dx')); // Descripción textual del DX
                        
                        let fullObs = obsBase;
                        if (barrera && barrera !== 'NO') fullObs += ` | BARRERA: ${barrera}`;
                        if (tipoCaso) fullObs += ` | TIPO: ${tipoCaso}`;
                        if (resp) fullObs += ` | GESTOR: ${resp}`;
                        if (cie10Code) fullObs += ` | DX: ${cie10Code}`;
                        if (rawStatus && rawStatus !== status) fullObs += ` | ESTADO ORIGINAL: ${rawStatus}`;

                        // 5. Guardar Paciente
                        let patient = await Patient.findOne({ where: { documentNumber: docClean }, transaction: t });
                        if (!patient) {
                            patient = await Patient.create({
                                documentType: finalDocType, documentNumber: docClean, firstName, lastName, phone: phoneClean,
                                insurance: epsClean, city: ImportService.cleanText(getVal('ciudad')),
                                department: ImportService.cleanText(getVal('depto')), gender: ImportService.cleanText(getVal('genero')),
                                birthDate: birthDateSafe, status: 'ACTIVO'
                            }, { transaction: t });
                            pCreated++;
                        } else {
                            // Actualización mínima para no romper datos
                            let changed = false;
                            if (phoneClean.length > 5 && patient.phone !== phoneClean) { patient.phone = phoneClean; changed = true; }
                            if (changed) { await patient.save({ transaction: t }); pUpdated++; }
                        }

                        // 6. Guardar Seguimiento
                        const service = ImportService.cleanText(getVal('servicio'));
                        const cups = ImportService.cleanText(getVal('cups'));
                        
                        // Categoría Híbrida: Intenta CIE-10, si no, intenta TEXTO (Backup)
                        let category = ImportService.getCohortFromCie10(cie10Code); 
                        if (!category) {
                            category = ImportService.getCohortFromText(descDx); // Intento por nombre del diagnóstico
                        }
                        if (!category) {
                            if (service.includes('CONSULTA')) category = 'CONSULTA';
                            else category = 'PENDIENTE';
                        }
                        
                        // Crear registro si hay datos mínimos
                        if (cups || service || status === 'REALIZADO' || cie10Code || status === 'EN_GESTION') {
                            const exists = await FollowUp.findOne({
                                where: { 
                                    patientId: patient.id, 
                                    serviceName: service.substring(0, 255), 
                                    dateRequest: dRequest 
                                },
                                transaction: t
                            });
                            
                            if (!exists) {
                                await FollowUp.create({
                                    patientId: patient.id, dateRequest: dRequest, dateAppointment: dAppoint, 
                                    status, cups: cups.substring(0, 20),
                                    serviceName: service.substring(0, 255) || 'SERVICIO IMPORTADO',
                                    eps: epsClean, observation: fullObs, 
                                    category
                                }, { transaction: t });
                                fCreated++;
                            } else {
                                // Lógica de actualización inteligente
                                let updateData: any = {};
                                
                                // Si mejoramos la categoría
                                if ((!exists.category || exists.category === 'PENDIENTE') && category !== 'PENDIENTE') {
                                    updateData.category = category;
                                }
                                
                                // Si avanzamos de estado (Pendiente -> Gestión -> Agendado -> Realizado)
                                const statusPriority: Record<string, number> = { 'PENDIENTE': 0, 'EN_GESTION': 1, 'AGENDADO': 2, 'REALIZADO': 3, 'CANCELADO': 4 };
                                const currentP = statusPriority[exists.status || 'PENDIENTE'] || 0;
                                const newP = statusPriority[status] || 0;

                                // Solo actualizamos si el nuevo estado es "mayor" o si es una corrección importante
                                if (newP > currentP) {
                                    updateData.status = status;
                                    if (dAppoint) updateData.dateAppointment = dAppoint;
                                }

                                if (Object.keys(updateData).length > 0) {
                                    await exists.update(updateData, { transaction: t });
                                }
                            }
                        }
                        await t.commit();
                    } catch (e) { 
                        await t.rollback();
                        errors++;
                    }
                }
            }

            console.log(`✅ IMPORTACIÓN COMPLETADA: Hojas:${totalSheetsProcessed} | Nuevos:${pCreated} | Upd:${pUpdated} | Citas:${fCreated}`);
            
            await CupsController.runAutoCategorization();

            return { success: true, createdPatients: pCreated, updatedPatients: pUpdated, createdFollowUps: fCreated, errors };

        } catch (error: any) { 
            console.error("❌ ERROR CRÍTICO EN IMPORTACIÓN:", error);
            throw new Error(String(error));
        }
    }
}