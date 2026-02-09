import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs'; // <--- IMPORTANTE: Necesario para cambiar contraseñas

export class UserController {

    // ---------------------------------------------------------
    // ZONA ADMIN (Gestión de equipos)
    // ---------------------------------------------------------

    // ADMIN: Obtener todo el equipo
    static getTeam = async (req: Request, res: Response) => {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
                order: [['createdAt', 'DESC']]
            });
            
            // Generar iniciales virtualmente
            const data = users.map(user => {
                const names = user.name.split(' ');
                const initials = names.length > 1 
                    ? `${names[0][0]}${names[1][0]}`.toUpperCase() 
                    : user.name.slice(0, 2).toUpperCase();
                
                return { ...user.dataValues, initials };
            });

            res.json(data);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener equipo' });
        }
    }

    // ADMIN: Crear usuario (Invitar)
    static createUser = async (req: Request, res: Response) => {
        try {
            const { email, password, name, role, phone } = req.body;
            
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Faltan datos obligatorios' });
            }

            const exists = await User.findOne({ where: { email } });
            if (exists) return res.status(400).json({ error: 'El usuario ya existe' });

            const user = await User.create(req.body);
            
            res.status(201).json({ 
                message: 'Usuario creado', 
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatarColor: user.avatarColor
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    }

    // ADMIN: Eliminar usuario
    static deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            // Protección: No borrarse a sí mismo
            if (req.user?.id === Number(id)) {
                return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
            }

            const deleted = await User.destroy({ where: { id: Number(id) } });
            
            if (!deleted) return res.status(404).json({ error: 'Usuario no encontrado' });

            res.json({ message: 'Usuario eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar' });
        }
    }

    // ADMIN: Actualizar usuario (Rol, Estatus, Datos)
    static updateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, role, status, phone } = req.body;

            const user = await User.findByPk(Number(id));
            
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

            // Actualizamos solo los campos enviados
            if (name) user.name = name;
            if (role) user.role = role;
            if (status) user.status = status;
            if (phone) user.phone = phone;

            await user.save();

            const userResponse = user.toJSON(); 
            delete userResponse.password;

            res.json({ message: 'Usuario actualizado', user: userResponse });
        } catch (error) {
            console.error(error); 
            res.status(500).json({ error: 'Error al actualizar' });
        }
    }

    // ---------------------------------------------------------
    // ZONA PERSONAL (Mi Perfil y Seguridad)
    // ---------------------------------------------------------

    // PÚBLICO: Obtener MI perfil
    static getProfile = async (req: Request, res: Response) => {
        if (!req.user) return res.status(401).json({ error: 'No autenticado' });
        
        // Devolvemos el usuario limpio (sin password)
        const userResponse = req.user.toJSON();
        delete userResponse.password;
        
        res.json(userResponse);
    }

    // PÚBLICO: Actualizar MI perfil (Nombre, Teléfono)
    static updateProfile = async (req: Request, res: Response) => {
        try {
            const user = req.user!; // El usuario autenticado
            const { name, phone } = req.body;

            if (name) user.name = name;
            if (phone) user.phone = phone;

            await user.save();

            const userResponse = user.toJSON();
            delete userResponse.password;

            res.json({ message: 'Perfil actualizado', user: userResponse });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar perfil' });
        }
    }

    // PÚBLICO: Cambiar MI contraseña
    static changePassword = async (req: Request, res: Response) => {
        try {
            const user = req.user!;
            const { currentPassword, newPassword } = req.body;

            // 1. Verificar contraseña actual
            const isMatch = await user.checkPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }

            // 2. Encriptar nueva contraseña
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            
            await user.save();

            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al cambiar contraseña' });
        }
    }
}