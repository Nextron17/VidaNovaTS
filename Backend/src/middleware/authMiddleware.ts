import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Extendemos Express para que reconozca req.user
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// 1. Verificar si está logueado
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization;

    if (!bearer) {
        return res.status(401).json({ error: 'No autorizado. Falta token.' });
    }

    const [, token] = bearer.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number };
        
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// 2. Verificar si tiene PERMISO (Rol)
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Acceso denegado: No tienes permisos suficientes.' 
            });
        }

        next();
    };
};