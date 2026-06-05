const nodemailer = require('nodemailer');

const sendResetEmail = async (emailTo, resetToken) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Gunakan port 8080 untuk frontend (sesuai docker-compose)
        const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: '"ARAHIN Support" <${process.env.EMAIL_USER}>',
            to: emailTo,
            subject: 'Reset Password ARAHIN',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #007C8A; text-align: center;">Reset Password ARAHIN</h2>
                    <p>Halo,</p>
                    <p>Kami menerima permintaan untuk mengatur ulang password Anda. Silakan klik tombol di bawah ini untuk membuat password baru:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #007C8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Atur Ulang Password</a>
                    </div>
                    <p>Atau salin dan tempel tautan berikut di browser Anda:</p>
                    <p style="word-break: break-all; color: #007C8A;">${resetLink}</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">Tautan ini akan kedaluwarsa dalam 15 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("📧 Email Reset Password berhasil dikirim ke:", emailTo);
    } catch (error) {
        console.error("❌ Gagal mengirim email reset:", error);
    }
};

module.exports = sendResetEmail;
