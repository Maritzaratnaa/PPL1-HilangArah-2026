const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const midtransClient = require('midtrans-client');

// Fungsi Create (Buat Langganan Baru)
const createSubscription = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        
        const {
            phone_number,
            emergency_contact_name,
            emergency_contact_phone,
            domicile,
            specific_needs,
            duration // 1. TANGKAP DURATION DARI FRONTEND
        } = req.body;

        if (!phone_number || !emergency_contact_name || !emergency_contact_phone || !domicile) {
            return res.status(400).json({ message: "Semua kolom yang wajib harus diisi!" });
        }

        const checkQuery = `SELECT status FROM subs WHERE user_id = ? AND status IN ('Pending', 'Active')`;
        const [existingSubs] = await pool.query(checkQuery, [userId]);

        if (existingSubs.length > 0) {
            return res.status(400).json({ 
                message: `Anda sudah memiliki langganan dengan status: ${existingSubs[0].status}. Selesaikan atau tunggu langganan sebelumnya.` 
            });
        }

        const subsId = uuidv4();

        // 2. TAMBAHKAN KOLOM duration PADA QUERY INSERT
        const insertQuery = `
            INSERT INTO subs 
            (subs_id, user_id, phone_number, emergency_contact_name, emergency_contact_phone, domicile, specific_needs, duration) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // 3. MASUKKAN NILAI duration KE DALAM ARRAY PARAMETER
        await pool.query(insertQuery, [
            subsId,
            userId,
            phone_number,
            emergency_contact_name,
            emergency_contact_phone,
            domicile,
            specific_needs || null,
            duration || 'Monthly' // Kasih fallback 'Monthly' buat jaga-jaga kalau kosong
        ]);

        res.status(201).json({
            message: "Formulir langganan berhasil dikirim. Silakan lanjutkan ke pembayaran.",
            subs_id: subsId
        });

    } catch (error) {
        console.error("Error Create Subscription:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat membuat langganan." });
    }
};

// Fungsi Get (Ambil Data Subscription)
const getMySubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const query = `
            SELECT 
                s.subs_id, 
                s.status, 
                s.start_date, 
                s.end_date,
                s.duration, 
                s.specific_needs,
                s.emergency_contact_name,
                GREATEST(DATEDIFF(s.end_date, CURDATE()), 0) AS days_left,
                g.full_name AS guide_name,
                g.phone_number AS guide_phone
            FROM subs s
            LEFT JOIN guides g ON s.employee_id = g.employee_id
            WHERE s.user_id = ?
            ORDER BY 
                FIELD(s.status, 'Active', 'Pending', 'Expired', 'Cancelled') ASC,
                s.start_date DESC 
            LIMIT 1; 
        `;

        const [subs] = await pool.query(query, [userId]);

        if (subs.length === 0) {
            return res.status(404).json({
                message: "Anda belum memiliki riwayat langganan pemandu."
            });
        }

        const subscription = subs[0];

        if (subscription.status === 'Active' && subscription.days_left <= 0) {
            subscription.status = 'Expired';
            await pool.query(`UPDATE subs SET status = 'Expired' WHERE subs_id = ?`, [subscription.subs_id]);
        }

        res.status(200).json({
            message: "Data langganan berhasil diambil.",
            data: subs[0]
        });

    }
    catch (error) {
        console.error("Error Get My Subscription:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data langganan." });
    }
};

// Fungsi Delete (Batalkan/Hapus Langganan)
const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const deleteQuery = `DELETE FROM subs WHERE user_id = ?`;
        const [result] = await pool.query(deleteQuery, [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tidak ada langganan yang ditemukan untuk dibatalkan." });
        }

        res.status(200).json({ message: "Langganan berhasil dibatalkan dan dihapus." });

    } catch (error) {
        console.error("Error Cancel Subscription:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat membatalkan langganan." });
    }
};

// Fungsi Update (Mengaktifkan Langganan)
const activateSubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { subs_id } = req.body;

        // 4. CEK DURATION DULU SEBELUM MENENTUKAN END_DATE
        const checkQuery = `SELECT duration FROM subs WHERE subs_id = ? AND user_id = ?`;
        const [subsData] = await pool.query(checkQuery, [subs_id, userId]);

        if (subsData.length === 0) {
            return res.status(404).json({ message: "Langganan tidak valid." });
        }

        const durationType = subsData[0].duration;
        const startDate = new Date();
        const endDate = new Date();

        // 5. ATUR END_DATE BERDASARKAN DURATION YANG DIPILIH
        if (durationType === 'Daily') {
            endDate.setDate(endDate.getDate() + 1);
        } else if (durationType === 'Weekly') {
            endDate.setDate(endDate.getDate() + 7);
        } else {
            endDate.setDate(endDate.getDate() + 30); // Default ke Monthly
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const updateQuery = `
            UPDATE subs 
            SET status = 'Active', start_date = ?, end_date = ? 
            WHERE subs_id = ? AND user_id = ?
        `;
        
        const [result] = await pool.query(updateQuery, [startStr, endStr, subs_id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Langganan tidak valid atau sudah diaktifkan." });
        }

        res.status(200).json({ message: "Pembayaran berhasil disimulasikan, langganan kini AKTIF." });

    } catch (error) {
        console.error("Error Activate Subscription:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat memproses pembayaran." });
    }
};

const snap = new midtransClient.Snap({
    isProduction: false, // Ubah ke true nanti kalau udah rilis
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Fungsi untuk mendapatkan Token Pembayaran
const getPaymentToken = async (req, res) => {
    try {
        const { subs_id, amount } = req.body;
        const user = req.user; // Dari token JWT

        // Parameter yang dikirim ke Midtrans
        let parameter = {
            "transaction_details": {
                "order_id": subs_id,
                "gross_amount": amount
            },
            "customer_details": {
                "first_name": user.full_name || "User",
                "email": user.email || "user@example.com"
            }
        };

        const transaction = await snap.createTransaction(parameter);
        
        // Kirim token ke frontend
        res.status(200).json({ token: transaction.token });

    } catch (error) {
        console.error("Midtrans Error:", error);
        res.status(500).json({ message: "Gagal membuat token pembayaran" });
    }
};

module.exports = { 
    createSubscription, 
    getMySubscription, 
    cancelSubscription,
    activateSubscription,
    getPaymentToken
};