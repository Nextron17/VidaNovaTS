import colors from 'colors';
import dotenv from 'dotenv';
dotenv.config(); 

import { server } from './server'; 
import { connectDB } from './core/config/db'; 

const port = process.env.PORT || 4000;

async function startServer() {
    try {
        // Esto validará si la red de la empresa nos deja pasar
        await connectDB();

        server.listen(port, () => {
            console.log(colors.cyan.bold(`\n🚀 SERVIDOR BACKEND VIDA NOVA ACTIVO`));
            console.log(colors.white(`   👉 Puerto: ${port}`));
            console.log(colors.white(`   👉 Red: `) + colors.green(`Empresarial Protegida`));
        });

    } catch (error: any) {
        console.error(colors.red('\n❌ ERROR FATAL AL ARRANCAR:'), error.message);
        process.exit(1); 
    }
}

startServer();