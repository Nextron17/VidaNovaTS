import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../../modules/usuarios/models/User'; 

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Validación estricta de cabecera
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ 
                success: false,
                code: 'AUTH_HEADER_MISSING',
                error: 'No autorizado. Se requiere un token de acceso válido.' 
            });
            return;
        }

        // Extracción segura del token (evita strings vacíos si envían "Bearer ")
        const token = authHeader.split(' ')[1]?.trim();
        
        if (!token) {
            res.status(401).json({ success: false, error: 'Token malformado.' });
            return;
        }

        // 2. Verificación criptográfica del JWT
        const secret = process.env.JWT_SECRET || 'secret_super_seguro_vidanova';
        const decoded = jwt.verify(token, secret) as { id: number };

        // 3. Verificación contra Base de Datos (Seguridad en tiempo real)
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'resetPasswordToken'] }
        });

        // 🛡️ REGLA 1: ¿El usuario fue eliminado?
        if (!user) {
            res.status(401).json({ 
                success: false,
                code: 'USER_NOT_FOUND',
                error: 'El usuario asociado a este token ya no existe en el sistema.' 
            });
            return;
        }

        // 🛡️ REGLA 2: ¿El usuario fue suspendido/desactivado por un Admin?
        // Nota: Asegúrate de tener un campo en tu modelo User (ej. 'isActive' boolean o 'status' string)
        if (user.isActive === false) { 
            console.warn(`⛔ Intento de acceso bloqueado: Cuenta suspendida (ID: ${user.id})`);
            res.status(403).json({ 
                success: false,
                code: 'ACCOUNT_SUSPENDED',
                error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' 
            });
            return;
        }

        // 4. Inyectar usuario en la request y continuar
        req.user = user;
        next();

    } catch (error) {
        // 5. Manejo de Errores Profesional sin exponer detalles
        if (error instanceof TokenExpiredError) {
            res.status(401).json({ 
                success: false,
                code: 'TOKEN_EXPIRED',
                error: 'Tu sesión ha expirado por seguridad. Por favor inicia sesión nuevamente.' 
            });
            return;
        }
        
        if (error instanceof JsonWebTokenError) {
            res.status(401).json({ 
                success: false,
                code: 'TOKEN_INVALID',
                error: 'Firma de seguridad inválida o token manipulado.' 
            });
            return;
        }

        // Error inesperado (ej. Caída de base de datos)
        console.error('Error crítico en middleware de autenticación:', error);
        res.status(500).json({ success: false, error: 'Error interno validando la sesión.' });
    }
};

// ==========================================
// MIDDLEWARE DE AUTORIZACIÓN (Por Roles)
// ==========================================
export const requireRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        
        // Falla segura: Si por algún motivo el authMiddleware no inyectó al usuario
        if (!req.user) {
            res.status(401).json({ 
                success: false,
                code: 'UNAUTHENTICATED',
                error: 'Usuario no identificado en el flujo de seguridad.' 
            });
            return;
        }

        // Verificación Estricta de Rol
        if (!allowedRoles.includes(req.user.role)) {
            // Log de seguridad para auditoría interna
            console.warn(`🚨 Violación de Acceso: El usuario [${req.user.documentNumber}] intentó acceder a una ruta de rol [${allowedRoles.join('|')}]. Rol actual: ${req.user.role}`);
            
            res.status(403).json({ 
                success: false,
                code: 'FORBIDDEN_ACCESS',
                error: `Acceso denegado. Tus credenciales no tienen los privilegios necesarios para esta acción.` 
            });
            return;
        }

        next();
    };
};