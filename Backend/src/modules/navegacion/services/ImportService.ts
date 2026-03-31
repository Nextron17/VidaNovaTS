import * as XLSX from 'xlsx';
import xss from 'xss';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import { MasterCUP } from '../models/MasterCUP'; 
import { sequelize } from '../../../core/config/db';
import { CupsController } from '../controllers/CupsController';

export class ImportService {

    // 1. HELPERS DE LIMPIEZA Y NORMALIZACIÓN 

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
        if (numberCount >= 5) return false;
        if (letterCount > 3 && letterCount > numberCount) return true;
        
        return false;
    }

    private static cleanText(val: any): string {
        if (!val) return '';
        let str = String(val).trim();
        
        // 🛡️ XSS Protection
        str = xss(str); 

        str = str.replace(/(\r\n|\n|\r)/gm, " // "); 
        str = str.replace(/\s\s+/g, ' '); 
        
        if (str.startsWith('"') && str.endsWith('"')) str = str.slice(1, -1);
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
                return new Date(Math.round((val - 25569) * 86400 * 1000) + (5 * 3600 * 1000));
            } 
            
            let str = String(val).trim().replace(/"/g, '');
            const datePart = str.split(' ')[0]; 
            const normalizedDatePart = datePart.replace(/-/g, '/');
            const parts = normalizedDatePart.split('/');
            
            if (parts.length === 3) {
                const p0 = parseInt(parts[0], 10);
                const p1 = parseInt(parts[1], 10);
                const p2 = parseInt(parts[2], 10);
                
                if (parts[0].length === 4) {
                    date = new Date(p0, p1 - 1, p2); 
                } else if (parts[2].length === 4) {
                    date = new Date(p2, p1 - 1, p0); 
                }
            } else if (str.includes('T')) {
                date = new Date(str);
            }

            if (date && !isNaN(date.getTime())) {
                if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return null;
                return date;
            }
        } catch (e) { 
            return null; 
        }
        return null;
    }

    // 2. MOTOR DE DIAGNÓSTICOS HÍBRIDO
    
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
        if (t.includes('LEUCEMIA')) return '10= CAC Leucemia Linfocítica Aguda';
        if (t.includes('LINFOMA')) return '8= CAC Linfoma Hodgkin';
        
        return null;
    }

    // 🚀 NUEVO: MOTOR LECTOR DE BARRERAS
    private static detectBarrierFromText(text: string): string | null {
        if (!text) return null;
        const t = text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const DICCIONARIO_BARRERAS = [
            { nombre: "FALLA DE CONTACTO", palabras: ["NO CONTESTA", "NUMERO EQUIVOCADO", "APAGADO", "NO SE LOGRA CONTACTO", "INCORRECTO", "BUZON", "NO RESPOND", "NO HAY COMUNICACION"] },
            { nombre: "FALTA DE AGENDA", palabras: ["SIN AGENDA", "NO HAY AGENDA", "NO HAY DISPONIBILIDAD", "AGENDA CERRADA", "SIN OPORTUNIDAD", "NO TIENE CITA", "FALTA CITA"] },
            { nombre: "SIN AUTORIZACIÓN EPS", palabras: ["SIN AUTORIZACION", "NO AUTORIZADO", "PENDIENTE AUTORIZACION", "NEGACION", "NEGADO", "NO APROBADO", "ESPERA DE AUTORIZACION"] },
            { nombre: "PROBLEMA DE CONTRATO RED", palabras: ["SIN CONTRATO", "CONTRATO CERRADO", "PROBLEMA DE RED", "NO HAY CONVENIO", "FUERA DE RED", "NO HAY PRESTADOR"] },
            { nombre: "PROBLEMA ADMINISTRATIVO", palabras: ["ORDEN VENCIDA", "FALTA ORDEN", "ERROR EN ORDEN", "ACTUALIZAR ORDEN", "MIPRES", "AUDITORIA MEDICA", "ERROR SISTEMA"] },
            { nombre: "BARRERA DE TRANSPORTE / LEJANÍA", palabras: ["TRANSPORTE", "PASAJES", "DINERO", "LEJANIA", "ZONA RURAL", "VIATICOS", "RECURSOS ECONOMICOS", "IMPOSIBILIDAD DE VIAJAR"] },
            { nombre: "RECHAZO O CANCELACIÓN PACIENTE", palabras: ["NO ASISTE", "NO LLEGO", "CANCELADO POR PACIENTE", "RECHAZA", "NO DESEA", "DESISTE"] }
        ];

        for (const barrera of DICCIONARIO_BARRERAS) {
            if (barrera.palabras.some(palabra => t.includes(palabra))) {
                return barrera.nombre;
            }
        }
        
        return null;
    }

    // LECTOR CSV MANUAL MULTILÍNEA ROBUSTO
    private static parseManualCSV(buffer: Buffer): any[] {
        console.log("⚠️ Activando Lector Manual CSV Robusto...");
        
        let text = buffer.toString('utf-8');
        if (text.indexOf('') !== -1 || text.indexOf('Ã') !== -1) {
            text = buffer.toString('latin1');
        }

        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"'; 
                    i++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ';' && !inQuotes) {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === ',' && !inQuotes && text.indexOf(';') === -1) {
                currentRow.push(currentCell);
                currentCell = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') i++; 
                currentRow.push(currentCell);
                if (currentRow.length > 1 || currentRow[0].trim() !== '') {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell);
            rows.push(currentRow);
        }

        if (rows.length < 2) return [];

        let headerIndex = -1;
        for (let i = 0; i < Math.min(50, rows.length); i++) {
            const rowStr = rows[i].join(' ').toLowerCase();
            const lineNorm = this.normalizeHeader(rowStr);
            if (
                (lineNorm.includes('numero') && lineNorm.includes('identi')) || 
                lineNorm.includes('cedula') || 
                lineNorm.includes('tipo_de_nota') ||
                lineNorm.includes('estado_de_la_solicitud') ||
                lineNorm.includes('cups')
            ) {
                headerIndex = i; break;
            }
        }
        if (headerIndex === -1) return [];

        const headers = rows[headerIndex].map(h => this.normalizeHeader(this.cleanText(h)));

        const data = [];
        for (let i = headerIndex + 1; i < rows.length; i++) {
            const values = rows[i];
            if (values.length < headers.length * 0.3) continue; 
            const rowObj: any = {};
            headers.forEach((h, index) => { 
                rowObj[h] = values[index] ? this.cleanText(values[index]) : ''; 
            });
            data.push(rowObj);
        }
        return data;
    }

    
    // 4. PROCESO PRINCIPAL: CARGA MASIVA MULTI-HOJA
    static async processPatientExcel(buffer: Buffer) {
        try {
            console.log("📂 INICIANDO IMPORTACIÓN DEFINITIVA (SOPORTE CSV/XLSX)...");

            let rawData: any[] = [];
            let totalSheetsProcessed = 0;
            let pCreated = 0, pUpdated = 0, fCreated = 0, errors = 0;

            const bufferStart = buffer.toString('utf-8', 0, 500);
            if (bufferStart.includes(';') && bufferStart.split(';').length > 5) {
                console.log("📄 CSV detectado (separador ';'). Usando motor manual...");
                rawData = this.parseManualCSV(buffer);
                totalSheetsProcessed = 1;
            } else {
                console.log("📊 Excel detectado. Usando SheetJS...");
                const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
                for (const sheetName of workbook.SheetNames) {
                    if (['VALIDACIONES', 'DINAMICA', 'HOJA1', 'RESUMEN', 'LOG', 'REPORTE', 'TABLA'].some(k => sheetName.toUpperCase().includes(k))) continue;
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
                    rawData = rawData.concat(sheetData);
                    totalSheetsProcessed++;
                }
            }

            if (rawData.length === 0) throw new Error("El archivo está vacío o no se pudo leer.");

            const firstRow: any = rawData[0];
            const keys = Object.keys(firstRow).map(k => ImportService.normalizeHeader(k));
            const hasId = keys.some(k => k.includes('identificacion') || k.includes('cedula') || k.includes('documento') || k.includes('numero'));
            
            if (!hasId) {
                console.log(`⚠️ No tiene columnas de identificación. Omitiendo.`);
                throw new Error("No se detectó columna de identificación (Cédula/Documento).");
            }

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
                'desc_dx': ['diagnostico', 'descripcion_diagnostico', 'nombre_dx'], 
                
                'estado_general': [
                    'estado_de_la_solicitud', 'estado_solicitud', 'estado_cita', 'estado_de_la_cita', 
                    'estado', 'situacion', 'solicitud', 'estado_asistencial', 'estado_administrativo', 'estado_autorizacion'
                ],
                
                'nota_realizada': ['nota_realizada', 'numero_nota_realizada', 'nota_factura', 'numero_factura'], 
                'obs': ['observacion', 'nota', 'descripcion', 'observaciones', 'comentario', 'detalle', 'historia_clinica', 'evolucion'],
                'tipo_nota': ['tipo_de_nota', 'clase_nota', 'nombre_nota'], 
                'barrera': ['barrera', 'motivo_no_gestion', 'motivo_inasistencia', 'causa_retraso', 'barrera_de_acceso', 'motivo_cancelacion'],
                'responsable': ['responsable_1', 'responsable_2', 'usuario_responsable', 'gestor'],
                'tipo_caso': ['tipo_de_caso', 'tipo_caso', 'clasificacion_caso']
            };

            console.log(`🚀 Procesando ${rawData.length} filas...`);

            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];

                if (i > 0 && i % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                try {
                    const getVal = (key: string) => {
                        const normalizedRow = Object.keys(row).reduce((acc, k) => { 
                            acc[ImportService.normalizeHeader(k)] = row[k]; return acc; 
                        }, {} as any);

                        for (const alias of mapKeys[key]) {
                            if (normalizedRow[alias] !== undefined) return normalizedRow[alias];
                        }

                        for (const alias of mapKeys[key]) {
                            const foundKey = Object.keys(normalizedRow).find(k => k.includes(alias));
                            if (key === 'doc' && foundKey && foundKey.includes('tipo')) continue; 
                            if (key === 'estado_general' && foundKey && foundKey.includes('civil')) continue;
                            if (foundKey) return normalizedRow[foundKey];
                        }
                        return '';
                    };

                    const rawDoc = getVal('doc');
                    if (!rawDoc) continue; 
                    const docClean = String(rawDoc).replace(/[^a-zA-Z0-9]/g, '');
                    if (ImportService.isGarbageID(docClean)) continue; 

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

                    let dRequest = ImportService.parseDate(getVal('fecha_aten')) || new Date(); 
                    let dAppoint = ImportService.parseDate(getVal('fecha_cita'));

                    const rawStatus = ImportService.cleanText(getVal('estado_general')); 
                    const notaRealizada = ImportService.cleanText(getVal('nota_realizada')); 
                    let status = 'PENDIENTE'; 

                    if (rawStatus.includes('CANCEL') || rawStatus.includes('NO ASISTE') || rawStatus.includes('FALLID') || rawStatus.includes('FALLEC') || rawStatus.includes('NO ACEPTA') || rawStatus.includes('INASIST') || rawStatus.includes('DESIST') || rawStatus.includes('RECHAZ') || rawStatus.includes('ANULAD')) {
                        status = 'CANCELADO';
                    } else if ((notaRealizada.length > 2 && !notaRealizada.includes('NO')) || rawStatus.includes('REALIZAD') || rawStatus.includes('CUMPLID') || rawStatus.includes('ATENDID') || rawStatus.includes('FACTURA') || rawStatus.includes('CERRAD') || rawStatus.includes('ENTREGAD') || rawStatus.includes('EJECUTAD') || rawStatus.includes('FINALIZAD') || rawStatus.includes('TERMINAD') || rawStatus.includes('TOMAD') || rawStatus.includes('LEID') || rawStatus.includes('RESULTADO')) {
                        status = 'REALIZADO';
                    } else if (rawStatus.includes('TRAMITE') || rawStatus.includes('GESTION') || rawStatus.includes('AUTORI') || rawStatus.includes('PROCESO') || rawStatus.includes('ESPERA') || rawStatus.includes('REQUERIMIENTO') || rawStatus.includes('SOLICITA') || rawStatus.includes('ENVIAD') || rawStatus.includes('RADICAD') || rawStatus.includes('DIFERIDO') || rawStatus.includes('AVAL') || rawStatus.includes('CAMBIO DE ORDEN')) {
                        status = 'EN_GESTION';
                    } else if (rawStatus.includes('ASIGNA') || rawStatus.includes('PROGRAMA') || rawStatus.includes('AGENDA') || (rawStatus.includes('CITA') && !rawStatus.includes('SOLICITA'))) {
                        status = 'AGENDADO';
                    }

                    if (dAppoint && status === 'PENDIENTE') {
                        status = 'AGENDADO';
                    }
                    
                    if (status === 'AGENDADO' && !dAppoint) {
                        status = 'PENDIENTE';
                    }

                    if (dAppoint && dAppoint < new Date() && status === 'AGENDADO') { status = 'REALIZADO'; }
                    if (status === 'REALIZADO' && !dAppoint) { dAppoint = dRequest; }

                    const obsBase = ImportService.cleanText(getVal('obs'));
                    let barrera = ImportService.cleanText(getVal('barrera'));
                    const resp = ImportService.cleanText(getVal('responsable'));
                    const tipoCaso = ImportService.cleanText(getVal('tipo_caso'));
                    const cie10Code = ImportService.cleanText(getVal('cie10'));
                    const descDx = ImportService.cleanText(getVal('desc_dx'));
                    const tipoNota = ImportService.cleanText(getVal('tipo_nota')); 
                    
                    // 🚀 AQUÍ ESTÁ EL CEREBRO DE LAS BARRERAS
                    if (!barrera || barrera === 'NO' || barrera === '') {
                        // Si el excel no tiene columna de barreras, tratamos de leerla de la historia clínica
                        const barreraDetectada = ImportService.detectBarrierFromText(`${obsBase} ${rawStatus} ${tipoNota}`);
                        if (barreraDetectada) {
                            barrera = barreraDetectada;
                        }
                    }

                    let fullObs = obsBase;
                    if (tipoNota) fullObs = `[${tipoNota}] ${fullObs}`;
                    if (barrera && barrera !== 'NO') fullObs += ` | BARRERA: ${barrera}`;
                    if (tipoCaso) fullObs += ` | TIPO: ${tipoCaso}`;
                    if (resp) fullObs += ` | GESTOR: ${resp}`;
                    
                    let posibleDiagnostico = ImportService.getCohortFromCie10(cie10Code); 
                    if (!posibleDiagnostico) posibleDiagnostico = ImportService.getCohortFromText(descDx); 

                    if (posibleDiagnostico) {
                        fullObs += ` | DX SUGERIDO: ${posibleDiagnostico}`;
                    } else if (cie10Code) {
                        fullObs += ` | DX: ${cie10Code}`;
                    }

                    if (rawStatus && rawStatus !== status) fullObs += ` | ESTADO ORIGINAL: ${rawStatus}`;

                    let patient = await Patient.findOne({ where: { documentNumber: docClean } });
                    if (!patient) {
                        patient = await Patient.create({
                            documentType: finalDocType, documentNumber: docClean, firstName, lastName, phone: phoneClean,
                            insurance: epsClean, city: ImportService.cleanText(getVal('ciudad')),
                            department: ImportService.cleanText(getVal('depto')), gender: ImportService.cleanText(getVal('genero')),
                            birthDate: birthDateSafe, status: 'ACTIVO'
                        });
                        pCreated++;
                    } else {
                        let changed = false;
                        if (phoneClean.length > 5 && patient.phone !== phoneClean) { patient.phone = phoneClean; changed = true; }
                        if (changed) { await patient.save(); pUpdated++; }
                    }

                    let service = ImportService.cleanText(getVal('servicio'));
                    const rawCups = ImportService.cleanText(getVal('cups')).substring(0, 20);

                    if (!service || service.length < 3) {
                        service = tipoNota; 
                    }
                    if (!service || service.length < 3) {
                        service = obsBase.substring(0, 100); 
                    }
                    if (!service || service.length < 3) {
                        service = 'SERVICIO IMPORTADO'; 
                    }
                    
                    let category = 'PENDIENTE'; 
                    if (service.includes('CONSULTA') || rawCups.startsWith('890')) {
                        category = 'Consulta Externa';
                    }

                    let finalCups: string | null = rawCups;
                    if (finalCups && finalCups !== 'N/A' && finalCups !== '') {
                        try {
                            await MasterCUP.findOrCreate({
                                where: { codigo: finalCups },
                                defaults: {
                                    descripcion: service.substring(0, 255) || 'AGREGADO DESDE CARGA MASIVA',
                                    grupo: category !== 'PENDIENTE' ? category : 'PENDIENTE'
                                }
                            });
                        } catch (cupErr) { }
                    } else {
                        finalCups = null;
                    }
                    
                    if (finalCups || service || status === 'REALIZADO' || cie10Code || status === 'EN_GESTION' || fullObs) {
                        const exists = await FollowUp.findOne({
                            where: { patientId: patient.id, serviceName: service.substring(0, 255), dateRequest: dRequest }
                        });
                        
                        if (!exists) {
                            await FollowUp.create({
                                patientId: patient.id, dateRequest: dRequest, dateAppointment: dAppoint, 
                                status, cups: finalCups,
                                serviceName: service.substring(0, 255),
                                eps: epsClean, observation: fullObs, category
                            });
                            fCreated++;
                        } else {
                            let updateData: any = {};
                            
                            if (finalCups && (!exists.cups || exists.cups === 'N/A' || exists.cups === '')) {
                                updateData.cups = finalCups;
                            }

                            if (fullObs && fullObs.trim() !== '') {
                                if (!exists.observation || exists.observation === 'Sin observaciones.' || exists.observation === '') {
                                    updateData.observation = fullObs;
                                } else if (!exists.observation.includes(obsBase.substring(0, 20))) { 
                                    updateData.observation = `${exists.observation} // NUEVA NOTA: ${fullObs}`;
                                }
                            }

                            if ((!exists.category || exists.category === 'PENDIENTE') && category !== 'PENDIENTE') {
                                updateData.category = category;
                            }
                            
                            const statusPriority: Record<string, number> = { 'PENDIENTE': 0, 'EN_GESTION': 1, 'AGENDADO': 2, 'REALIZADO': 3, 'CANCELADO': 4 };
                            const currentP = statusPriority[exists.status || 'PENDIENTE'] || 0;
                            const newP = statusPriority[status] || 0;

                            if (newP > currentP) {
                                updateData.status = status;
                                if (dAppoint) updateData.dateAppointment = dAppoint;
                            }
                            
                            if (Object.keys(updateData).length > 0) {
                                await exists.update(updateData);
                            }
                        }
                    }
                } catch (e) { 
                    errors++;
                }
            }

            console.log(`✅ IMPORTACIÓN COMPLETADA: Hojas:${totalSheetsProcessed} | Nuevos:${pCreated} | Upd:${pUpdated} | Citas/Notas:${fCreated}`);
            
            await CupsController.runAutoCategorization();
            return { success: true, createdPatients: pCreated, updatedPatients: pUpdated, createdFollowUps: fCreated, errors };

        } catch (error: any) { 
            console.error("❌ ERROR CRÍTICO EN IMPORTACIÓN:", error);
            throw new Error(String(error));
        }
    }
}