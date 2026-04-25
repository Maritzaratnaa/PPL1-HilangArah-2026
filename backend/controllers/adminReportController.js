const pool = require('../db');
const { report } = require('../routes/authRoutes');

// Fungsi Get Laporan
const getAllReports = async (req, res) => {
    try {
        const query =
            `SELECT reports.*, users.email as reporter_email
            FROM reports
            JOIN users ON reports.reporter_id = users.user_id
            ORDER BY reports.created_At DESC`;
        const [reports] = await pool.execute(query);

            res.status(200).json({
            message: "Berhasil mengambil semua laporan.",
            data: reports
        });
    }
    catch (error) {
        res.status(500).json({message: "Gagal mengambil data laporan", error: error.message});
    }
};

// Update Status Laporan
const updateReportStatus = async (req, res) => {
    const {report_id, status} = req.body;
    const admin_id = req.user.user_id;

    if (!report_id || !status) {
        return res.status(400).json({message: "ID Laporan dan Status harus diisi!"});
    }

    const validStatus = ['Pending', 'Processed', 'Resolved'];
    if (!validStatus.includes(status)) {
        return res.status(400).json({
            message: "Status tidak valid! Gunakan: Pending, Proccessed atau Resolved."
        });
    }

    try {
        let query = `UPDATE reports SET status = ? WHERE report_id = ?`;
        let params = [status, report_id];
    
        if (status === 'Resolved') {
            query = 'UPDATE reports SET status = ?, resolved_by = ? WHERE report_id = ?';
            params = [status, admin_id, report_id];
        }
    
        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({message: "Laporan tidak ditemukan."});
        }

        res.status(200).json({message: "Status laporan berhasil diperbarui!"});
    }
    catch (error) {
        res.status(500).json({message: "Gagal memperbarui status", error: error.message});
    }
};

module.exports = {
    getAllReports,
    updateReportStatus
};