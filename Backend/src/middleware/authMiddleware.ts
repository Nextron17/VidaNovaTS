import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { User } from '../models/User';

// EXTENSIÓN DE TIPOS
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// 1. MIDDLEWARE DE AUTENTICACIÓN
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Validación básica de cabecera
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                code: 'AUTH_HEADER_MISSING',
                error: 'No autorizado. Debes enviar un token Bearer.' 
            });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verificación del JWT
        const secret = process.env.JWT_SECRET || 'secret_super_seguro_vidanova';
        const decoded = jwt.verify(token, secret) as { id: number };

        // 3. Verificación contra Base de Datos (Seguridad en tiempo real)
        // Buscamos al usuario para asegurar que no ha sido eliminado o baneado mientras su token seguía "vivo".
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'resetPasswordToken'] }
        });

        if (!user) {
            return res.status(401).json({ 
                code: 'USER_NOT_FOUND',
                error: 'El usuario asociado a este token ya no existe.' 
            });
        }


        // 4. Inyectar usuario en la request y continuar
        req.user = user;
        next();

    } catch (error) {
        // 5. Manejo de Errores Profesional
        if (error instanceof TokenExpiredError) {
            return res.status(401).json({ 
                code: 'TOKEN_EXPIRED',
                error: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' 
            });
        }
        
        if (error instanceof JsonWebTokenError) {
            return res.status(401).json({ 
                code: 'TOKEN_INVALID',
                error: 'Token inválido o manipulado.' 
            });
        }

        // Error inesperado
        console.error('Error de autenticación:', error);
        return res.status(500).json({ error: 'Error interno de autenticación.' });
    }
};

// 2. MIDDLEWARE DE AUTORIZACIÓN
export const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ 
                code: 'Unauthenticated',
                error: 'Usuario no identificado.' 
            });
        }

        // Verificación de Rol
        if (!allowedRoles.includes(req.user.role)) {
            // Log de seguridad (Opcional pero recomendado)
            console.warn(`⛔ Acceso denegado: Usuario ${req.user.documentNumber} (${req.user.role}) intentó acceder a ruta protegida.`);
            
            return res.status(403).json({ 
                code: 'FORBIDDEN_ACCESS',
                error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
};