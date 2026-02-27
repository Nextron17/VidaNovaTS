import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import dotenv from 'dotenv';
import colors from 'colors';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// 1. IMPORTACIÓN MANUAL DE MODELOS
import { User } from '../../modules/usuarios/models/User';
import { Patient } from '../../modules/navegacion/models/Patient';
import { FollowUp } from '../../modules/navegacion/models/FollowUp';
import { AuditLog } from '../models/AuditLog'; 

// Carga el .env
dotenv.config();

// VALIDACIÓN CRÍTICA PARA RENDER
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error(colors.bgRed.white(' ERROR CRÍTICO: Faltan variables de entorno de Supabase en Render '));
    console.log(colors.red(`SUPABASE_URL: ${supabaseUrl ? 'OK' : 'FALTA'}`));
    console.log(colors.red(`SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? 'OK' : 'FALTA'}`));
}

const dbUser = process.env.DB_USER || '';
// Extrae el ID del proyecto del string de usuario de Postgres
const projectID = dbUser.includes('.') ? dbUser.split('.')[1] : '';

// 2. CLIENTE API (Respaldo HTTPS)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseServiceKey || 'placeholder'
);

// 3. CONFIGURACIÓN SEQUELIZE (MODO CARGA MASIVA - 15 MINUTOS)
export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    // 🚀 PUERTO DIRECTO: Cambiamos a 5432 para saltarnos el Pooler de Supabase que corta conexiones
    port: Number(process.env.DB_PORT) || 5432, 
    username: dbUser,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    models: [User, Patient, FollowUp, AuditLog], 
    logging: false,
    dialectOptions: {
        ssl: { 
            require: true, 
            rejectUnauthorized: false 
        },
        // 🚀 PACIENCIA DE LA DB: 15 minutos (900,000 milisegundos)
        statement_timeout: 900000, 
        options: projectID ? `-c project=${projectID}` : undefined
    },
    pool: { 
        max: 15,         // Más conexiones simultáneas
        min: 0, 
        acquire: 900000, // 🚀 PACIENCIA DE CONEXIÓN: 15 minutos
        idle: 30000 
    }
});

// 🛡️ FUNCIÓN PARA CREAR USUARIO ADMIN INICIAL
async function seedAdminUser() {
    try {
        const userCount = await User.count();
        if (userCount === 0) {
            console.log(colors.magenta('🗄️ Base de datos vacía: Generando Administrador...'));
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Administrador Principal',
                email: 'felipesamboni17@gmail.com',
                documentNumber: '12345678', // Usuario para iniciar sesión
                password: hashedPassword,
                role: 'ADMIN',
                status: true
            } as any);
            console.log(colors.bgMagenta.white(' ✅ ADMIN CREADO: Doc 12345678 | Clave admin123 '));
        }
    } catch (e) { console.error("Error Seeder:", e); }
}

// 4. FUNCIÓN DE CONEXIÓN Y SINCRONIZACIÓN
export async function connectDB() {
    try {
        console.log(colors.yellow(`⏳ [VIDANOVA] Validando acceso al proyecto: ${projectID}...`));
        
        // Intentar conexión binaria
        await sequelize.authenticate();
        console.log(colors.green('✅ [SEQUELIZE] Conexión directa establecida (Puerto 5432).'));
        
        // 🔄 Sincronización de tablas
        await sequelize.sync({ alter: true });
        console.log(colors.green('✅ [DATABASE] Modelos sincronizados correctamente.'));

        // Crea el administrador si borraste la base de datos
        await seedAdminUser();

    } catch (error: any) {
        console.log(colors.bgRed.white('\n ⚠️ AVISO DE CONEXIÓN '));
        console.log(colors.red(`Causa probable: Firewall empresarial o variables mal configuradas.`));
        console.log(colors.red(`Error técnico: ${error.message}`));
        
        // Intento de respaldo vía API (Puerto 443 - HTTPS)
        if (supabaseUrl && supabaseServiceKey) {
            const { error: apiError } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
            
            if (!apiError) {
                console.log(colors.green('✅ [SUPABASE API] Respaldo HTTPS activo. El servidor funcionará.'));
            } else {
                console.log(colors.bgYellow.black(' ❌ [CRÍTICO] Ni la DB ni la API responden. Revisa credenciales. '));
            }
        }
    }
}

export default sequelize;