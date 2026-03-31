import { Request, Response } from 'express';
import { User } from '../models/User'; 
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize'; 
import { sendEmail } from '../../../core/utils/mailer'; 

export class AuthController {

    // 1. INICIAR SESIÓN (CON CÉDULA)
    static login = async (req: Request, res: Response) => {
        try {
            const { documentNumber, password } = req.body;
            
            // Buscar usuario por documento
            const user = await User.findOne({ where: { documentNumber } });

            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Número de documento no registrado en el sistema.' 
                });
            }

            // Verificar contraseña
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'La contraseña ingresada es incorrecta.' 
                });
            }

            // Generar JWT
            const token = jwt.sign(
                { id: user.id, role: user.role }, 
                process.env.JWT_SECRET || 'secret_dev_key', 
                { expiresIn: '8h' }
            );

            // Responder con estructura unificada para el Frontend
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

    // 2. SOLICITAR RECUPERACIÓN
    static forgotPassword = async (req: Request, res: Response) => {
        try {
            const { documentNumber } = req.body;
            const user = await User.findOne({ where: { documentNumber } });

            if (!user || !user.email) {
                return res.json({ 
                    success: true, 
                    message: 'Si el usuario existe y tiene un correo asociado, recibirá las instrucciones.' 
                });
            }

            const token = crypto.randomBytes(32).toString('hex');
            user.resetToken = token;
            user.resetTokenExpire = new Date(Date.now() + 3600000); // 1 hora
            await user.save();

            // MAGIA DINÁMICA SEGURA (Manejo de TypeScript estricto)
            const referer = req.headers.referer as string | undefined;
            
            let clientUrl = req.headers.origin 
                || (referer ? referer.split('/recuperar')[0] : '') 
                || process.env.FRONTEND_URL 
                || 'http://localhost:3000';
            
            // Limpiar posibles barras finales
            clientUrl = clientUrl.replace(/\/$/, '');

            const resetUrl = `${clientUrl}/recuperar/contrasena?token=${token}`;

            const message = `
                <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #0d9488; text-align: center;">Recuperación de Acceso</h1>
                    <p style="font-size: 16px;">Has solicitado restablecer tu contraseña para el usuario con documento: <b>${user.documentNumber}</b></p>
                    <p style="font-size: 16px;">Haz clic en el siguiente botón para continuar:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Restablecer Contraseña</a>
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `;

            // Enviar correo
            await sendEmail(user.email, "Restablecer Contraseña - VidaNova", message);

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
    
    // 3. CAMBIAR LA CONTRASEÑA
    static resetPassword = async (req: Request, res: Response) => {
        try {
            const { token, newPassword } = req.body;

            // Buscar usuario que tenga ese token EXACTO y que la fecha de expiración sea MAYOR a ahora
            const user = await User.findOne({
                where: {
                    resetToken: token,
                    resetTokenExpire: { [Op.gt]: new Date() } 
                }
            });

            if (!user) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'El enlace de recuperación es inválido o ha caducado.' 
                });
            }

            // Encriptar la nueva contraseña
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            // Limpiar el token
            user.resetToken = null;
            user.resetTokenExpire = null;
            await user.save();

            res.json({ 
                success: true, 
                message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' 
            });
        } catch (error) {
            console.error("❌ Reset Password Error:", error);
            res.status(500).json({ 
                success: false,
                error: 'Error al intentar restablecer la contraseña.' 
            });
        }
    };
}