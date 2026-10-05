const {
    createReport,
    getMyReports,
    getLocationOptions
} = require('../controllers/reportController');
const pool = require('../db');
const crypto = require('crypto');

jest.mock('../db', () => ({
    query: jest.fn()
}));

describe('reportController', () => {
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

    describe('createReport', () => {
        it('should return 400 if category or description is missing', async () => {
            req.user.user_id = 'u1';
            req.body = { category: 'Infrastructure' }; // missing description

            await createReport(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Kategori dan deskripsi laporan wajib diisi."
            });
        });

        it('should return 403 if category is Pemandu and user has no active subscription', async () => {
            req.user.user_id = 'u1';
            req.body = { category: 'Pemandu', description: 'Guide was late' };
            pool.query.mockResolvedValueOnce([[]]); // no active subscription

            await createReport(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: "Kategori laporan 'Pemandu' hanya tersedia untuk pengguna yang sedang berlangganan."
            });
        });

        it('should create Pemandu category report successfully if user has active subscription', async () => {
            req.user.user_id = 'u1';
            req.body = { category: 'Pemandu', description: 'Guide was late', subs_id: 'sub1' };
            jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-report-uuid');
            pool.query.mockResolvedValueOnce([[{ subs_id: 'sub1' }]]); // active subscription found
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert report

            await createReport(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Laporan berhasil dikirim dan menunggu antrean.",
                report_id: 'mock-report-uuid'
            });
        });

        it('should create report successfully', async () => {
            req.user.user_id = 'u1';
            req.body = { category: 'Infrastructure', stop_id: 's1', subs_id: 'sub1', description: 'Broken ramp' };
            jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-report-uuid');
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await createReport(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reports'),
                ['mock-report-uuid', 'u1', 'Infrastructure', 's1', 'sub1', 'Broken ramp']
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Laporan berhasil dikirim dan menunggu antrean.",
                report_id: 'mock-report-uuid'
            });
        });

        it('should handle db error during creation', async () => {
            req.user.user_id = 'u1';
            req.body = { category: 'Infrastructure', description: 'Broken ramp' };
            pool.query.mockRejectedValueOnce(new Error('DB Error'));

            await createReport(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMyReports', () => {
        it('should get all reports for current user successfully (non-premium user)', async () => {
            req.user.user_id = 'u1';
            const mockReports = [{ report_id: 'r1', category: 'Infrastructure', description: 'Broken ramp', status: 'Pending' }];
            pool.query.mockResolvedValueOnce([[]]); // no active subscription (isPremiumUser = false)
            pool.query.mockResolvedValueOnce([mockReports]); // get reports

            await getMyReports(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Riwayat laporan berhasil diambil.",
                is_premium: false,
                data: mockReports
            });
        });

        it('should get all reports for current user successfully (premium user)', async () => {
            req.user.user_id = 'u1';
            const mockReports = [{ report_id: 'r1', category: 'Pemandu', description: 'Good guide', status: 'Pending' }];
            pool.query.mockResolvedValueOnce([[{ subs_id: 'sub1' }]]); // active subscription found (isPremiumUser = true)
            pool.query.mockResolvedValueOnce([mockReports]); // get reports

            await getMyReports(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Riwayat laporan berhasil diambil.",
                is_premium: true,
                data: mockReports
            });
        });

        it('should handle db error and return 500', async () => {
            req.user.user_id = 'u1';
            pool.query.mockRejectedValueOnce(new Error('DB Error'));

            await getMyReports(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Terjadi kesalahan pada server saat mengambil laporan."
            });
        });
    });

    describe('getLocationOptions', () => {
        it('should successfully get location options', async () => {
            const mockStops = [{ id: 's1', name: 'Stop A', detail: 'Address A', type: 'stop' }];
            const mockTransports = [{ id: 't1', name: 'Bus 1', detail: 'BRT', type: 'trans' }];
            pool.query
                .mockResolvedValueOnce([mockStops])
                .mockResolvedValueOnce([mockTransports]);

            await getLocationOptions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Daftar lokasi berhasil diambil.",
                data: {
                    stops: mockStops,
                    trans: mockTransports
                }
            });
        });

        
    });
});
