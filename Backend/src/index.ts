import colors from 'colors';
import dotenv from 'dotenv';

dotenv.config(); 

import { server } from './server'; 
import { connectDB } from './core/config/db'; 

const port = process.env.PORT || 4000;

async function startServer() {
    try {
        console.log(colors.cyan('🚀 Iniciando servidor VidaNovaJS...'));

        await connectDB();

        server.listen(port, () => {
            console.log(colors.cyan.bold(`\n==========================================`));
            console.log(colors.cyan.bold(`🚀 SERVIDOR VIDA NOVA ACTIVO EN RENDER`));
            console.log(colors.white(`   👉 Puerto detectado: ${port}`));
            console.log(colors.green(`   👉 Estado: DB Sincronizada y Lista`));
            console.log(colors.cyan.bold(`==========================================\n`));
        });

    } catch (error: any) {
        console.error(colors.red('\n❌ ERROR CRÍTICO AL INICIAR EL SISTEMA:'), error.message);
        process.exit(1); 
    }
}

process.on('unhandledRejection', (err: any) => {
    console.log(colors.bgRed.white(` ⚠️ Error de promesa no manejado: ${err.message} `));
});

startServer();