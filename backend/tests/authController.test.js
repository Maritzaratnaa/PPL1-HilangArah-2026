const {
    register,
    verifyEmail,
    login,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendResetEmail = require('../utils/sendResetEmail');

jest.mock('../db', () => {
    const conn = {
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        query: jest.fn(),
        release: jest.fn()
    };
    return {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue(conn)
    };
});

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn()
}));

jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue());
jest.mock('../utils/sendResetEmail', () => jest.fn().mockResolvedValue());

describe('authController', () => {
    let req, res, mockConnection;

    beforeEach(async () => {
        req = {
            body: {},
            params: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        process.env.JWT_SECRET = 'test_secret';
        jest.clearAllMocks();
        mockConnection = await pool.getConnection();
        mockConnection.query.mockReset();
    });

    describe('register', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { email: 'test@test.com' }; // missing username, password, full_name

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Username, email, password, dan nama lengkap wajib diisi!"
            });
        });

        it('should return 400 if password is less than 6 characters', async () => {
            req.body = { email: 'test@test.com', username: 'test', password: '123', full_name: 'Test User' };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password harus memiliki minimal 6 karakter!"
            });
        });

        it('should return 409 if email already exists', async () => {
            req.body = { email: 'test@test.com', username: 'test', password: 'password123', full_name: 'Test User' };
            mockConnection.query.mockResolvedValueOnce([[{ user_id: 'u1' }]]); // existing email

            await register(req, res);

            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email sudah terdaftar, silakan gunakan email lain!"
            });
        });

        it('should register successfully and call sendEmail', async () => {
            req.body = {
                email: 'test@test.com',
                username: 'test',
                password: 'password123',
                full_name: 'Test User',
                phone_number: '08123',
                category_status: 'general'
            };
            mockConnection.query.mockResolvedValueOnce([[]]); // no existing email
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            mockConnection.query.mockResolvedValueOnce([]); // insert user
            mockConnection.query.mockResolvedValueOnce([]); // insert profile

            await register(req, res);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(sendEmail).toHaveBeenCalledWith('test@test.com', expect.any(String));
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Registrasi berhasil! Silakan cek email Anda untuk kode OTP.",
                email: 'test@test.com'
            });
        });

        it('should handle DB errors and rollback during registration', async () => {
            req.body = { email: 'test@test.com', username: 'test', password: 'password123', full_name: 'Test User' };
            mockConnection.query.mockRejectedValueOnce(new Error('Transaction Error'));

            await register(req, res);

            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('verifyEmail', () => {
        it('should return 400 if email or otp is missing', async () => {
            req.body = { email: 'test@test.com' }; // missing otp

            await verifyEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if user not found', async () => {
            req.body = { email: 'test@test.com', otp: '123456' };
            pool.query.mockResolvedValueOnce([[]]); // no user found

            await verifyEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Pengguna tidak ditemukan."
            });
        });

        it('should return 400 if OTP is incorrect', async () => {
            req.body = { email: 'test@test.com', otp: '123456' };
            pool.query.mockResolvedValueOnce([[{ otp_code: '654321' }]]); // different otp

            await verifyEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Kode OTP salah atau tidak valid."
            });
        });

        it('should verify email successfully', async () => {
            req.body = { email: 'test@test.com', otp: '123456' };
            pool.query.mockResolvedValueOnce([[{ otp_code: '123456' }]]);
            pool.query.mockResolvedValueOnce([]); // update success

            await verifyEmail(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('UPDATE users SET is_verified = 1, otp_code = NULL'),
                ['test@test.com']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Verifikasi email berhasil! Silakan login."
            });
        });

    });

    describe('login', () => {
        it('should return 400 if email or password is missing', async () => {
            req.body = { email: 'test@test.com' };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 401 if user is not found', async () => {
            req.body = { email: 'test@test.com', password: 'password' };
            pool.query.mockResolvedValueOnce([[]]); // no user

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email atau password salah!"
            });
        });

        it('should return 403 if email is not verified', async () => {
            req.body = { email: 'test@test.com', password: 'password' };
            pool.query.mockResolvedValueOnce([[{ is_verified: 0, email: 'test@test.com' }]]);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email belum diverifikasi. Silakan cek email Anda untuk kode OTP atau daftar ulang.",
                is_verified: false,
                email: 'test@test.com'
            });
        });

        it('should return 403 if user account is suspended', async () => {
            req.body = { email: 'test@test.com', password: 'password' };
            pool.query.mockResolvedValueOnce([[{ is_verified: 1, is_Active: 0 }]]); // inactive

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akun Anda telah disuspend karena melanggar ketentuan. Silakan hubungi admin ARAHIN."
            });
        });

        it('should return 401 if password is invalid', async () => {
            req.body = { email: 'test@test.com', password: 'wrongpassword' };
            pool.query.mockResolvedValueOnce([[{ is_verified: 1, is_Active: 1, password: 'hashedPassword' }]]);
            bcrypt.compare.mockResolvedValueOnce(false); // password fails

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should login successfully and return JWT token', async () => {
            req.body = { email: 'test@test.com', password: 'password' };
            const mockUser = {
                user_id: 'u1',
                username: 'testuser',
                email: 'test@test.com',
                password: 'hashedPassword',
                role: 'Pengguna',
                is_verified: 1,
                is_Active: 1,
                full_name: 'Test User',
                category_status: 'general'
            };
            pool.query.mockResolvedValueOnce([[mockUser]]);
            bcrypt.compare.mockResolvedValueOnce(true);
            jwt.sign.mockReturnValueOnce('mockToken');

            await login(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                { user_id: 'u1', email: 'test@test.com', role: 'Pengguna' },
                'test_secret',
                { expiresIn: '24h' }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Login berhasil!",
                token: 'mockToken',
                user: {
                    id: 'u1',
                    username: 'testuser',
                    email: 'test@test.com',
                    full_name: 'Test User',
                    role: 'Pengguna',
                    category: 'general'
                }
            });
        });

    });

    describe('forgotPassword', () => {
        it('should return 400 if email is missing', async () => {
            req.body = {};

            await forgotPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if email is not registered', async () => {
            req.body = { email: 'unregistered@test.com' };
            pool.query.mockResolvedValueOnce([[]]); // no user

            await forgotPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should generate reset link and send email successfully', async () => {
            req.body = { email: 'registered@test.com' };
            pool.query.mockResolvedValueOnce([[{ user_id: 'u1', email: 'registered@test.com' }]]);
            jwt.sign.mockReturnValueOnce('mockResetToken');

            await forgotPassword(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                { user_id: 'u1', email: 'registered@test.com' },
                'test_secret',
                { expiresIn: '15m' }
            );
            expect(sendResetEmail).toHaveBeenCalledWith('registered@test.com', 'mockResetToken');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Tautan reset password telah dikirim ke email Anda."
            });
        });

    });

    describe('resetPassword', () => {
        it('should return 400 if token or newPassword is missing', async () => {
            req.body = { token: 'token' }; // missing newPassword

            await resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if newPassword is less than 6 characters', async () => {
            req.body = { token: 'token', newPassword: '123' };

            await resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if token is invalid or expired', async () => {
            req.body = { token: 'invalidToken', newPassword: 'password123' };
            jwt.verify.mockImplementationOnce(() => {
                throw new Error('invalid token');
            });

            await resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Token tidak valid atau telah kedaluwarsa."
            });
        });

        it('should reset password successfully', async () => {
            req.body = { token: 'validToken', newPassword: 'password123' };
            jwt.verify.mockReturnValueOnce({ email: 'test@test.com' });
            bcrypt.hash.mockResolvedValueOnce('hashedNewPassword');
            pool.query.mockResolvedValueOnce([]); // update success

            await resetPassword(req, res);

            expect(jwt.verify).toHaveBeenCalledWith('validToken', 'test_secret');
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET password = ? WHERE email = ?'),
                ['hashedNewPassword', 'test@test.com']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password berhasil diubah!"
            });
        });

    });
});
