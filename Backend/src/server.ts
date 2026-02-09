import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

// Importación de Rutas
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes'; // <--- IMPORTAR
import userRoutes from './routes/userRoutes';
import patientRoutes from './routes/patientRoutes';
import followUpRoutes from './routes/followUpRoutes';
import analyticsRoutes from './routes/analyticsRoutes'; // <--- IMPORTAR
import alertRoutes from './routes/alertRoutes'; // <--- IMPORTAR
import backupRoutes from './routes/backupRoutes'; 


const app = express();

// --- 1. AUMENTAR LÍMITE DE CARGA (CRUCIAL PARA EXCEL) ---
// Sin esto, la carga de archivos grandes fallará con "Network Error"
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. CONFIGURACIÓN CORS ROBUSTA ---
// Simplificamos para desarrollo local para evitar bloqueos
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || ''
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true // Permite cookies/headers de autorización
}));

// Logger de peticiones HTTP
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
// Ruta Health Check (Para verificar que el servidor vive)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        project: 'Vidanova Backend', 
        time: new Date().toISOString() 
    });
});

// --- 4. MANEJO DE ERRORES GLOBAL ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 ERROR GLOBAL:', err.stack || err.message);
    
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(status).json({
        success: false,
        error: message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// --- Crear servidor HTTP ---
const server = createServer(app);

export { app, server };