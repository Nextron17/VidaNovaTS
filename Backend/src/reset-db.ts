import { sequelize } from './config/db'; // Asegúrate que la ruta a tu config/db sea correcta
import { Patient } from './models/Patient';
import { FollowUp } from './models/FollowUp';

const resetDatabase = async () => {
    try {
        console.log("🗑️  Iniciando borrado total de la base de datos...");
        
        // 'force: true' le dice a Sequelize que haga DROP TABLE IF EXISTS
        // Esto borra los datos y vuelve a crear las tablas limpias
        await sequelize.sync({ force: true });
        
        console.log("✅ Base de datos vaciada y tablas recreadas exitosamente.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error reseteando la base de datos:", error);
        process.exit(1);
    }
};

resetDatabase();