import { sequelize } from './core/config/db';
import { User } from './modules/usuarios/models/User';
import colors from 'colors';

const seedAdmin = async () => {
    try {
        console.log(colors.cyan('⏳ Conectando para crear Admin...'));
        await sequelize.authenticate();

        // Creamos el Super Admin
        await User.create({
            name: 'Admin Vidanova',
            documentNumber: '1061000000',
            password: 'adminnavegacion', // Tu modelo lo encriptará automáticamente
            role: 'SUPER_ADMIN',
            email: 'admin@vidanova.com',
            status: 'online', // El texto que espera el ENUM
            isActive: true    // El estado de seguridad
        } as any);

        console.log(colors.green.bold('\n✅ USUARIO CREADO EXITOSAMENTE'));
        console.log(colors.white('🆔 Documento: 1061000000'));
        console.log(colors.white('🔑 Password:  adminnavegacion'));
        
        process.exit(0);
    } catch (error: any) {
        console.error(colors.red('\n❌ Error al crear el usuario:'));
        
        if (error.errors && error.errors.length > 0) {
            error.errors.forEach((e: any) => console.log(colors.yellow(`- ${e.message}`)));
        } else {
            console.error(error.message);
        }
        
        process.exit(1);
    }
};

seedAdmin();