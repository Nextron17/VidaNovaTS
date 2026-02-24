import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet'; // 🛡️ NUEVO: Seguridad de cabeceras HTTP
import rateLimit from 'express-rate-limit'; // 🛡️ NUEVO: Límite de peticiones
import { createServer } from 'http';

// IMPORTACIÓN DE RUTAS
import authRoutes from './modules/usuarios/routes/authRoutes';
import userRoutes from './modules/usuarios/routes/userRoutes';
import navegacionRoutes from './modules/navegacion/routes/navegacionRoutes';

const app = express();

// 🛡️ 1. SEGURIDAD BÁSICA (Debe ir primero)
// Helmet bloquea cabeceras que revelan información y previene ataques XSS/Clickjacking
app.use(helmet());
app.disable('x-powered-by'); // Oculta que usamos Express

// Configuración del limitador de peticiones (Anti-DDoS y fuerza bruta básica)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // Límite de 300 peticiones por IP en ese tiempo
    message: {
        success: false,
        error: 'Hemos detectado tráfico inusual desde tu red. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicamos el límite SOLO a las rutas de la API (no afecta a recursos estáticos si los tuvieras)
app.use('/api', globalLimiter);


// ⚙️ 2. CONFIGURACIÓN DE CORS DINÁMICO
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:3000',
    'http://localhost:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por políticas de seguridad (CORS)'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] // 🛡️ Restringimos cabeceras permitidas
}));


// 📦 3. PARSERS Y LOGS
app.use(morgan('dev'));

// LÍMITES DE CARGA
// Nota: Para subida de Excel (multipart/form-data) se encarga Multer. 
// Estos límites son para JSON puro y datos de formularios codificados.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// 🚀 4. RUTAS DE LA API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/navegacion', navegacionRoutes); 

// Ruta de salud del sistema (Health Check para Docker/Render)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: 'VidaNova Backend - Security Mode', 
        database: 'Connected',
        timestamp: new Date().toISOString() 
    });
});


// 🚨 5. MANEJO DE ERRORES (404 y Globales)
// 404 - Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Ruta inexistente: ${req.originalUrl}`
    });
});

// 500 - Manejador Global de Errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    
    // Interceptar errores de Sequelize (Base de datos) para no filtrar info delicada
    if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Error de validación o estructura en la Base de Datos',
            detail: process.env.NODE_ENV === 'development' ? err.message : 'Error interno' // Ocultamos detalles en producción
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