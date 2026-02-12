import colors from 'colors';
import dotenv from 'dotenv';
dotenv.config(); 

import { server } from './server'; 
import { sequelize } from './config/db'; 

const port = process.env.PORT || 4000;

async function startServer() {
    try {
        console.log(colors.yellow('⏳ [VIDANOVA] Conectando a PostgreSQL...'));
        await sequelize.authenticate();
        console.log(colors.green('✅ [DATABASE] Conexión establecida.'));

        // --- PASO CRÍTICO ---
        // Usamos 'force: true' para destruir la tabla con error y crearla limpia.
        console.log(colors.magenta('🚀 [DATABASE] Reconstruyendo tabla User (Estructura limpia)...'));
        await sequelize.sync({ alter: true }); 
        
        console.log(colors.green('✅ [DATABASE] Tablas creadas correctamente.'));

        server.listen(port, () => {
            console.log(colors.cyan.bold(`\n🚀 SERVIDOR BACKEND ACTIVO`));
            console.log(colors.white(`   👉 Puerto: ${port}`));
            console.log(colors.white(`   👉 Estado: `) + colors.green(`Listo para recibir al Admin`));
        });

    } catch (error: any) {
        console.error(colors.red('\n❌ ERROR AL INICIAR SERVIDOR:'), error.message);
        process.exit(1); 
    }
}

startServer();