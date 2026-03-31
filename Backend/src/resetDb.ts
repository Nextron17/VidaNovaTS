import { sequelize } from './core/config/db';

// 1. IMPORTAMOS TODOS TUS MODELOS
import { Patient } from './modules/navegacion/models/Patient';
import { FollowUp } from './modules/navegacion/models/FollowUp';
import { User } from './modules/usuarios/models/User';
import { AuditLog } from './core/models/AuditLog'; 
import { MasterCUP } from './modules/navegacion/models/MasterCUP';

const resetDatabase = async () => {
    console.log('\n☢️  ADVERTENCIA DE DESTRUCCIÓN TOTAL ☢️');
    console.log('-----------------------------------------');
    console.log('Estás a punto de ELIMINAR TODOS LOS DATOS del sistema:');
    console.log('- Pacientes y Seguimientos');
    console.log('- Diccionario Maestro de CUPS');
    console.log('- Registros de Auditoría');
    console.log('- Usuarios y Administradores');
    console.log('Tienes 5 segundos para cancelar (Ctrl + C) si te arrepientes...\n');

    // Cuenta regresiva de seguridad
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Iniciando borrado masivo y reinicio de IDs...');
    const t = await sequelize.transaction();

    try {
        // Opciones destructivas para PostgreSQL (cascade = borra en cascada, restartIdentity = reinicia IDs a 1)
        const wipeOptions = { truncate: true, cascade: true, restartIdentity: true, transaction: t };

        // 2. BORRAMOS EN ORDEN (De hijos a padres) para evitar errores de llaves foráneas

        // A. Borramos Auditoría (Depende de todo)
        await AuditLog.destroy({ where: {}, ...wipeOptions });
        console.log('✅ Tabla AuditLogs (Auditoría) vaciada e IDs reiniciados.');

        // B. Borramos Seguimientos (Depende de Pacientes, CUPS y Usuarios)
        await FollowUp.destroy({ where: {}, ...wipeOptions });
        console.log('✅ Tabla FollowUps (Citas/Gestiones) vaciada e IDs reiniciados.');

        // C. Borramos Pacientes
        await Patient.destroy({ where: {}, ...wipeOptions });
        console.log('✅ Tabla Patients (Pacientes) vaciada e IDs reiniciados.');

        // D. Borramos el Diccionario de CUPS (Independiente)
        await MasterCUP.destroy({ where: {}, ...wipeOptions });
        console.log('✅ Tabla Master_Cups (Diccionario) vaciada e IDs reiniciados.');

        // E. Borramos Usuarios al final (Tabla Padre principal)
        await User.destroy({ where: {}, ...wipeOptions });
        console.log('✅ Tabla Users (Usuarios y Admins) vaciada e IDs reiniciados.');

        // 3. Confirmar cambios
        await t.commit();
        
        console.log('\n✨ ÉXITO: La base de datos ha quedado COMPLETAMENTE LIMPIA (0 registros).');
        console.log('⚠️  IMPORTANTE: Como se borró el administrador, debes ejecutar el SEED ahora:');
        console.log('👉 Comando: npx ts-node src/seed.ts\n');
        process.exit(0);

    } catch (error) {
        await t.rollback();
        console.error('\n❌ ERROR FATAL AL VACIAR:', error);
        process.exit(1);
    }
};

// Ejecutar
resetDatabase();