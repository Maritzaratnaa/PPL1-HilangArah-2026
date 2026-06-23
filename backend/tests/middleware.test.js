const { verifyToken, isAdmin, isMainAdmin } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn(),
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'test-secret';
        jest.clearAllMocks();
    });

    describe('verifyToken', () => {
        it('should return 401 if Authorization header is missing', () => {
            req.header.mockReturnValue(undefined);

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akses ditolak, token tidak ada."
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 if token is invalid or verify throws error', () => {
            req.header.mockReturnValue('Bearer invalidtoken123');
            jwt.verify.mockImplementation(() => {
                throw new Error('invalid token');
            });

            verifyToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('invalidtoken123', 'test-secret');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Token tidak valid!"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next and set req.user if token is valid', () => {
            req.header.mockReturnValue('Bearer validtoken123');
            const mockUser = { user_id: 'u1', role: 'Pengguna' };
            jwt.verify.mockReturnValue(mockUser);

            verifyToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('validtoken123', 'test-secret');
            expect(req.user).toBe(mockUser);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('isAdmin', () => {
        it('should call next if user has Admin role', () => {
            req.user = { role: 'Admin' };

            isAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 403 if user is not Admin', () => {
            req.user = { role: 'Pengguna' };

            isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akses ditolak! Halaman ini khusus Admin."
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 if user is missing', () => {
            req.user = undefined;

            isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isMainAdmin', () => {
        it('should call next if user is Admin and has the main admin email', () => {
            req.user = { role: 'Admin', email: 'arahin.support@gmail.com' };

            isMainAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 403 if user is Admin but email is different', () => {
            req.user = { role: 'Admin', email: 'other.admin@gmail.com' };

            isMainAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: "Akses ditolak! Hanya Admin Utama yang memiliki akses ini."
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 if user is not Admin', () => {
            req.user = { role: 'Pengguna', email: 'arahin.support@gmail.com' };

            isMainAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 if user is missing', () => {
            req.user = undefined;

            isMainAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
