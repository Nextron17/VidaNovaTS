import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Soporte Vidanova" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("📨 Correo enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return false;
  }
};