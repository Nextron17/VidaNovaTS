import { sequelize } from './config/db';
import { User } from './models/User';
import colors from 'colors';

const seedAdmin = async () => {
    try {
        console.log(colors.cyan('⏳ Conectando para crear Admin...'));
        await sequelize.authenticate();

        // Creamos el Super Admin
        await User.create({
            name: 'Admin Vidanova',
            documentNumber: '1061000000', // <--- TU LOGIN
            password: 'adminnavegacion',    // <--- TU CLAVE
            role: 'SUPER_ADMIN',
            email: 'admin@vidanova.com',
            status: 'online'
        });

        console.log(colors.green.bold('\n✅ USUARIO CREADO EXITOSAMENTE'));
        console.log(colors.white('🆔 Documento: 1061000000'));
        console.log(colors.white('🔑 Password:  adminnavegacion'));
        
        process.exit(0);
    } catch (error: any) {
        console.error(colors.red('❌ Error al crear el usuario:'), error.message);
        process.exit(1);
    }
};

seedAdmin();