const sendResetEmail = async (emailTo, resetToken) => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { 
                    name: "ARAHIN Support", 
                    email: "arahin.support@gmail.com" 
                },
                to: [{ email: emailTo }],
                subject: "Reset Password Akun ARAHIN",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #007C8A; text-align: center;">Reset Password ARAHIN</h2>
                        <p>Halo,</p>
                        <p>Kami menerima permintaan untuk mereset password akun Anda. Silakan klik tautan di bawah ini untuk membuat password baru:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://frontend-arahin-ht8qd5oc7-maritzas-projects-0fb1535c.vercel.app/#/reset-password?token=${resetToken}" 
                               style="background-color: #007C8A; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                               Reset Password
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #888;">Tautan ini berlaku selama 15 menit. Jika Anda tidak meminta ini, abaikan email ini.</p>
                    </div>
                `
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log("📧 [Brevo API] Email Reset Password berhasil dikirim ke:", emailTo);
        } else {
            console.error("❌ Gagal mengirim reset password via Brevo:", result);
        }
    } catch (error) {
        console.error("❌ Terjadi eror pada fungsi sendResetEmail:", error);
    }
};

module.exports = sendResetEmail;