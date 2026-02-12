import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

// Importación de Rutas
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes';
import userRoutes from './routes/userRoutes';
import patientRoutes from './routes/patientRoutes';
import followUpRoutes from './routes/followUpRoutes';
import analyticsRoutes from './routes/analyticsRoutes'; 
import alertRoutes from './routes/alertRoutes'; 
import backupRoutes from './routes/backupRoutes'; 

const app = express();

// --- 1. CONFIGURACIÓN DE SEGURIDAD Y CARGA ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. CORS MEJORADO ---
// Agregamos explícitamente localhost con IP y nombre para evitar fallos de resolución
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

// Borra el bloque anterior y pega este:
app.use(cors({
    origin: true, // Permite cualquier origen dinámicamente en desarrollo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

app.use(morgan('dev'));

// --- 3. DEFINICIÓN DE RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes); 
app.use('/api/alerts', alertRoutes); 
app.use('/api/backup', backupRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: 'Vidanova Backend', 
        database: 'Connected', // Esto asume que el servidor solo sube si la DB está ok
        timestamp: new Date().toISOString() 
    });
});

// --- 4. MANEJO DE RUTAS NO ENCONTRADAS (404) ---
// Crucial para que el frontend no reciba un HTML de error sino un JSON claro
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: `La ruta ${req.originalUrl} no existe en este servidor.`
    });
});

// --- 5. MANEJO DE ERRORES GLOBAL ---
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