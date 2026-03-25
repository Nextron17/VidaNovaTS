import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import colors from 'colors';
import { createClient } from '@supabase/supabase-js';

// 1. IMPORTACIÓN DE MODELOS
import { User } from '../../modules/usuarios/models/User';
import { Patient } from '../../modules/navegacion/models/Patient';
import { FollowUp } from '../../modules/navegacion/models/FollowUp';
import { AuditLog } from '../models/AuditLog'; 
import { MasterCUP } from '../../modules/navegacion/models/MasterCUP'; 

dotenv.config();

// VALIDACIÓN DE ENTORNO
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error(colors.bgRed.white(' ERROR CRÍTICO: Faltan variables de entorno de Supabase '));
}

const dbUser = process.env.DB_USER || '';
const projectID = dbUser.includes('.') ? dbUser.split('.')[1] : '';

// 2. CLIENTE API (Respaldo)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseServiceKey || 'placeholder'
);

// 3. CONFIGURACIÓN SEQUELIZE (MODO ALTO RENDIMIENTO)
export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432, 
    username: dbUser,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    // 🚀 ORDEN DE MODELOS: MasterCUP se agrega para permitir relaciones
    models: [User, Patient, MasterCUP, FollowUp, AuditLog], 
    logging: false,
    dialectOptions: {
        ssl: { 
            require: true, 
            rejectUnauthorized: false 
        },
        // ⏳ TIEMPO DE CONSULTA SQL: 1 HORA (3,600,000 ms) para proteger la importación masiva
        statement_timeout: 3600000, 
        options: projectID ? `-c project=${projectID}` : undefined
    },
    pool: { 
        max: 20,         
        min: 5, 
        // ⏳ TIEMPO DE ESPERA DE CONEXIÓN: 2 minutos (120,000 ms) para evitar caídas si hay muchos usuarios
        acquire: 120000, 
        idle: 10000 
    }
});

// 4. FUNCIÓN DE INICIALIZACIÓN
export async function connectDB() {
    try {
        console.log(colors.yellow(`⏳ [VIDANOVA] Validando acceso al nodo de datos...`));
        
        // Autenticar conexión
        await sequelize.authenticate();
        console.log(colors.green('✅ [SEQUELIZE] Conexión establecida con éxito.'));
        
        // 🔄 Sincronización Inteligente
        // Solo altera tablas si estás desarrollando. En producción, respeta los datos estrictamente.
        const isDev = process.env.NODE_ENV === 'development';
        await sequelize.sync({ alter: isDev });
        
        console.log(colors.green(`✅ [DATABASE] Modelos sincronizados (Modo: ${isDev ? 'Desarrollo' : 'Producción'}).`));

    } catch (error: any) {
        console.log(colors.bgRed.white('\n ⚠️ FALLO DE ENLACE DE DATOS '));
        console.log(colors.red(`Detalle técnico: ${error.message}`));
        
        // Intento de respaldo vía API HTTPS (Puerto 443)
        if (supabaseUrl && supabaseServiceKey) {
            try {
                const { error: apiError } = await supabase.from('users').select('count', { count: 'exact', head: true });
                if (!apiError) {
                    console.log(colors.green('✅ [SUPABASE API] Respaldo HTTPS activo. El sistema operará en modo limitado.'));
                }
            } catch (e) {
                console.log(colors.bgYellow.black(' ❌ [CRÍTICO] Error total de comunicación con el servidor de datos. '));
            }
        }
    }
}

export default sequelize;