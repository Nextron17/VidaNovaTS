import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import dotenv from 'dotenv';
import colors from 'colors';
import { createClient } from '@supabase/supabase-js';

// 1. IMPORTACIÓN MANUAL DE MODELOS
import { User } from '../../modules/usuarios/models/User';
import { Patient } from '../../modules/navegacion/models/Patient';
import { FollowUp } from '../../modules/navegacion/models/FollowUp';

// Carga el .env de forma más segura
dotenv.config();

const dbUser = process.env.DB_USER || '';
// Extrae 'igusfieacmzhwikasnqi' del string 'postgres.igusfieacmzhwikasnqi'
const projectID = dbUser.includes('.') ? dbUser.split('.')[1] : '';

// 2. CLIENTE API (Respaldo HTTPS)
export const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// 3. CONFIGURACIÓN SEQUELIZE
export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 6543,
    username: dbUser,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'postgres',
    models: [User, Patient, FollowUp], 
    logging: false,
    dialectOptions: {
        ssl: { 
            require: true, 
            rejectUnauthorized: false 
        },
        // 🔑 CLAVE: Inyectamos el ID del proyecto dinámicamente
        options: projectID ? `-c project=${projectID}` : undefined
    },
    pool: { 
        max: 5, 
        min: 0, 
        acquire: 30000, 
        idle: 10000 
    }
});

export async function connectDB() {
    try {
        console.log(colors.yellow(`⏳ [VIDANOVA] Validando acceso al proyecto: ${projectID}...`));
        
        // Intentar conexión binaria
        await sequelize.authenticate();
        console.log(colors.green('✅ [SEQUELIZE] Conexión binaria establecida.'));
        
        // Sincronización de tablas
        await sequelize.sync({ alter: true });
        console.log(colors.green('✅ [DATABASE] Modelos sincronizados correctamente.'));

    } catch (error: any) {
        console.log(colors.bgRed.white('\n ⚠️ AVISO DE CONEXIÓN '));
        console.log(colors.red(`Causa probable: Firewall empresarial bloqueando puerto 6543.`));
        console.log(colors.red(`Error técnico: ${error.message}`));
        
        // Intento de respaldo vía API (Puerto 443 - HTTPS)
        const { error: apiError } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
        
        if (!apiError) {
            console.log(colors.green('✅ [SUPABASE API] Respaldo HTTPS activo. El servidor funcionará.'));
        } else {
            console.log(colors.bgYellow.black(' ❌ [CRÍTICO] Ni la DB ni la API responden. Revisa tu internet. '));
        }
    }
}

export default sequelize;