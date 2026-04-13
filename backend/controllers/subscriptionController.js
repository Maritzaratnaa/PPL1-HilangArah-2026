const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const createSubscription = async (req, res) => {
    try {
        // Ambil user_id dari token JWT (asumsinya kamu pakai middleware auth)
        const userId = req.user.user_id; 
        
        // Ambil data dari body request (inputan dari form frontend)
        const {
            phone_number,
            emergency_contact_name,
            emergency_contact_phone,
            domicile,
            specific_needs
        } = req.body;

        // Validasi Input (Pastikan form tidak kosong)
        if (!phone_number || !emergency_contact_name || !emergency_contact_phone || !domicile) {
            return res.status(400).json({ message: "Semua kolom yang wajib harus diisi!" });
        }

        // Pengecekan: Tidak boleh daftar kalau masih ada subs yang Pending atau Active
        const checkQuery = `SELECT status FROM subs WHERE user_id = ? AND status IN ('Pending', 'Active')`;
        const [existingSubs] = await pool.query(checkQuery, [userId]);

        if (existingSubs.length > 0) {
            return res.status(400).json({ 
                message: `Anda sudah memiliki langganan dengan status: ${existingSubs[0].status}. Selesaikan atau tunggu langganan sebelumnya.` 
            });
        }

        // Buat UUID baru untuk subs_id
        const subsId = uuidv4();

        // Masukkan ke database (employee_id, start_date, end_date dibiarkan NULL dulu)
        // status otomatis jadi 'Pending' karena DEFAULT di database
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

        // Respon sukses ke Frontend
        res.status(201).json({
            message: "Formulir langganan berhasil dikirim. Silakan lanjutkan ke pembayaran.",
            subs_id: subsId
        });

    } catch (error) {
        console.error("Error Create Subscription:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat membuat langganan." });
    }
};

module.exports = { createSubscription };
const getMySubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Ambil data langganan user dan data pemandu (jika sudah di-assign)
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
            ORDER BY s.start_date DESC 
            LIMIT 1; 
        `;

        const [subs] = await pool.query(query, [userId]);

        // Jika user belum pernah mendaftar sama sekali
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

module.exports = { createSubscription, getMySubscription };