const pool = require('../db');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const query = `
            SELECT u.email, p.full_name, p.phone_number, p.category_status, p.font_size_pref
            FROM users u
            JOIN profiles p ON u.user_id = p.user_id
            WHERE u.user_id = ?
        `;

        const [rows] = await pool.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({message: "Profil tidak ditemukan."});
        }

        res.status(200).json({
            message: "Data profil berhasil diambil.",
            data: rows[0]
        });
    }
    catch (error) {
        console.error("Error Get Profile: ", error);
        res.status(500).json({message: "Terjadi kesalahan pada server saat mengambil profil."})
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {full_name, phone_number, category_status, font_size_pref} = req.body;

        if (!full_name) {
            return res.status(400).json({message: "Nama lengkap wajib diisi."})
        }

        const query = `
            UPDATE profiles
            SET full_name = ?, phone_number = ?, category_status = ?, font_size_pref = ?
            WHERE user_id = ?
        `;

        const [result] = await pool.query(query, [
            full_name,
            phone_number || null,
            category_status || null,
            font_size_pref || 'Medium',
            userId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({message: "Gagal memperbarui, profil tidak ditemukan."});
        }
        
        res.status(200).json({message: "Profil berhasil diperbarui."});
    }
    catch (error) {
        console.error("Error Update Profile:", error);
        res.status(500).json({message: "Terjadi kesalahan pada server saat memperbarui profil."});
    }
};

module.exports = {
    getProfile,
    updateProfile
};