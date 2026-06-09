const pool = require('../db');
const crypto = require('crypto'); 

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.user_id; 
        const { category, stop_id, subs_id, description } = req.body;

        if (!category || !description) {
            return res.status(400).json({ message: "Kategori dan deskripsi laporan wajib diisi." });
        }

        if (category === "Pemandu") {
            
            const subscriptionQuery = `
                SELECT subs_id FROM subs 
                WHERE user_id = ? AND status = 'Active' 
                LIMIT 1
            `;
            const [subscriptionRows] = await pool.query(subscriptionQuery, [reporterId]);

            if (subscriptionRows.length === 0) {
                return res.status(403).json({ 
                    message: "Kategori laporan 'Pemandu' hanya tersedia untuk pengguna yang sedang berlangganan." 
                });
            }
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

const getMyReports = async (req, res) => {
    try {
        const reporterId = req.user.user_id;
        
        const subscriptionQuery = `
            SELECT subs_id FROM subs
            WHERE user_id = ? AND status = 'Active' 
            LIMIT 1
        `;
        const [subscriptionRows] = await pool.query(subscriptionQuery, [reporterId]);
        const isPremiumUser = subscriptionRows.length > 0;

        const query = `
            SELECT 
                r.report_id,
                r.category,
                r.stop_id,
                s.name AS stop_name,
                r.subs_id,
                r.description,
                r.status,
                r.resolved_by,
                r.created_at
            FROM reports r
            LEFT JOIN stops s ON r.stop_id = s.stop_id
            WHERE r.reporter_id = ?
            ORDER BY r.created_at DESC
        `;
        
        const [rows] = await pool.query(query, [reporterId]);

        res.status(200).json({
            message: "Riwayat laporan berhasil diambil.",
            is_premium: isPremiumUser, 
            data: rows
        });
    } catch (error) {
        console.error("Error Get My Reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil laporan." });
    }
};

const getLocationOptions = async (req, res) => {
    try {
        const [stops] = await pool.query(
            `SELECT stop_id AS id, name, address AS detail, 'stop' AS type
             FROM stops
             WHERE is_active = 1
             ORDER BY name ASC`
        );

        const [trans] = await pool.query(
            `SELECT trans_id AS id, name, type AS detail, 'trans' AS type
             FROM trans
             WHERE is_active = 1
             ORDER BY name ASC`
        );

        res.status(200).json({
            message: "Daftar lokasi berhasil diambil.",
            data: {
                stops,
                trans
            }
        });
    } catch (error) {
        console.error("Error Get Location Options:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil daftar lokasi." });
    }
};

module.exports = {
    createReport,
    getMyReports,
    getLocationOptions,
};