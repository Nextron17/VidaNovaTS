import nodemailer from 'nodemailer';

export class MailService {
    private static transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        }
    });

    // Ahora recibe la URL completa, ya armada dinámicamente por el Controller
    public static async sendPasswordResetEmail(to: string, resetUrl: string) {
        const mailOptions = {
            from: `"Soporte VidaNova" <${process.env.EMAIL_USER}>`,
            to,
            subject: '🔒 Recuperación de Contraseña - VidaNova',
            html: `
                <div style="font-family: Arial, sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 15px;">
                    <h2 style="color: #0f172a; text-align: center;">Recuperación de Acceso</h2>
                    <p style="color: #475569; font-size: 16px;">Hola,</p>
                    <p style="color: #475569; font-size: 16px;">Has solicitado restablecer tu contraseña en el sistema <strong>VidaNova</strong>. Haz clic en el siguiente botón para crear una nueva (este enlace expira en 1 hora):</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Restablecer mi Contraseña</a>
                    </div>
                    
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">Si no solicitaste este cambio, ignora este correo. Tu cuenta sigue segura.</p>
                </div>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }
}