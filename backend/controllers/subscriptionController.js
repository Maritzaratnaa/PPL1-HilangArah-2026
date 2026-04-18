const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const midtransClient = require('midtrans-client');

// 1. FUNGSI CREATE (Buat Langganan Baru) - Tidak ada perubahan logika
const createSubscription = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        
        const {
            phone_number,
            emergency_contact_name,
            emergency_contact_phone,
            domicile,
            specific_needs
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

        const insertQuery = `
            INSERT INTO subs 
            (subs_id, user_id, phone_number, emergency_contact_name, emergency_contact_phone, domicile, specific_needs) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(insertQuery, [
            subsId,
            userId,
            phone_number,
            emergency_contact_name,
            emergency_contact_phone,
            domicile,
            specific_needs || null
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

// 2. FUNGSI GET (Ambil Data Langganan) - UPDATE ORDER BY
const getMySubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const query = `
            SELECT 
                s.subs_id, 
                s.status, 
                s.start_date, 
                s.end_date,
                s.specific_needs,
                s.emergency_contact_name,
                g.full_name AS guide_name,
                g.phone_number AS guide_phone
            FROM subs s
            LEFT JOIN guides g ON s.employee_id = g.employee_id
            WHERE s.user_id = ?
            -- PERUBAHAN DI SINI: Prioritaskan Active & Pending
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

        res.status(200).json({
            message: "Data langganan berhasil diambil.",
            data: subs[0]
        });

    } catch (error) {
        console.error("Error Get My Subscription:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data langganan." });
    }
};

// 3. FUNGSI DELETE (Batalkan/Hapus Langganan) - FUNGSI BARU
const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Langsung hapus baris langganan milik user tersebut
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

const activateSubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { subs_id } = req.body;

        // Buat tanggal mulai (hari ini) dan tanggal berakhir (30 hari ke depan)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Format tanggal agar cocok dengan MySQL (YYYY-MM-DD)
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Update database: Ubah status jadi Active, isi start_date dan end_date
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
    isProduction: false, // Ubah ke true nanti kalau sudah rilis
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
                "order_id": subs_id, // Gunakan subs_id sebagai nomor pesanan
                "gross_amount": amount
            },
            "customer_details": {
                "first_name": user.full_name || "User", // Sesuaikan dengan field DB kamu
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

// Pastikan KETIGA fungsi di-export di bagian paling bawah
module.exports = { 
    createSubscription, 
    getMySubscription, 
    cancelSubscription,
    activateSubscription,
    getPaymentToken
};
