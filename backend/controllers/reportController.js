const pool = require('../db');
const crypto = require('crypto'); 

// Fungsi 1: Membuat laporan baru
const createReport = async (req, res) => {
    try {
        const reporterId = req.user.user_id; 
        const { category, stop_id, subs_id, description } = req.body;

        if (!category || !description) {
            return res.status(400).json({ message: "Kategori dan deskripsi laporan wajib diisi." });
        }

        const reportId = crypto.randomUUID();

        const query = `
            INSERT INTO reports (report_id, reporter_id, category, stop_id, subs_id, description, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        `;
        
        await pool.query(query, [
            reportId, 
            reporterId, 
            category, 
            stop_id || null, 
            subs_id || null, 
            description
        ]);

        res.status(201).json({
            message: "Laporan berhasil dikirim dan menunggu antrean.",
            report_id: reportId
        });
    } catch (error) {
        console.error("Error Create Report:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengirim laporan." });
    }
};

// Fungsi 2: Mengambil riwayat laporan milik pengguna tersebut
const getMyReports = async (req, res) => {
    try {
        const reporterId = req.user.user_id;
        
        const query = `
            SELECT report_id, category, stop_id, subs_id, description, status, resolved_by, created_at
            FROM reports
            WHERE reporter_id = ?
            ORDER BY created_at DESC
        `;
        
        const [rows] = await pool.query(query, [reporterId]);

        res.status(200).json({
            message: "Riwayat laporan berhasil diambil.",
            data: rows
        });
    } catch (error) {
        console.error("Error Get My Reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil laporan." });
    }
};

module.exports = {
    createReport,
    getMyReports
};