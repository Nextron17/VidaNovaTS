import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

// 1. IMPORTACIÓN DE RUTAS (NUEVA ARQUITECTURA MODULAR)
import authRoutes from './modules/usuarios/routes/authRoutes';
import userRoutes from './modules/usuarios/routes/userRoutes';
import navegacionRoutes from './modules/navegacion/routes/navegacionRoutes';

const app = express();

// 1. CONFIGURACIÓN DE SEGURIDAD Y CARGA
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. CORS MEJORADO
// Permite cualquier origen dinámicamente en desarrollo
app.use(cors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

app.use(morgan('dev'));

// 3. MONTAJE DE MÓDULOS (Endpoints)
// Todas las rutas de usuarios y autenticación
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ¡El maestro! Todas las rutas de pacientes, seguimientos, alertas y auditoría pasan por aquí
app.use('/api/navegacion', navegacionRoutes); 

// Health Check (Para verificar que el servidor está vivo)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: 'Vidanova Backend', 
        database: 'Connected', 
        timestamp: new Date().toISOString() 
    });
});

// 4. MANEJO DE RUTAS NO ENCONTRADAS
// Crucial para que el frontend no reciba un HTML de error sino un JSON claro
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: `La ruta ${req.originalUrl} no existe en este servidor.`
    });
});

// 5. MANEJO DE ERRORES GLOBAL
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 ERROR SISTEMA:', err.message);
    
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: err.message || 'Error interno del servidor',
        code: err.code || 'INTERNAL_ERROR'
    });
});

const server = createServer(app);

export { app, server };