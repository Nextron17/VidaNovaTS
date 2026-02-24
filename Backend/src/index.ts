import colors from 'colors';
import dotenv from 'dotenv';

// Cargar variables de entorno antes que cualquier otra cosa
dotenv.config(); 

import { server } from './server'; 
import { connectDB } from './core/config/db'; 

// Render asigna el puerto automáticamente, si no usa el 4000
const port = process.env.PORT || 4000;

async function startServer() {
    try {
        console.log(colors.cyan('🚀 Iniciando servidor VidaNovaJS...'));

        // 1. Conectar a la base de datos (Supabase/Sequelize)
        await connectDB();

        // 2. Encender servidor HTTP
        server.listen(port, () => {
            console.log(colors.cyan.bold(`\n==========================================`));
            console.log(colors.cyan.bold(`🚀 SERVIDOR VIDA NOVA ACTIVO EN RENDER`));
            console.log(colors.white(`   👉 Puerto detectado: ${port}`));
            console.log(colors.green(`   👉 Estado: DB Sincronizada y Lista`));
            console.log(colors.cyan.bold(`==========================================\n`));
        });

    } catch (error: any) {
        console.error(colors.red('\n❌ ERROR CRÍTICO AL INICIAR EL SISTEMA:'), error.message);
        // Salida con error para que Docker/Render sepa que falló
        process.exit(1); 
    }
}

// Captura de errores globales en promesas para evitar que el proceso muera en silencio
process.on('unhandledRejection', (err: any) => {
    console.log(colors.bgRed.white(` ⚠️ Error de promesa no manejado: ${err.message} `));
});

startServer();