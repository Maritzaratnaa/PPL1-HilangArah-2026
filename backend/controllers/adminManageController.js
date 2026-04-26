const pool = require('../db');
const bcrypt = require('bcrypt');

const getAllAdmins = async (req, res) => {
    try {
        const query = `
            SELECT user_id, username, email, role, is_active
            FROM users
            WHERE role = 'Admin'`;
        const [admins] = await pool.query(query);

        res.status(200).json({
            message: "Berhasil mengambil data admin",
            total_admins: admins.length,
            data: admins
        });
    }
    catch (error) {
        console.error("Error Get Admins: ", error);
        res.status(500).json({message: "Gagal mengambil daftar admin."});
    }
};

const assignAdminRole = async (req, res) => {
    try {
        const { target_user_id } = req.body;

        if (!target_user_id) {
            return res.status(400).json({message: "ID User target harus disertakan!"});
        }

        // Cek target user di database
        const checkQuery = `SELECT username, role FROM users WHERE user_id = ?`;
        const [users] = await pool.query(checkQuery, [target_user_id]);
    
        if (users.length === 0) {
            return res.status(404).json({message: "User tidak ditemukan di database."});
        }

        const targetUser = users[0];

        // Cek apakah user sudah menjadi admin
        if (targetUser.role === 'Admin') {
            return res.status(400).json({
                message: `User ${targetUser.username} sudah memiliki akses Admin.`
            });
        }

        // Update role user
        const updateQuery = `UPDATE users SET role = 'Admin' Where user_id = ?`;
        await pool.query(updateQuery, [target_user_id]);

        res.status(200).json({
            message: "Role user telah berhasil diubah.",
            data: {
                username: targetUser.username,
                new_role: 'Admin'
            }
        });
    }

    catch (error) {
        console.error("Error Assign Admin Role: ", error);
        res.status(500).json({message: "Terjadi kesalahan apda server saat mengubah role."});
    }
};

const updateAdmin = async (req, res) => {
    try {
        const {id} = req.params;
        const {username, status} = req.body;

        if (!username || !status) {
            return res.status(400).json({message: "Username dan status harus diisi!"});
        }

        const query = `UPDATE users SET username = ?, status = ? WHERE user_id = ? AND role = 'Admin'`;
        const [result] = await pool.query(query, [username, status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({message: "Admin tidak ditemukan atau gagal diperbarui."});
        }

        res.status(200).json({message: "Admin tidak ditemuka natau gagal diperbarui."})
    }
    catch (error) {
        console.error("Error Update Admin: ", error);
        res.status(500).json({message: "Gagal memperbarui data admin."});
    }
};

const removeAdminAccess = async (req, res) => {
    try {
        const {id} = req.params;
        const query = `UPDATE users SET role = 'Pengguna' WHERE user_id = ? AND role = 'Admin'`;
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({message: "Admin tidak ditemukan."});
        }

        res.status(200).json({message: "Akses admin berhasil dicabut. Akun kembali menjadi Pengguna"});
    }
    catch (error) {
        console.error("Error Remove Admin: ", error);
        res.status(500).json({message: "Gagal mencabut akses admin."});
    }
};

module.exports = {getAllAdmins, assignAdminRole, updateAdmin, removeAdminAccess};