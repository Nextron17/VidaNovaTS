import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

// IMPORTACIÓN DE RUTAS
import authRoutes from './modules/usuarios/routes/authRoutes';
import userRoutes from './modules/usuarios/routes/userRoutes';
import navegacionRoutes from './modules/navegacion/routes/navegacionRoutes';

const app = express();

// 1. LÍMITES DE CARGA (Para fotos y documentos pesados de auditoría)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. CONFIGURACIÓN DE CORS DINÁMICO
// Permite localhost para desarrollo y la URL de Render para producción
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:3000',
    'http://localhost:5173' // Por si usas Vite
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman) o si están en la lista blanca
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por políticas de seguridad (CORS)'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(morgan('dev'));

// 3. RUTAS DE LA API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/navegacion', navegacionRoutes); 

// Ruta de salud del sistema
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: 'VidaNova Backend - Docker Mode', 
        database: 'Connected',
        timestamp: new Date().toISOString() 
    });
});

// 4. MANEJO DE RUTAS NO ENCONTRADAS (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta inexistente: ${req.originalUrl}`
    });
});

// 5. MANEJADOR GLOBAL DE ERRORES (Sequelize, JWT, etc.)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    
    if (err.name === 'SequelizeDatabaseError') {
        return res.status(400).json({
            success: false,
            error: 'Error de estructura en la Base de Datos',
            detail: err.message
        });
    }

    res.status(status).json({
        success: false,
        error: message,
        code: err.code || 'SERVER_ERROR'
    });
});

const server = createServer(app);
export { app, server };