const {
    getAllAdmins,
    assignAdminRole,
    updateAdmin,
    removeAdminAccess,
    changePassword
} = require('../controllers/adminManageController');
const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

describe('adminManageController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getAllAdmins', () => {
        it('mengambil semua data admin', async () => {
            const mockAdmins = [{ user_id: 'a1', username: 'admin1', email: 'a1@test.com', role: 'Admin', is_active: 1 }];
            pool.query.mockResolvedValueOnce([mockAdmins]);

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil data admin",
                total_admins: 1,
                data: mockAdmins
            });
        });
    });

    describe('assignAdminRole', () => {
        it('mengembalikan status 400 jika email atau kata sandi kosong', async () => {
            req.body = { email: 'admin@test.com' }; // missing password

            await assignAdminRole(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email dan password harus diisi!"
            });
        });

        it('mengembalikan status 400 email telah terdaftar', async () => {
            req.body = { email: 'admin@test.com', password: 'password123' };
            pool.query.mockResolvedValueOnce([[{ user_id: 'u1' }]]);

            await assignAdminRole(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Email sudah terdaftar! Silakan gunakan email lain untuk membuat admin baru."
            });
        });

        it('assign admin role', async () => {
            req.body = { email: 'admin@test.com', password: 'password123' };
            pool.query.mockResolvedValueOnce([[]]);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            jest.spyOn(crypto, 'randomUUID').mockReturnValue('random-uuid');
            pool.query.mockResolvedValueOnce([]); 

            await assignAdminRole(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('INSERT INTO users'),
                ['random-uuid', 'admin', 'admin@test.com', 'hashedPassword']
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Admin baru berhasil ditambahkan.",
                data: {
                    user_id: 'random-uuid',
                    username: 'admin',
                    email: 'admin@test.com',
                    new_role: 'Admin'
                }
            });
        });
    });

    describe('updateAdmin', () => {
        it('mengembalikan status 400 jika username atau status kosong', async () => {
            req.params.id = 'admin-id';
            req.body = { username: 'newname' };

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Username dan status harus diisi!"
            });
        });

        it('update data admin', async () => {
            req.params.id = 'admin-id';
            req.body = { username: 'newname', status: 1 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data admin berhasil diperbarui"
            });
        });

        it('mengembalikan status 404 jika admin yang ingin diupdate tidak ditemukan', async () => {
            req.params.id = 'admin-id';
            req.body = { username: 'newname', status: 1 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Admin tidak ditemukan atau gagal diperbarui."
            });
        });
    });

    describe('removeAdminAccess', () => {
        it('mencabut hak akses admin', async () => {
            req.params.id = 'admin-id';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await removeAdminAccess(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akses admin berhasil dicabut. Akun kembali menjadi Pengguna"
            });
        });

        it('mengembalikan status 404 jika admin yang ingin dicabut tidak ditemukan', async () => {
            req.params.id = 'admin-id';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await removeAdminAccess(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Admin tidak ditemukan."
            });
        });
    });

    describe('changePassword', () => {
        it('mengembalikan status 400 jika kata sandi lama atau kata sandi baru kosong', async () => {
            req.user.user_id = 'admin-id';
            req.body = { old_password: 'old' }; // missing new_password

            await changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password lama dan password baru harus diisi!"
            });
        });

        it('mengembalikan status 404 jika data admin tidak ditemukan', async () => {
            req.user.user_id = 'admin-id';
            req.body = { old_password: 'old', new_password: 'new' };
            pool.query.mockResolvedValueOnce([[]]);

            await changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Admin tidak ditemukan."
            });
        });

        it('mengembalikan status 401 jika kata sandi lama tidak cocok', async () => {
            req.user.user_id = 'admin-id';
            req.body = { old_password: 'old', new_password: 'new' };
            pool.query.mockResolvedValueOnce([[{ password: 'hashedOldPassword' }]]);
            bcrypt.compare.mockResolvedValueOnce(false);

            await changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password lama salah!"
            });
        });

        it('mengubah kata sandi', async () => {
            req.user.user_id = 'admin-id';
            req.body = { old_password: 'old', new_password: 'new' };
            pool.query.mockResolvedValueOnce([[{ password: 'hashedOldPassword' }]]);
            bcrypt.compare.mockResolvedValueOnce(true);
            bcrypt.hash.mockResolvedValueOnce('hashedNewPassword');
            pool.query.mockResolvedValueOnce([]);

            await changePassword(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith('old', 'hashedOldPassword');
            expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('UPDATE users SET password = ?'),
                ['hashedNewPassword', 'admin-id']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password berhasil diubah!"
            });
        });
    });
});
