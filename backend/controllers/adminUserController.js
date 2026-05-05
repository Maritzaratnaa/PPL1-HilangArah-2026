const pool = require('../db');

// ==========================================
// 1. GET ALL USERS & STATS
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const { search, category } = req.query;

        const statsQuery = `
            SELECT 
                COUNT(*) AS total_users,
                SUM(IF(is_Active = 1, 1, 0)) AS active_users,
                SUM(IF(is_Active = 0, 1, 0)) AS suspended_users
            FROM users
            WHERE role = 'Pengguna'
        `;
        const [statsResult] = await pool.query(statsQuery);

        // Query Tabel (Data Pengguna) dengan JOIN ke tabel profiles
        let tableQuery = `
            SELECT 
                u.user_id, 
                u.email, 
                u.username, 
                u.is_Active, 
                u.created_at,
                p.full_name, 
                p.category_status,
                p.phone_number
            FROM users u
            LEFT JOIN profiles p ON u.user_id = p.user_id
            WHERE u.role = 'Pengguna'
        `;
        const queryParams = [];

        // Filter Pencarian (Nama, Email, Username)
        if (search) {
            tableQuery += ` AND (p.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Filter Kategori (Dari dropdown tab UI)
        if (category && category !== 'All') {
            tableQuery += ` AND p.category_status = ?`;
            queryParams.push(category);
        }

        tableQuery += ` ORDER BY u.created_at DESC`;
        const [users] = await pool.query(tableQuery, queryParams);

        res.status(200).json({
            message: "Berhasil mengambil data pengguna",
            data: {
                stats: {
                    total: statsResult[0].total_users || 0,
                    active: statsResult[0].active_users || 0,
                    suspended: statsResult[0].suspended_users || 0
                },
                list: users
            }
        });

    } catch (error) {
        console.error("❌ Error Get Users:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data pengguna." });
    }
};

// ==========================================
// 2. TOGGLE STATUS AKTIF/SUSPEND
// ==========================================
const toggleUserStatus = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { is_Active } = req.body; // Menerima boolean true/false atau 1/0

        const val = is_Active ? 1 : 0;

        const [result] = await pool.query(
            `UPDATE users SET is_Active = ? WHERE user_id = ? AND role = 'Pengguna'`, 
            [val, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        const statusText = is_Active ? "diaktifkan kembali" : "disuspend";
        res.status(200).json({ message: `Akun pengguna berhasil ${statusText}!` });
    } catch (error) {
        console.error("❌ Error Toggle User Status:", error);
        res.status(500).json({ message: "Gagal mengubah status pengguna." });
    }
};

// ==========================================
// 3. DELETE USER
// ==========================================
const deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Hapus profilnya dulu (untuk mencegah error Foreign Key)
        await pool.query(`DELETE FROM profiles WHERE user_id = ?`, [user_id]);
        
        // Hapus akunnya dari tabel users
        const [result] = await pool.query(`DELETE FROM users WHERE user_id = ? AND role = 'Pengguna'`, [user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        res.status(200).json({ message: "Akun pengguna berhasil dihapus permanen." });
    } catch (error) {
        console.error("❌ Error Delete User:", error);
        res.status(500).json({ message: "Gagal menghapus pengguna. Pastikan pengguna tidak memiliki data terkait lainnya." });
    }
};

module.exports = {
    getAllUsers,
    toggleUserStatus,
    deleteUser
};