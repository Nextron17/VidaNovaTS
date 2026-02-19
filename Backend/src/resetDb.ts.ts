import { sequelize } from './core/config/db';
import { Patient } from './modules/navegacion/models/Patient';
import { FollowUp } from './modules/navegacion/models/FollowUp';

const resetDatabase = async () => {
    console.log('\n☢️  ADVERTENCIA DE SEGURIDAD ☢️');
    console.log('--------------------------------');
    console.log('Estás a punto de ELIMINAR TODOS LOS DATOS de la base de datos.');
    console.log('Esto borrará Pacientes, Seguimientos e Historiales.');
    console.log('Tienes 5 segundos para cancelar (Ctrl + C) si te arrepientes...\n');

    // Cuenta regresiva de seguridad
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Iniciando borrado masivo...');
    const t = await sequelize.transaction();

    try {
        // 1. Desactivar restricciones temporalmente (opcional, ayuda en algunos motores SQL)
        // await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

        // 2. Borrar tabla hija primero (Seguimientos)
        await FollowUp.destroy({ 
            where: {}, 
            truncate: true, 
            cascade: true, 
            transaction: t 
        });
        console.log('✅ Tabla FollowUps (Seguimientos) vaciada.');

        // 3. Borrar tabla padre (Pacientes)
        await Patient.destroy({ 
            where: {}, 
            truncate: true, 
            cascade: true, 
            transaction: t 
        });
        console.log('✅ Tabla Patients (Pacientes) vaciada.');

        // 4. Confirmar cambios
        await t.commit();
        
        console.log('\n✨ ÉXITO: La base de datos ha quedado LIMPIA (0 registros).');
        console.log('👉 Ahora puedes iniciar el servidor y cargar el Excel nuevamente.');
        process.exit(0);

    } catch (error) {
        await t.rollback();
        console.error('\n❌ ERROR FATAL:', error);
        process.exit(1);
    }
};

// Ejecutar
resetDatabase();