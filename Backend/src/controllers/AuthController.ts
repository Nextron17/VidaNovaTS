import { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Para generar token de recuperación
import { sendEmail } from '../utils/mailer'; // Asegúrate de tener este archivo creado

export class AuthController {

    // --- INICIAR SESIÓN ---
    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            // 1. Buscar usuario
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // 2. Verificar contraseña
            const isPasswordCorrect = await user.checkPassword(password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            // 3. Generar JWT
            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                process.env.JWT_SECRET || 'secret_dev_key', 
                { expiresIn: '8h' }
            );

            // 4. Responder (Sin devolver la contraseña)
            res.json({
                message: 'Autenticación exitosa',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatarColor: user.avatarColor,
                    status: user.status
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
        }
    }

    // --- OLVIDÉ MI CONTRASEÑA ---
    static forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) {
                // Por seguridad, no decimos si el email no existe
                return res.json({ message: 'Si el correo existe, se enviaron las instrucciones.' });
            }

            // 1. Generar token aleatorio
            const token = crypto.randomBytes(20).toString('hex');

            // 2. Guardar token y expiración (1 hora) en la DB
            user.resetPasswordToken = token;
            user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
            await user.save();

            // 3. Crear link (Apunta a tu Frontend)
            // Ajusta el puerto 3000 si tu frontend corre en otro lado
            const resetUrl = `http://localhost:3000/reset-password/${token}`;

            // 4. Enviar correo
            const message = `
                <h1>Recuperación de Contraseña</h1>
                <p>Haz clic en el enlace para restablecer tu contraseña:</p>
                <a href="${resetUrl}" target="_blank">Restablecer Contraseña</a>
                <p>Este enlace expira en 1 hora.</p>
            `;

            await sendEmail(user.email, "Restablecer Contraseña - Vidanova", message);

            res.json({ message: 'Correo de recuperación enviado' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al procesar la solicitud' });
        }
    }
}