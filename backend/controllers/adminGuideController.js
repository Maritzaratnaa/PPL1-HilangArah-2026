const pool = require('../db');
const crypto = require('crypto');

// ==========================================
// 1. GET ALL GUIDES & STATS (Untuk Tabel & Statistik Atas)
// ==========================================
const getAllGuides = async (req, res) => {
    try {
        const { search } = req.query;

        // Query untuk Statistik (Top Cards)
        const statsQuery = `
            SELECT 
                COUNT(*) AS total_pemandu,
                SUM(IF(status = 'Tersedia', 1, 0)) AS tersedia,
                SUM(IF(status = 'Tidak Tersedia', 1, 0)) AS tidak_tersedia
            FROM guides
        `;
        const [statsResult] = await pool.query(statsQuery);

        // Query untuk Tabel dengan fitur Search
        let tableQuery = `SELECT * FROM guides WHERE 1=1`;
        const queryParams = [];

        if (search) {
            tableQuery += ` AND (full_name LIKE ? OR employee_id LIKE ? OR domicile LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        tableQuery += ` ORDER BY full_name ASC`;
        const [guides] = await pool.query(tableQuery, queryParams);

        res.status(200).json({
            message: "Berhasil mengambil data pemandu",
            data: {
                stats: {
                    total: statsResult[0].total_pemandu || 0,
                    tersedia: statsResult[0].tersedia || 0,
                    tidak_tersedia: statsResult[0].tidak_tersedia || 0
                },
                list: guides
            }
        });

    } catch (error) {
        console.error("❌ Error Get Guides:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data pemandu." });
    }
};

// ==========================================
// 2. GET GUIDE DETAIL
// ==========================================
const getGuideDetail = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const [guide] = await pool.query(`SELECT * FROM guides WHERE employee_id = ?`, [employee_id]);

        if (guide.length === 0) {
            return res.status(404).json({ message: "Data pemandu tidak ditemukan." });
        }

        res.status(200).json({
            message: "Berhasil mengambil detail pemandu",
            data: guide[0]
        });

    } catch (error) {
        console.error("❌ Error Get Guide Detail:", error);
        res.status(500).json({ message: "Terjadi kesalahan server." });
    }
};

// ==========================================
// 3. CREATE NEW GUIDE (+ Tambah Pemandu)
// ==========================================
const createGuide = async (req, res) => {
    try {
        const { full_name, phone_number, domicile } = req.body;

        if (!full_name || !phone_number || !domicile) {
            return res.status(400).json({ message: "Nama, nomor telepon, dan domisili wajib diisi!" });
        }

        // Bikin ID Karyawan unik (Bisa disesuaikan formatnya, misal EMP + 3 digit acak)
        const randomNum = Math.floor(100 + Math.random() * 900);
        const employee_id = `EMP${randomNum}`; 
        // Atau pakai crypto.randomUUID() jika database pakai tipe VARCHAR(36)
        
        const insertQuery = `
            INSERT INTO guides (employee_id, full_name, phone_number, domicile, status) 
            VALUES (?, ?, ?, ?, 'Tersedia')
        `;
        
        await pool.query(insertQuery, [employee_id, full_name, phone_number, domicile]);

        res.status(201).json({ 
            message: "Pemandu berhasil ditambahkan!",
            employee_id: employee_id 
        });

    } catch (error) {
        console.error("❌ Error Create Guide:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat menambah pemandu." });
    }
};

// ==========================================
// 4. TOGGLE STATUS (Aktifkan / Nonaktifkan)
// ==========================================
const toggleGuideStatus = async (req, res) => {
    try {
        const { employee_id } = req.params;
        const { status } = req.body; // 'Tersedia' atau 'Tidak Tersedia'

        if (!['Tersedia', 'Tidak Tersedia'].includes(status)) {
            return res.status(400).json({ message: "Status tidak valid! Gunakan 'Tersedia' atau 'Tidak Tersedia'." });
        }

        const [result] = await pool.query(`UPDATE guides SET status = ? WHERE employee_id = ?`, [status, employee_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data pemandu tidak ditemukan." });
        }

        res.status(200).json({ message: `Status pemandu berhasil diubah menjadi ${status}` });

    } catch (error) {
        console.error("❌ Error Toggle Status:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengubah status pemandu." });
    }
};

// ==========================================
// 5. DELETE GUIDE (Hapus)
// ==========================================
const deleteGuide = async (req, res) => {
    try {
        const { employee_id } = req.params;

        // Cek apakah pemandu sedang melayani langganan aktif
        const [activeSubs] = await pool.query(`SELECT subs_id FROM subs WHERE employee_id = ? AND status = 'Active'`, [employee_id]);
        
        if (activeSubs.length > 0) {
            return res.status(400).json({ message: "Pemandu tidak bisa dihapus karena sedang melayani langganan aktif!" });
        }

        const [result] = await pool.query(`DELETE FROM guides WHERE employee_id = ?`, [employee_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Data pemandu tidak ditemukan." });
        }

        res.status(200).json({ message: "Data pemandu berhasil dihapus." });

    } catch (error) {
        console.error("❌ Error Delete Guide:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat menghapus data." });
    }
};

module.exports = {
    getAllGuides,
    getGuideDetail,
    createGuide,
    toggleGuideStatus,
    deleteGuide
};