const pool = require('../db');
const crypto = require('crypto'); 

const createReport = async (req, res) => {
    try {
        const reporterId = req.user.user_id; 
        const { category, stop_id, subs_id, description, phone_number } = req.body;

        if (!category || !description) {
            return res.status(400).json({ message: "Kategori dan deskripsi laporan wajib diisi." });
        }

        let reportSubscriptionId = null;

        if (category === "Pemandu") {
            if (!subs_id) {
                return res.status(400).json({
                    message: "Pilih langganan aktif dan pemandu yang ingin dilaporkan."
                });
            }

            const subscriptionQuery = `
                SELECT
                    s.subs_id,
                    s.phone_number AS user_phone,
                    s.employee_id,
                    g.full_name AS guide_name,
                    g.phone_number AS guide_phone
                FROM subs s
                LEFT JOIN guides g ON s.employee_id = g.employee_id
                WHERE s.user_id = ? AND s.status = 'Active'
                AND s.subs_id = ?
            `;
            const [subscriptionRows] = await pool.query(subscriptionQuery, [reporterId, subs_id || null]);

            if (subscriptionRows.length === 0) {
                return res.status(403).json({ 
                    message: "Kategori laporan 'Pemandu' hanya tersedia untuk pengguna yang sedang berlangganan." 
                });
            }

            const subscription = subscriptionRows[0];
            if (!subscription.employee_id || !subscription.guide_name) {
                return res.status(409).json({
                    message: "Langganan aktif Anda belum memiliki pemandu yang ditetapkan."
                });
            }

            if (!subscription.user_phone?.trim() || !subscription.guide_phone?.trim()) {
                return res.status(409).json({
                    message: "Nomor kontak pengguna dan pemandu harus tersedia sebelum laporan dikirim."
                });
            }

            reportSubscriptionId = subscription.subs_id;
        }

        const reportId = crypto.randomUUID();

       const query = `
            INSERT INTO reports (report_id, reporter_id, category, stop_id, subs_id, phone_number, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;
        
        await pool.query(query, [
            reportId, 
            reporterId, 
            category, 
            stop_id || null, 
            reportSubscriptionId,
            phone_number || null, // <--- TAMBAHKAN BARIS INI
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

const getGuideOptions = async (req, res) => {
    try {
        const [subscriptions] = await pool.query(
            `SELECT
                s.subs_id,
                s.phone_number AS user_phone,
                s.employee_id,
                g.full_name AS guide_name,
                g.phone_number AS guide_phone
             FROM subs s
             LEFT JOIN guides g ON s.employee_id = g.employee_id
             WHERE s.user_id = ? AND s.status = 'Active'
             ORDER BY s.start_date DESC`,
            [req.user.user_id]
        );

        res.status(200).json({
            message: "Data pemandu langganan berhasil diambil.",
            has_active_subscription: subscriptions.length > 0,
            data: subscriptions
        });
    } catch (error) {
        console.error("Error Get Guide Options:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data pemandu langganan." });
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
                g.full_name AS guide_name,
                g.phone_number AS guide_phone,
                sub.phone_number AS user_phone,
                r.description,
                r.status,
                r.resolved_by,
                r.created_at
            FROM reports r
            LEFT JOIN stops s ON r.stop_id = s.stop_id
            LEFT JOIN subs sub ON r.subs_id = sub.subs_id
            LEFT JOIN guides g ON sub.employee_id = g.employee_id
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
    getGuideOptions,
    getMyReports,
    getLocationOptions,
};