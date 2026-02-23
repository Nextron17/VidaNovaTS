import colors from 'colors';
import dotenv from 'dotenv';
dotenv.config(); 

import { server } from './server'; 
import { connectDB } from './core/config/db'; 

const port = process.env.PORT || 4000;

async function startServer() {
    try {
        // Conectar a Supabase antes de abrir el puerto
        await connectDB();

        server.listen(port, () => {
            console.log(colors.cyan.bold(`\n🚀 SERVIDOR VIDA NOVA ACTIVO`));
            console.log(colors.white(`   👉 Puerto: ${port}`));
            console.log(colors.green(`   👉 Estado: DB Sincronizada y Lista\n`));
        });

    } catch (error: any) {
        console.error(colors.red('\n❌ ERROR CRÍTICO AL INICIAR:'), error.message);
        process.exit(1); 
    }
}

// Manejar cierres inesperados (como desconexiones de DB)
process.on('unhandledRejection', (err: any) => {
    console.log(colors.bgRed.white(` ⚠️ Error no manejado: ${err.message} `));
});

startServer();