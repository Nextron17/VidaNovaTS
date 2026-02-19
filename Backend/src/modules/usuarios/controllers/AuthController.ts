import { Request, Response } from 'express';
import { User } from '../../usuarios/models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../../../core/utils/mailer';

export class AuthController {

    // INICIAR SESIÓN (USANDO CC)
    static login = async (req: Request, res: Response) => {
        try {
            const { documentNumber, password } = req.body;
            
            // 1. Buscar usuario por documento
            const user = await User.findOne({ where: { documentNumber } });

            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Número de documento no registrado en el sistema.' 
                });
            }

            // 2. Verificar contraseña
            const isPasswordCorrect = await user.checkPassword(password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'La contraseña ingresada es incorrecta.' 
                });
            }

            // 3. Generar JWT
            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                process.env.JWT_SECRET || 'secret_dev_key', 
                { expiresIn: '8h' }
            );

            // 4. Responder con estructura unificada para el Frontend
            res.json({
                success: true,
                message: 'Autenticación exitosa',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    documentNumber: user.documentNumber,
                    role: user.role,
                    avatarColor: user.avatarColor,
                    status: user.status
                }
            });

        } catch (error) {
            console.error("❌ Login Error:", error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno en el servidor al intentar iniciar sesión.' 
            });
        }
    }

    // RECUPERAR CONTRASEÑA (POR DOCUMENTO)
    static forgotPassword = async (req: Request, res: Response) => {
        try {
            const { documentNumber } = req.body;
            
            // Buscamos por documento ahora
            const user = await User.findOne({ where: { documentNumber } });

            if (!user || !user.email) {
                // Respuesta genérica por seguridad
                return res.json({ 
                    success: true, 
                    message: 'Si el usuario existe y tiene un correo asociado, recibirá instrucciones.' 
                });
            }

            const token = crypto.randomBytes(20).toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = new Date(Date.now() + 3600000); 
            await user.save();

            const resetUrl = `http://localhost:3000/reset-password/${token}`;
            const message = `
                <div style="font-family: sans-serif; color: #333;">
                    <h1 style="color: #2563eb;">Recuperación de Acceso - Vidanova</h1>
                    <p>Has solicitado restablecer tu contraseña para el usuario con documento: <b>${user.documentNumber}</b></p>
                    <p>Haz clic en el siguiente botón para continuar:</p>
                    <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `;

            await sendEmail(user.email, "Restablecer Contraseña - Vidanova", message);

            res.json({ 
                success: true, 
                message: 'Correo de recuperación enviado con éxito.' 
            });

        } catch (error) {
            console.error("❌ Forgot Password Error:", error);
            res.status(500).json({ 
                success: false, 
                error: 'Error al procesar la solicitud de recuperación.' 
            });
        }
    }
}