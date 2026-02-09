import colors from 'colors';
import dotenv from 'dotenv';

// 1. 🔥 Cargar variables de entorno PRIMERO
dotenv.config(); 

// 2. Importar servidor y DB
// IMPORTANTE: Asegúrate de que './app' coincida con el nombre de tu archivo de Express
import { server } from './server'; 
import { sequelize } from './config/db'; 

const port = process.env.PORT || 4000; // Usualmente Backend corre en 4000 o 5000 para no chocar con Next.js (3000)

async function startServer() {
    try {
        console.log(colors.yellow('⏳ DEBUG: Intentando conectar a PostgreSQL...'));
        
        // 1. Probar conexión
        await sequelize.authenticate();
        console.log(colors.green('✅ DEBUG: Conexión a Base de Datos establecida.'));

        // 2. Sincronizar modelos
        // 'alter: true' actualiza las tablas si agregaste columnas nuevas
        console.log(colors.yellow('⏳ DEBUG: Sincronizando modelos (Alter)...'));
        await sequelize.sync({ alter: true }); 
        console.log(colors.green('✅ DEBUG: Modelos sincronizados correctamente.'));

        // 3. Iniciar el servidor
        server.listen(port, () => {
            console.log(colors.cyan.bold(`\n🚀 Servidor Backend Vidanova activo`));
            console.log(colors.cyan(`   👉 URL: http://localhost:${port}`));
            console.log(colors.gray(`   📡 Esperando peticiones del Frontend...`));
        });

    } catch (error) {
        console.error(colors.red('\n❌ ERROR FATAL AL INICIAR SERVIDOR:'));
        console.error(error);
        process.exit(1); 
    }
}

startServer();