const pool = require('../db');
const bcrypt = require('bcrypt');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Update Query
        const query = `
            SELECT 
                u.email, 
                p.full_name, 
                p.phone_number, 
                p.category_status, 
                p.font_size_pref,
                s.status AS sub_status 
            FROM users u
            JOIN profiles p ON u.user_id = p.user_id
            LEFT JOIN subs s ON u.user_id = s.user_id
            WHERE u.user_id = ?
        `;

        const [rows] = await pool.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({message: "Profil tidak ditemukan."});
        }

        const userData = rows[0];
        
        const isSubscriber = userData.sub_status === 'Active'; 

        res.status(200).json({
            message: "Data profil berhasil diambil.",
            data: {
                email: userData.email,
                full_name: userData.full_name,
                phone_number: userData.phone_number,
                category_status: userData.category_status,
                font_size_pref: userData.font_size_pref,
                sub_status: userData.sub_status || null,
                is_subscriber: isSubscriber
            }
        });
    }
    catch (error) {
        console.error("Error Get Profile: ", error);
        res.status(500).json({message: "Terjadi kesalahan pada server saat mengambil profil."});
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

const updatePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Password lama dan baru wajib diisi." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password baru harus memiliki minimal 6 karakter." });
        }

        const [users] = await pool.query('SELECT password FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password lama salah!" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedNewPassword, userId]);

        res.status(200).json({ message: "Password berhasil diperbarui!" });
    } catch (error) {
        console.error("Error Update Password:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat memperbarui password." });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updatePassword
};