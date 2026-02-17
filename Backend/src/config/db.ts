import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
// 👇 1. IMPORTAR EL MODELO FOLLOWUP
import { FollowUp } from '../models/FollowUp'; 

dotenv.config();

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
    models: [User, Patient, FollowUp], 
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Base de datos conectada.');
        // Sincronizar modelos, crear tablas si no existen y actualizar si hay cambios
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados.');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
};