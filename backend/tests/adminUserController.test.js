const {
    getAllUsers,
    toggleUserStatus,
    deleteUser
} = require('../controllers/adminUserController');
const pool = require('../db');

jest.mock('../db', () => ({
    query: jest.fn()
}));

describe('adminUserController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            params: {},
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should successfully get all users without filters', async () => {
            const mockStats = [{ total_users: 10, active_users: 8, suspended_users: 2 }];
            const mockUsers = [{ user_id: 'u1', username: 'user1', email: 'u1@test.com', is_Active: 1 }];
            pool.query
                .mockResolvedValueOnce([mockStats])
                .mockResolvedValueOnce([mockUsers]);

            await getAllUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil data pengguna",
                data: {
                    stats: { total: 10, active: 8, suspended: 2 },
                    list: mockUsers
                }
            });
        });

        it('should filter users by search and category', async () => {
            req.query.search = 'Alice';
            req.query.category = 'elderly';
            const mockStats = [{ total_users: 1, active_users: 1, suspended_users: 0 }];
            const mockUsers = [{ user_id: 'u1', username: 'alice', email: 'alice@test.com' }];
            pool.query
                .mockResolvedValueOnce([mockStats])
                .mockResolvedValueOnce([mockUsers]);

            await getAllUsers(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('AND (p.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?) AND p.category_status = ?'),
                ['%Alice%', '%Alice%', '%Alice%', 'elderly']
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('toggleUserStatus', () => {
        it('should suspend user account successfully', async () => {
            req.params.user_id = 'u1';
            req.body.is_Active = false;
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await toggleUserStatus(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET is_Active = ? WHERE user_id = ?'),
                [0, 'u1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akun pengguna berhasil disuspend!"
            });
        });

        it('should activate user account successfully', async () => {
            req.params.user_id = 'u1';
            req.body.is_Active = true;
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await toggleUserStatus(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET is_Active = ? WHERE user_id = ?'),
                [1, 'u1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akun pengguna berhasil diaktifkan kembali!"
            });
        });

        it('should return 404 if user not found to toggle status', async () => {
            req.params.user_id = 'u99';
            req.body.is_Active = true;
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await toggleUserStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteUser', () => {
        it('should delete user and all associated records successfully', async () => {
            req.params.user_id = 'u1';
            pool.query
                .mockResolvedValueOnce([]) // delete subs
                .mockResolvedValueOnce([]) // delete profile
                .mockResolvedValueOnce([]) // delete reports
                .mockResolvedValueOnce([{ affectedRows: 1 }]); // delete user

            await deleteUser(req, res);

            expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('DELETE FROM subs'), ['u1']);
            expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM profiles'), ['u1']);
            expect(pool.query).toHaveBeenNthCalledWith(3, expect.stringContaining('DELETE FROM reports'), ['u1']);
            expect(pool.query).toHaveBeenNthCalledWith(4, expect.stringContaining('DELETE FROM users'), ['u1']);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akun pengguna berhasil dihapus permanen."
            });
        });

        it('should return 404 if user to delete not found', async () => {
            req.params.user_id = 'u99';
            pool.query
                .mockResolvedValueOnce([]) // delete subs
                .mockResolvedValueOnce([]) // delete profile
                .mockResolvedValueOnce([]) // delete reports
                .mockResolvedValueOnce([{ affectedRows: 0 }]); // delete user fails

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
