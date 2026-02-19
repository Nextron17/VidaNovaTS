import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../../modules/usuarios/models/User';
import { Patient } from '../../modules/navegacion/models/Patient';
import { FollowUp } from '../../modules/navegacion/models/FollowUp'; 

dotenv.config();

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD), 
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
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados.');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
};