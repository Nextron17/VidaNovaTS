import dotenv from 'dotenv';
import colors from 'colors';
import { sequelize } from './config/db';
import { User } from './models/User';

dotenv.config();

const createAdmin = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync(); // Asegura que la tabla exista

        // Verificar si ya existe
        const email = 'adminnavegacion@vidanova.com';
        const exists = await User.findOne({ where: { email } });

        if (exists) {
            console.log(colors.yellow('⚠️ El usuario Admin ya existe.'));
            process.exit(0);
        }

        // Crear el Super Admin
        console.log(colors.cyan('🌱 Creando usuario Super Admin...'));
        
        await User.create({
            name: 'Super Admin',
            email: email,
            password: 'adminnavegacion', // La contraseña que usarás
            role: 'SUPER_ADMIN',
            status: 'online',
            phone: '+57 300 123 4567',
            avatarColor: 'from-blue-600 to-indigo-600'
        });

        console.log(colors.green.bold('✅ ¡Usuario Admin creado exitosamente!'));
        console.log(colors.white('📧 Correo: ') + colors.blue(email));
        console.log(colors.white('🔑 Pass: ') + colors.blue('adminnavegacion'));
        
        process.exit(0);

    } catch (error) {
        console.error(colors.red('❌ Error al crear el seed:'), error);
        process.exit(1);
    }
};

createAdmin();