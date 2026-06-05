const sendEmail = async (emailTo, otpCode) => {
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
                subject: "Kode Verifikasi Email ARAHIN",
                htmlContent: `
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
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log("📧 [Brevo API] Email OTP berhasil dikirim ke:", emailTo);
        } else {
            console.error("❌ Gagal mengirim via Brevo:", result); 
        }
    } catch (error) {
        console.error("❌ Gagal mengirim email:", error);
    }
};

module.exports = sendEmail;