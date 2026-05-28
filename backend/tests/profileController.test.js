const {
    getProfile,
    updateProfile,
    updatePassword
} = require('../controllers/profileController');
const pool = require('../db');
const bcrypt = require('bcrypt');

jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));

describe('profileController', () => {
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

    describe('getProfile', () => {
        it('should get profile details successfully and check subscriber status as active', async () => {
            req.user.user_id = 'u1';
            const mockRow = {
                email: 'u1@test.com',
                full_name: 'User One',
                phone_number: '12345',
                category_status: 'general',
                font_size_pref: 'Medium',
                sub_status: 'Active'
            };
            pool.query.mockResolvedValueOnce([[mockRow]]);

            await getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data profil berhasil diambil.",
                data: {
                    email: 'u1@test.com',
                    full_name: 'User One',
                    phone_number: '12345',
                    category_status: 'general',
                    font_size_pref: 'Medium',
                    sub_status: 'Active',
                    is_subscriber: true
                }
            });
        });

        it('should get profile details and set subscriber status to false if status is not Active', async () => {
            req.user.user_id = 'u1';
            const mockRow = {
                email: 'u1@test.com',
                full_name: 'User One',
                phone_number: '12345',
                category_status: 'general',
                font_size_pref: 'Medium',
                sub_status: 'Expired'
            };
            pool.query.mockResolvedValueOnce([[mockRow]]);

            await getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    is_subscriber: false
                })
            }));
        });

        it('should return 404 if profile is not found', async () => {
            req.user.user_id = 'u99';
            pool.query.mockResolvedValueOnce([[]]);

            await getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Profil tidak ditemukan."
            });
        });

    });

    describe('updateProfile', () => {
        it('should return 400 if full_name is missing', async () => {
            req.user.user_id = 'u1';
            req.body = { category_status: 'elderly' }; // missing full_name

            await updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Nama lengkap wajib diisi."
            });
        });

        it('should successfully update profile', async () => {
            req.user.user_id = 'u1';
            req.body = { full_name: 'Updated Name', phone_number: '12345', category_status: 'elderly', font_size_pref: 'Large' };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateProfile(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE profiles'),
                ['Updated Name', '12345', 'elderly', 'Large', 'u1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Profil berhasil diperbarui."
            });
        });

        it('should return 404 if profile to update not found', async () => {
            req.user.user_id = 'u99';
            req.body = { full_name: 'Updated Name' };
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

    });

    describe('updatePassword', () => {
        it('should return 400 if oldPassword or newPassword is missing', async () => {
            req.user.user_id = 'u1';
            req.body = { oldPassword: 'old' }; // missing newPassword

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if newPassword is less than 6 characters', async () => {
            req.user.user_id = 'u1';
            req.body = { oldPassword: 'old', newPassword: '123' };

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if user not found', async () => {
            req.user.user_id = 'u99';
            req.body = { oldPassword: 'oldpassword', newPassword: 'newpassword' };
            pool.query.mockResolvedValueOnce([[]]); // no user

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 if old password compare fails', async () => {
            req.user.user_id = 'u1';
            req.body = { oldPassword: 'wrongpassword', newPassword: 'newpassword' };
            pool.query.mockResolvedValueOnce([[{ password: 'hashedOldPassword' }]]);
            bcrypt.compare.mockResolvedValueOnce(false); // wrong password

            await updatePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password lama salah!"
            });
        });

        it('should update password successfully', async () => {
            req.user.user_id = 'u1';
            req.body = { oldPassword: 'oldpassword', newPassword: 'newpassword' };
            pool.query.mockResolvedValueOnce([[{ password: 'hashedOldPassword' }]]);
            bcrypt.compare.mockResolvedValueOnce(true);
            bcrypt.hash.mockResolvedValueOnce('hashedNewPassword');
            pool.query.mockResolvedValueOnce([]); // update success

            await updatePassword(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'hashedOldPassword');
            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('UPDATE users SET password = ? WHERE user_id = ?'),
                ['hashedNewPassword', 'u1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Password berhasil diperbarui!"
            });
        });

    });
});
