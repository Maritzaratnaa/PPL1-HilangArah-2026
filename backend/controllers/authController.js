const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const sendEmail = require('../utils/sendEmail');
const sendResetEmail = require('../utils/sendResetEmail');

// Register
const register = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { username, email, password, full_name, phone_number, category_status } = req.body;

        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ message: "Username, email, password, dan nama lengkap wajib diisi!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password harus memiliki minimal 6 karakter!" });
        }

        await connection.beginTransaction();

        const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: "Email sudah terdaftar, silakan gunakan email lain!" });
        }

        const user_id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = 'Pengguna';

        // Kode OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await connection.query(
            'INSERT INTO users (user_id, email, username, password, role, otp_code) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, email, username, hashedPassword, role, otpCode]
        );

        const profile_id = crypto.randomUUID();
        const phone = phone_number || null;
        const category = category_status || null;

        await connection.query(
            'INSERT INTO profiles (profile_id, user_id, full_name, phone_number, category_status) VALUES (?, ?, ?, ?, ?)',
            [profile_id, user_id, full_name, phone, category]
        );

        await connection.commit();

        sendEmail(email, otpCode).catch(console.error);

        console.log("\n=========================================");
        console.log(`[DEV TEST] Kode OTP untuk ${email}: ${otpCode}`);
        console.log("=========================================\n");

        res.status(201).json({
            message: "Registrasi berhasil! Silakan cek email Anda untuk kode OTP.",
            email: email
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error saat register:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    } finally {
        connection.release();
    }
};

// Verifikasi Email
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email dan OTP wajib diisi!" });
        }

        const [users] = await pool.query('SELECT otp_code FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Cek OTP
        if (users[0].otp_code !== otp) {
            return res.status(400).json({ message: "Kode OTP salah atau tidak valid." });
        }

        await pool.query('UPDATE users SET is_verified = 1, otp_code = NULL WHERE email = ?', [email]);

        res.status(200).json({ message: "Verifikasi email berhasil! Silakan login." });

    } catch (error) {
        console.error("Error saat verifikasi:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password harus diisi!" });
        }

        const query = `
            SELECT u.*, p.full_name, p.category_status 
            FROM users u 
            LEFT JOIN profiles p ON u.user_id = p.user_id 
            WHERE u.email = ?
        `;
        const [users] = await pool.query(query, [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Email atau password salah!" });
        }

        const user = users[0];

        // Cek verifikasi akun
        if (user.is_verified === 0) {
            return res.status(403).json({
                message: "Email belum diverifikasi. Silakan cek email Anda untuk kode OTP atau daftar ulang.",
                is_verified: false,
                email: user.email
            });
        }

        if (user.is_Active === 0) {
            return res.status(403).json({
                message: "Akun Anda telah disuspend karena melanggar ketentuan. Silakan hubungi admin ARAHIN."
            });
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

        res.status(200).json({
            message: "Login berhasil!",
            token: token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                category: user.category_status
            }
        });

    } catch (error) {
        console.error("Error saat login:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email wajib diisi!" });
        }

        const [users] = await pool.query('SELECT user_id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Email tidak terdaftar." });
        }

        const user = users[0];

        // Token Reset Password
        const resetToken = jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        sendResetEmail(user.email, resetToken).catch(console.error);

        console.log("\n=========================================");
        console.log(`[DEV TEST] Link Reset Password untuk ${user.email}:`);
        console.log(`http://localhost:8080/reset-password?token=${resetToken}`);
        console.log("=========================================\n");

        res.status(200).json({ message: "Tautan reset password telah dikirim ke email Anda." });

    } catch (error) {
        console.error("Error saat forgot password:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token dan password baru wajib diisi!" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password harus memiliki minimal 6 karakter!" });
        }

        // Verifikasi token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Token tidak valid atau telah kedaluwarsa." });
        }

        const email = decoded.email;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password di database
        await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        res.status(200).json({ message: "Password berhasil diubah!" });

    } catch (error) {
        console.error("Error saat reset password:", error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword
};