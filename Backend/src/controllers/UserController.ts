import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

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

    // ADMIN: Crear usuario (Invitar con Cédula)
    static createUser = async (req: Request, res: Response) => {
        try {
            // ✅ Ahora extraemos documentNumber y el email es opcional
            const { documentNumber, password, name, role, email, phone } = req.body;
            
            // Validación de datos críticos
            if (!documentNumber || !password || !name) {
                return res.status(400).json({ error: 'Cédula, contraseña y nombre son obligatorios' });
            }

            // 1. Verificar si la cédula ya existe
            const existsDoc = await User.findOne({ where: { documentNumber } });
            if (existsDoc) return res.status(400).json({ error: 'Esta cédula ya está registrada' });

            // 2. Verificar email solo si se proporcionó
            if (email && email.trim() !== "") {
                const existsEmail = await User.findOne({ where: { email } });
                if (existsEmail) return res.status(400).json({ error: 'Este correo ya está en uso' });
            }

            // Limpiamos el email si viene como string vacío para que se guarde como NULL
            const userData = {
                ...req.body,
                email: (email && email.trim() !== "") ? email : null
            };

            const user = await User.create(userData);
            
            res.status(201).json({ 
                message: 'Usuario creado exitosamente', 
                user: {
                    id: user.id,
                    name: user.name,
                    documentNumber: user.documentNumber,
                    role: user.role,
                    avatarColor: user.avatarColor
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno al crear usuario' });
        }
    }

    // ADMIN: Eliminar usuario
    static deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
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

    // ADMIN: Actualizar usuario (Incluyendo Cédula si es necesario)
    static updateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, role, status, phone, documentNumber, email } = req.body;

            const user = await User.findByPk(Number(id));
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

            // Actualización de campos
            if (name) user.name = name;
            if (role) user.role = role;
            if (status) user.status = status;
            if (phone) user.phone = phone;
            if (documentNumber) user.documentNumber = documentNumber;
            
            // Manejo especial del email opcional
            if (email !== undefined) {
                user.email = (email && email.trim() !== "") ? email : null;
            }

            await user.save();
            const userResponse = user.toJSON(); 
            delete userResponse.password;

            res.json({ message: 'Usuario actualizado', user: userResponse });
        } catch (error) {
            console.error(error); 
            res.status(500).json({ error: 'Error al actualizar datos' });
        }
    }

    // ---------------------------------------------------------
    // ZONA PERSONAL (Mi Perfil)
    // ---------------------------------------------------------

    static getProfile = async (req: Request, res: Response) => {
        if (!req.user) return res.status(401).json({ error: 'No autenticado' });
        const userResponse = req.user.toJSON();
        delete userResponse.password;
        res.json(userResponse);
    }

    static updateProfile = async (req: Request, res: Response) => {
        try {
            const user = req.user!; 
            const { name, phone, email } = req.body;

            if (name) user.name = name;
            if (phone) user.phone = phone;
            if (email !== undefined) {
                user.email = (email && email.trim() !== "") ? email : null;
            }

            await user.save();
            const userResponse = user.toJSON();
            delete userResponse.password;

            res.json({ message: 'Perfil actualizado', user: userResponse });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar perfil' });
        }
    }

    static changePassword = async (req: Request, res: Response) => {
        try {
            const user = req.user!;
            const { currentPassword, newPassword } = req.body;

            const isMatch = await user.checkPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
            }

            // El hook @BeforeUpdate en el modelo se encargará de encriptar
            user.password = newPassword; 
            await user.save();

            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al cambiar contraseña' });
        }
    }
}