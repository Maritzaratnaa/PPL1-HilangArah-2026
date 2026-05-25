const pool = require('../db');
const { report } = require('../routes/authRoutes');

// Fungsi Get Laporan
const getAllReports = async (req, res) => {
    try {
        const query =
            `SELECT 
                r.report_id, 
                p.full_name AS reporter_name, 
                r.category, 
                s.name AS stop_name, 
                r.description, 
                r.status, 
                r.created_at, 
                r.resolved_by
            FROM reports r
            LEFT JOIN profiles p ON r.reporter_id = p.user_id
            LEFT JOIN stops s ON r.stop_id = s.stop_id
            ORDER BY r.created_at DESC`;
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

// Hapus Laporan
const deleteReport = async (req, res) => {
    try {
        const {id} = req.params;

        const query = `DELETE FROM reports WHERE report_id = ?`;
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({message: "Laporan tidak ditemukan atau sudah dihapus."});
        }
        res.status(200).json({message: "Laporan berhasil dihapus secara permanen!"});
    }
    catch (error) {
        console.error("Error Delete Report: ", error);
        res.status(500).json({message: "Gagal menghapus laporan dari database."});
    }
};

module.exports = {
    getAllReports,
    updateReportStatus,
    deleteReport
};