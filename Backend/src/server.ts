import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';

import authRoutes from './modules/usuarios/routes/authRoutes';
import userRoutes from './modules/usuarios/routes/userRoutes';
import navegacionRoutes from './modules/navegacion/routes/navegacionRoutes';

const app = express();

app.disable('x-powered-by'); 

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true); 
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'] 
}));

app.use(morgan('dev'));


app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// RUTAS DEL SISTEMA
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/navegacion', navegacionRoutes); 

// HEALTH CHECK
app.get('/api/health', (req, res) => {
    // Calculamos la hora de Colombia para el log del servidor
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    const localTime = new Date(Date.now() - tzoffset).toISOString();

    res.json({ 
        status: 'OK', 
        mode: 'Enterprise / Background Processing Ready',
        timestamp: localTime 
    });
});

// MANEJO DE RUTAS INEXISTENTES (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta inexistente: ${req.originalUrl}`
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    
    console.error("❌ ERROR DETECTADO:", err);

    const isDev = process.env.NODE_ENV === 'development';

    res.status(status).json({
        success: false,
        error: err.message || 'Error interno del servidor',
        ...(isDev && { 
            stack: err.stack, 
            detail: err.parent?.detail || err.original?.detail 
        })
    });
});

const server = createServer(app);
server.timeout = 120000; 

export { app, server };