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

        // 1. Validación básica de cabecera
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ 
                code: 'AUTH_HEADER_MISSING',
                error: 'No autorizado. Debes enviar un token Bearer.' 
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        // 2. Verificación del JWT
        const secret = process.env.JWT_SECRET || 'secret_super_seguro_vidanova';
        const decoded = jwt.verify(token, secret) as { id: number };

        // 3. Verificación contra Base de Datos (Seguridad en tiempo real)
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'resetPasswordToken'] }
        });

        if (!user) {
            res.status(401).json({ 
                code: 'USER_NOT_FOUND',
                error: 'El usuario asociado a este token ya no existe.' 
            });
            return;
        }

        // 4. Inyectar usuario en la request y continuar
        req.user = user;
        next();

    } catch (error) {
        // 5. Manejo de Errores Profesional
        if (error instanceof TokenExpiredError) {
            res.status(401).json({ 
                code: 'TOKEN_EXPIRED',
                error: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' 
            });
            return;
        }
        
        if (error instanceof JsonWebTokenError) {
            res.status(401).json({ 
                code: 'TOKEN_INVALID',
                error: 'Token inválido o manipulado.' 
            });
            return;
        }

        // Error inesperado
        console.error('Error de autenticación:', error);
        res.status(500).json({ error: 'Error interno de autenticación.' });
        return;
    }
};

// 2. MIDDLEWARE DE AUTORIZACIÓN (Renombrado a requireRoles)
export const requireRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ 
                code: 'Unauthenticated',
                error: 'Usuario no identificado.' 
            });
            return;
        }

        // Verificación de Rol
        if (!allowedRoles.includes(req.user.role)) {
            // Log de seguridad (Opcional pero recomendado)
            console.warn(`⛔ Acceso denegado: Usuario ${req.user.documentNumber} (${req.user.role}) intentó acceder a ruta protegida.`);
            
            res.status(403).json({ 
                code: 'FORBIDDEN_ACCESS',
                error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
            });
            return;
        }

        next();
    };
};