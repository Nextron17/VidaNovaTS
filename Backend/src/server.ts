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

app.use(express.json({ limit: '500mb' })); 
app.use(express.urlencoded({ limit: '500mb', extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/navegacion', navegacionRoutes); 

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        mode: 'Unrestricted / Massive Data Ready',
        timestamp: new Date().toISOString() 
    });
});


app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta inexistente: ${req.originalUrl}`
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    
    console.error("❌ ERROR DETECTADO:", err);

    res.status(status).json({
        success: false,
        error: err.message || 'Error interno del servidor',
        stack: err.stack, 
        detail: err.parent?.detail || err.original?.detail || err.message
    });
});

const server = createServer(app);

server.timeout = 0; 

export { app, server };