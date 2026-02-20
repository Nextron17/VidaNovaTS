import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import dotenv from 'dotenv';
import colors from 'colors';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// 1. CLIENTE API (El que sí pasa el firewall de la empresa)
export const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// 2. CONFIGURACIÓN SEQUELIZE (El que Hortitech usaba)
export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 6543,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
    models: [path.join(__dirname, '/../../modules/**/models')],
    logging: false,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
        family: 4,
        options: `-c project=${process.env.DB_USER?.split('.')[1] || ''}`
    },
    pool: { max: 5, min: 0, acquire: 20000, idle: 10000 }
});

export async function connectDB() {
    try {
        console.log(colors.yellow('⏳ [VIDANOVA] Intentando conexión al túnel de datos...'));
        
        // Probamos primero la API (HTTPS - Puerto 443)
        const { error } = await supabase.from('usuarios').select('count').limit(1);
        if (error) throw new Error("Firewall bloquea incluso la API");
        console.log(colors.green('✅ [SUPABASE API] Acceso autorizado por Firewall.'));

        // Intentamos Sequelize (Puerto 6543)
        await sequelize.authenticate();
        console.log(colors.green('✅ [SEQUELIZE] Conexión binaria establecida.'));
        await sequelize.sync({ alter: true });

    } catch (error: any) {
        console.log(colors.bgRed.white('\n ⚠️ ADVERTENCIA DE RED EMPRESARIAL '));
        console.log(colors.red(`Causa: ${error.message}`));
        console.log(colors.cyan('💡 El servidor seguirá activo usando el Cliente API como respaldo.\n'));
        // No hacemos process.exit(1) para que el server Express pueda subir
    }
}

export default sequelize;