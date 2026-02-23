import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

// RUTAS
import authRoutes from './modules/usuarios/routes/authRoutes';
import userRoutes from './modules/usuarios/routes/userRoutes';
import navegacionRoutes from './modules/navegacion/routes/navegacionRoutes';

const app = express();

// 1. CARGA DE DATOS (Aumentado para fotos/documentos de pacientes)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. CORS DINÁMICO (Indispensable para conectar con Render y Localhost al tiempo)
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(morgan('dev'));

// 3. RUTAS
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/navegacion', navegacionRoutes); 

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: 'VidaNova Backend', 
        timestamp: new Date().toISOString() 
    });
});

// 4. ERROR 404 (Ruta no encontrada)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta inexistente: ${req.originalUrl}`
    });
});

// 5. MANEJADOR DE ERRORES GLOBAL (Captura errores de Sequelize y JWT)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    
    // Si el error viene de la base de datos (como el del "role" que vimos)
    if (err.name === 'SequelizeDatabaseError') {
        return res.status(400).json({
            success: false,
            error: 'Error de estructura de datos',
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