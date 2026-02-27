import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

// IMPORTACIÓN DE RUTAS
import authRoutes from './modules/usuarios/routes/authRoutes';
import userRoutes from './modules/usuarios/routes/userRoutes';
import navegacionRoutes from './modules/navegacion/routes/navegacionRoutes';

const app = express();

// 🔓 1. CONFIGURACIÓN ABIERTA
app.disable('x-powered-by'); 

// ⚙️ 2. CORS TOTALMENTE ABIERTO (Para evitar bloqueos en desarrollo/pruebas)
// ⚙️ 2. CORS DINÁMICO TOTALMENTE ABIERTO (Legal para el navegador)
app.use(cors({
    origin: function (origin, callback) {
        // Al devolver 'true', aceptamos cualquier origen dinámicamente
        callback(null, true); 
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'] 
}));

// 📦 3. PARSERS SIN LÍMITES (O con límites masivos para archivos gigantes)
app.use(morgan('dev'));

// Eliminamos las restricciones de tamaño para que pasen Excels de miles de filas
app.use(express.json({ limit: '500mb' })); 
app.use(express.urlencoded({ limit: '500mb', extended: true }));


// 🚀 4. RUTAS DE LA API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/navegacion', navegacionRoutes); 

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        mode: 'Unrestricted / Massive Data Ready',
        timestamp: new Date().toISOString() 
    });
});


// 🚨 5. MANEJO DE ERRORES
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta inexistente: ${req.originalUrl}`
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    
    // En este modo, mostramos TODO el error para poder debuguear por qué fallan los miles de datos
    console.error("❌ ERROR DETECTADO:", err);

    res.status(status).json({
        success: false,
        error: err.message || 'Error interno del servidor',
        stack: err.stack, // Mostramos el stack para saber exactamente dónde falló el Excel
        detail: err.parent?.detail || err.original?.detail || err.message
    });
});

const server = createServer(app);

// 🚀 IMPORTANTE: Quitar el timeout del servidor para que no se corte la subida masiva
server.timeout = 0; // 0 significa infinito (esperará hasta que el Excel termine)

export { app, server };