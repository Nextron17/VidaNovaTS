import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// 1. Configurar el "Transportador" (Quien envía el correo)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Si usas Outlook, cambias esto por 'hotmail' o 'outlook'
    auth: {
        user: process.env.EMAIL_USER, // Tu correo (ej: vidanova.soporte@gmail.com)
        pass: process.env.EMAIL_PASS  // Tu Contraseña de Aplicación (NO la normal)
    }
});

// 2. Verificar la conexión al iniciar el servidor (Opcional pero muy útil para detectar errores)
transporter.verify().then(() => {
    console.log('📧 [MAILER] Listo para enviar correos.');
}).catch((error) => {
    console.error('❌ [MAILER] Error de conexión:', error.message);
});

// 3. Función principal que exportamos y usamos en el AuthController
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const mailOptions = {
            from: `"Soporte VidaNova" <${process.env.EMAIL_USER}>`, // Remitente visible
            to,       // Destinatario
            subject,  // Asunto
            html      // Cuerpo del correo en HTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado exitosamente a: ${to}`);
        return info;
        
    } catch (error) {
        console.error(`❌ Error al enviar correo a ${to}:`, error);
        throw new Error('No se pudo enviar el correo de recuperación.');
    }
};