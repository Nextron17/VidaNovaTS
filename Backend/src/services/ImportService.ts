import * as XLSX from 'xlsx';
import { Patient } from '../models/Patient';
import { FollowUp } from '../models/FollowUp';
import { sequelize } from '../config/db';
import { Op } from 'sequelize';
import { CupsController } from '../controllers/CupsController';

export class ImportService {

    // 1. DETECTOR DE IDs "BASURA"
    private static isGarbageID(id: string): boolean {
        if (!id) return true;
        const text = String(id).toUpperCase().replace(/\s/g, ''); 
        
        const forbiddenWords = [
            'CEDULA', 'TARJETA', 'REGISTRO', 'CIVIL', 'NACIMIENTO', 'IDENTIDAD',
            'PERMISO', 'ESPECIAL', 'PERMANENCIA', 'PEP', 'PASAPORTE', 'ADULTO',
            'MENOR', 'IDENTIFICACION', 'EXTRANJERIA', 'SALVOCONDUCTO', 'NUMERO', 
            'NOTA', 'DOCUMENTO', 'PACIENTE', 'AFILIADO', 'TIPO'
        ];

        if (forbiddenWords.some(word => text.includes(word))) return true;

        const letterCount = text.replace(/[^A-Z]/g, '').length;
        const numberCount = text.replace(/[^0-9]/g, '').length;
        
        if (numberCount === 0) return true;
        if (letterCount > 3 && letterCount > numberCount) return true;

        return false;
    }

    // 2. UTILIDADES DE LIMPIEZA
    private static normalizeHeader(text: string): string {
        if (!text) return '';
        return String(text).trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-z0-9]/g, '_'); 
    }

    private static cleanText(val: any): string {
        if (!val) return '';
        let str = String(val).trim();
        if (str.startsWith('"') && str.endsWith('"')) str = str.slice(1, -1);
        // Limpiar saltos de linea extraños de excel
        str = str.replace(/(\r\n|\n|\r)/gm, " ");
        return str.toUpperCase();
    }

    private static cleanPhone(val: any): string {
        if (!val) return '';
        let str = String(val).replace(/[:/;,]/g, '|'); 
        const parts = str.split('|');
        const validNumbers: string[] = [];
        for (let part of parts) {
            let num = part.replace(/[^0-9]/g, '');
            // Quitar prefijo 57 si es largo
            if (num.startsWith('57') && num.length >= 12) num = num.substring(2);
            // Quitar notación científica si excel la puso (ej: 5,73E+11)
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
                if (str.includes(':')) {
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
            if (date && !isNaN(date.getTime())) return date;
        } catch (e) { return null; }
        return null;
    }

    // 3. LECTOR CSV MANUAL
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
        // Buscamos cabeceras típicas en las primeras 50 lineas
        for (let i = 0; i < Math.min(50, lines.length); i++) {
            const lineNorm = this.normalizeHeader(lines[i]);
            if (
                (lineNorm.includes('numero') && lineNorm.includes('identi')) || 
                lineNorm.includes('cedula') || 
                lineNorm.includes('tipo_de_nota') ||
                lineNorm.includes('estado_de_la_solicitud') // Archivos Katerine
            ) {
                headerIndex = i; break;
            }
        }
        if (headerIndex === -1) return [];

        const headerLine = lines[headerIndex];
        const delimiter = headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';

        const headers = this.splitCSVRow(headerLine, delimiter)
            .map(h => this.normalizeHeader(this.cleanText(h)));

        const data = [];
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = this.splitCSVRow(line, delimiter);
            if (values.length < headers.length * 0.3) continue; 

            const row: any = {};
            headers.forEach((h, index) => { 
                row[h] = values[index] ? this.cleanText(values[index]) : ''; 
            });
            data.push(row);
        }
        return data;
    }

    // 4. PROCESO PRINCIPAL "SUPER CARGA"

    static async processPatientExcel(buffer: Buffer) {
        try {
            console.log("📂 INICIANDO IMPORTACIÓN MULTI-FORMATO...");

            let rawData: any[] = [];
            
            try {
                const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
                rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
            } catch (e) { }

            let useManual = rawData.length === 0;
            if (!useManual) {
                const keys = Object.keys(rawData[0]);
                if (keys.length < 3 || JSON.stringify(keys).includes(';')) useManual = true;
            }

            if (useManual) rawData = this.parseManualCSV(buffer);
            
            if (rawData.length === 0) {
                return { success: false, message: "No se encontraron datos legibles. Verifique el archivo." };
            }

            const mapKeys: Record<string, string[]> = {
                // IDENTIFICACIÓN
                'doc': ['numero_de_identificacion', 'num_identificacion', 'numero_identificacion', 'cedula', 'documento', 'identificacion', 'numero_documento'],
                
                // NOMBRES
                'nom1': ['nombre_1', 'primer_nombre', 'nombres', 'nombre'],
                'nom2': ['nombre_2', 'segundo_nombre'],
                'ape1': ['apellido_1', 'primer_apellido', 'apellidos', 'apellido'],
                'ape2': ['apellido_2', 'segundo_apellido'],
                
                // CONTACTO
                'tel': ['telefonos', 'telefono', 'celular', 'movil', 'contacto', 'tel'],
                'email': ['correos', 'correo', 'email', 'e_mail', 'mail'],
                
                // DEMOGRÁFICOS
                'eps': ['entidad', 'aseguradora', 'eps', 'entidad_aseguradora', 'prestador', 'provee'], 
                'edad': ['edad', 'anos'],
                'genero': ['genero', 'sexo'],
                'ciudad': ['ciudad', 'municipio', 'ciudad_de_residencia', 'residencia'],
                'depto': ['departamento', 'departamento_de_residencia'],
                
                // FECHAS (Soporte Radioterapia y Katerine)
                'fecha_aten': [
                    'fecha_de_atencion', 'fecha_atencion', 
                    'fecha_solicitud', 'fecha_de_solicitud', // Katerine
                    'fecha_servicio', 'fecha_ingreso', 'fecha_captacion',
                    'servicios_solicitados',
                    'fecha_inicio_de_tratamiento', // Radioterapia
                    'fecha_valoracion_primera_vez' // Radioterapia
                ],
                'fecha_cita': [
                    'fecha_de_la_cita', 'fecha_cita', 
                    'fecha_de_cita', 
                    'fecha_programada', 'fecha_asignada',
                    'con_cita_programada'
                ],
                
                // PROCEDIMIENTO
                'cups': ['cups', 'codigo', 'codigo_procedimiento', 'cod_cups'],
                'servicio': [
                    'servicio', 'descripcion', 'procedimiento', 'nombre_del_procedimiento', 'examen',
                    'servicios_solicitados',
                    'tipo_servicio_solicitado' // Base Asmet
                ],
                
                // ESTADO, GESTIÓN Y BARRERAS
                'estado_cita': [
                    'estado_de_la_cita', 'estado_cita', 
                    'estado_asistencial', 'estado_administrativo', // Base Asmet
                    'estado', 'estado_de_la_solicitud', // Katerine
                    'situacion'
                ],
                'tipo_nota': ['tipo_de_nota', 'tipo_nota', 'tipo_documento_clinico'], 
                'nota_realizada': ['nota_realizada', 'numero_nota_realizada', 'nota_factura', 'nota_realizada_consultas'], 
                
                // CAMPOS DE OBSERVACIÓN (Aquí concatenamos todo lo extra)
                'obs': ['observacion', 'nota', 'descripcion', 'observaciones', 'comentario', 'notas'],
                'barrera': ['barrera'], // Archivos Katerine
                'responsable': ['responsable_1', 'responsable_2', 'usuario_responsable'], // Archivos Katerine
                'tipo_caso': ['tipo_de_caso', 'tipo_caso'] // Incidente, Prevalente
            };

            let pCreated = 0, pUpdated = 0, fCreated = 0, errors = 0;

            for (const row of rawData) {
                const t = await sequelize.transaction();

                try {
                    const getVal = (key: string) => {
                        const normalizedRow = Object.keys(row).reduce((acc, k) => { 
                            acc[this.normalizeHeader(k)] = row[k]; return acc; 
                        }, {} as any);
                        
                        for (const alias of mapKeys[key]) {
                            const foundKey = Object.keys(normalizedRow).find(k => k.includes(alias));
                            // Evitar conflictos (ej: "Tipo documento" vs "Documento")
                            if (key === 'doc' && foundKey && foundKey.includes('tipo')) continue; 
                            if (foundKey) return normalizedRow[foundKey];
                        }
                        return '';
                    };

                    const rawDoc = getVal('doc');
                    if (!rawDoc) { await t.commit(); continue; } 
                    
                    const docClean = String(rawDoc).replace(/[^a-zA-Z0-9]/g, '');
                    if (this.isGarbageID(docClean)) { await t.commit(); continue; } 

                    // --- DATOS PACIENTE ---
                    const fullNom1 = this.cleanText(getVal('nom1'));
                    const fullNom2 = this.cleanText(getVal('nom2'));
                    const fullApe1 = this.cleanText(getVal('ape1'));
                    const fullApe2 = this.cleanText(getVal('ape2'));
                    
                    let firstName = `${fullNom1} ${fullNom2}`.trim() || 'PACIENTE';
                    let lastName = `${fullApe1} ${fullApe2}`.trim() || 'IMPORTADO';
                    const phoneClean = this.cleanPhone(getVal('tel'));
                    const epsClean = this.cleanText(getVal('eps'));
                    const birthDateSafe = this.calculateBirthDate(getVal('edad'));

                    // --- ANÁLISIS DE ESTADO (SUPER LOGICA) ---
                    let dRequest = this.parseDate(getVal('fecha_aten'));
                    if (!dRequest) dRequest = new Date(); 

                    let dAppoint = this.parseDate(getVal('fecha_cita'));
                    
                    const estCita = this.cleanText(getVal('estado_cita'));
                    const tipoNota = this.cleanText(getVal('tipo_nota')); 
                    const notaRealizada = this.cleanText(getVal('nota_realizada')); 
                    
                    let status = 'PENDIENTE';

                    // Detectar REALIZADO
                    if ((notaRealizada && notaRealizada.length > 2 && !notaRealizada.includes('NO')) || 
                        estCita.includes('REALIZAD') || estCita.includes('ATENDID') || estCita.includes('FACTURA') || estCita.includes('FINALIZA') ||
                        tipoNota.includes('PROCEDIMIENTO') || tipoNota.includes('CONSULTA') || tipoNota.includes('EVOLUCION')) {
                        status = 'REALIZADO';
                    } 
                    // Detectar AGENDADO
                    else if (estCita.includes('ASIGNA') || estCita.includes('PROGRAMA') || estCita.includes('AGENDA') || dAppoint) {
                        status = 'AGENDADO';
                    } 
                    // Detectar CANCELADO / NO ASISTE
                    else if (estCita.includes('CANCEL') || estCita.includes('INCUMPLI') || estCita.includes('NO ASISTE') || estCita.includes('FALLIDA')) {
                        status = 'CANCELADO';
                    }
                    // Detectar EN GESTIÓN
                    else if (estCita.includes('TRAMITE') || estCita.includes('AUTORIZA') || estCita.includes('GESTION') || estCita.includes('PROGRAMACION')) {
                        status = 'EN_GESTION';
                    }

                    if (status === 'REALIZADO' && !dAppoint) { dAppoint = dRequest; }

                    // --- CONSTRUCCIÓN DE OBSERVACIÓN RICA ---
                    // Unimos observación, barrera y responsable en un solo texto
                    const obsBase = this.cleanText(getVal('obs'));
                    const barrera = this.cleanText(getVal('barrera'));
                    const resp = this.cleanText(getVal('responsable'));
                    const tipoCaso = this.cleanText(getVal('tipo_caso'));

                    let fullObs = obsBase;
                    if (barrera && barrera !== 'NO') fullObs += ` | BARRERA: ${barrera}`;
                    if (tipoCaso) fullObs += ` | TIPO: ${tipoCaso}`;
                    if (resp) fullObs += ` | RESP: ${resp}`;

                    // --- GESTIÓN PACIENTE ---
                    let patient = await Patient.findOne({ where: { documentNumber: docClean }, transaction: t });

                    if (!patient) {
                        patient = await Patient.create({
                            documentNumber: docClean,
                            firstName, lastName, phone: phoneClean,
                            insurance: epsClean,
                            city: this.cleanText(getVal('ciudad')),
                            department: this.cleanText(getVal('depto')),
                            gender: this.cleanText(getVal('genero')),
                            birthDate: birthDateSafe,
                            status: 'ACTIVO'
                        }, { transaction: t });
                        pCreated++;
                    } else {
                        let changed = false;
                        if (phoneClean.length > 5 && patient.phone !== phoneClean) { patient.phone = phoneClean; changed = true; }
                        if (epsClean && (!patient.insurance || patient.insurance.length < 3)) { patient.insurance = epsClean; changed = true; }
                        if (changed) { await patient.save({ transaction: t }); pUpdated++; }
                    }

                    // --- CREAR SEGUIMIENTO ---
                    const service = this.cleanText(getVal('servicio'));
                    const cups = this.cleanText(getVal('cups'));

                    let category = 'PENDIENTE';
                    if (service.includes('CONSULTA')) category = 'CONSULTA';
                    
                    if (cups || service || status === 'REALIZADO') {
                        const exists = await FollowUp.findOne({
                            where: {
                                patientId: patient.id,
                                serviceName: service.substring(0, 255),
                                dateRequest: dRequest
                            }, transaction: t
                        });
                        
                        if (!exists) {
                            await FollowUp.create({
                                patientId: patient.id,
                                dateRequest: dRequest,
                                dateAppointment: dAppoint, 
                                status, 
                                cups: cups.substring(0, 20),
                                serviceName: service.substring(0, 255) || 'SERVICIO GENERAL',
                                eps: epsClean, 
                                observation: fullObs, // Guardamos la observación enriquecida
                                category
                            }, { transaction: t });
                            fCreated++;
                        } else if (exists.status !== 'REALIZADO' && status === 'REALIZADO') {
                            await exists.update({ status: 'REALIZADO', dateAppointment: dAppoint }, { transaction: t });
                        }
                    }

                    await t.commit();

                } catch (e) { 
                    await t.rollback();
                    errors++;
                }
            }

            console.log(`✅ IMPORTACIÓN COMPLETADA: Nuevos:${pCreated} | Upd:${pUpdated} | Citas:${fCreated} | Errores:${errors}`);
            
            await CupsController.runAutoCategorization();

            return { success: true, createdPatients: pCreated, updatedPatients: pUpdated, createdFollowUps: fCreated, errors };

        } catch (error: any) { 
            console.error("❌ ERROR CRÍTICO EN IMPORTACIÓN:", error);
            throw new Error(String(error));
        }
    }
}