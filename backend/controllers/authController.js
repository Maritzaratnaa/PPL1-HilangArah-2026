const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db'); 

// ==============================
// LOGIKA REGISTER
// ==============================
const register = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { username, email, password, full_name, phone_number, category_status } = req.body;

        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ message: "Username, email, password, dan nama lengkap wajib diisi!" });
        }

        await connection.beginTransaction();

        const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: "Email sudah digunakan!" });
        }

        const user_id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'Pengguna';

        await connection.query(
            'INSERT INTO users (user_id, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
            [user_id, email, username, hashedPassword, role]
        );

        const profile_id = crypto.randomUUID();
        const phone = phone_number || null;
        const category = category_status || null;

        await connection.query(
            'INSERT INTO profiles (profile_id, user_id, full_name, phone_number, category_status) VALUES (?, ?, ?, ?, ?)',
            [profile_id, user_id, full_name, phone, category]
        );

        await connection.commit();
        res.status(201).json({ message: "Registrasi berhasil!" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
};

// ==============================
// LOGIKA LOGIN
// ==============================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password harus diisi!" });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        const user = users[0];

        if (!user.is_Active) {
            return res.status(403).json({ message: "Akun ini sudah dinonaktifkan." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: "Login berhasil!", token: token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

module.exports = {
    register,
    login
};