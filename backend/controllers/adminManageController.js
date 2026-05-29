const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); 

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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({message: "Email dan password harus diisi!"});
        }

        const checkQuery = `SELECT user_id FROM users WHERE email = ?`;
        const [existingUsers] = await pool.query(checkQuery, [email]);
    
        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: "Email sudah terdaftar! Silakan gunakan email lain untuk membuat admin baru."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const username = email.split('@')[0];
        
        const newUserId = crypto.randomUUID(); 

        const insertQuery = `INSERT INTO users (user_id, username, email, password, role, is_active, is_verified) VALUES (?, ?, ?, ?, 'Admin', 1, 1)`; 
        await pool.query(insertQuery, [newUserId, username, email, hashedPassword]);

        res.status(201).json({
            message: "Admin baru berhasil ditambahkan.",
            data: {
                user_id: newUserId,
                username: username,
                email: email,
                new_role: 'Admin'
            }
        });
    }
    catch (error) {
        console.error("Error Create Admin: ", error);
        res.status(500).json({message: "Terjadi kesalahan pada server saat menambahkan admin baru."});
    }
};

const updateAdmin = async (req, res) => {
    try {
        const {id} = req.params;
        const {username, status} = req.body;

        if (!username || !status) {
            return res.status(400).json({message: "Username dan status harus diisi!"});
        }

        const query = `UPDATE users SET username = ?, is_active = ? WHERE user_id = ? AND role = 'Admin'`;
        const [result] = await pool.query(query, [username, status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({message: "Admin tidak ditemukan atau gagal diperbarui."});
        }

        res.status(200).json({message: "Data admin berhasil diperbarui"})
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

const changePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({ message: "Password lama dan password baru harus diisi!" });
        }

        const [users] = await pool.query(`SELECT password FROM users WHERE user_id = ?`, [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Admin tidak ditemukan." });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password lama salah!" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(`UPDATE users SET password = ? WHERE user_id = ?`, [hashedPassword, userId]);

        res.status(200).json({ message: "Password berhasil diubah!" });
    } catch (error) {
        console.error("Error Change Password:", error);
        res.status(500).json({ message: "Gagal mengubah password." });
    }
};

module.exports = {getAllAdmins, assignAdminRole, updateAdmin, removeAdminAccess, changePassword};