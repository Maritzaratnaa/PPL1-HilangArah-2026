const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const sendEmail = async (emailTo, otpCode) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ARAHIN Support <onboarding@resend.dev>',
            to: emailTo,
            subject: 'Kode Verifikasi Email ARAHIN',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #007C8A; text-align: center;">Verifikasi Email ARAHIN</h2>
                    <p>Halo,</p>
                    <p>Terima kasih telah mendaftar di ARAHIN. Untuk melanjutkan, masukkan kode OTP 6-digit berikut di aplikasi:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; color: #333;">
                        ${otpCode}
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">Kode ini rahasia. Jangan berikan kepada siapapun.</p>
                </div>
            `
        });

        if (error) {
            console.error("❌ Gagal mengirim via Resend:", error);
            return;
        }

        console.log("📧 [Resend API] Email OTP berhasil dikirim ke:", emailTo, "ID:", data.id);
    } catch (error) {
        console.error("❌ Gagal mengirim email:", error);
    }
};

module.exports = sendEmail;