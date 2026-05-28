const { getDashboardStats } = require('../controllers/adminDashboardController');
const pool = require('../db');

jest.mock('../db', () => ({
    query: jest.fn()
}));

describe('adminDashboardController - getDashboardStats', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    it('dashboard statistics', async () => {
        const mockUsers = [{ total: 10 }];
        const mockSubs = [{ total: 5 }];
        const mockReportsCount = [{ total: 2 }];
        const mockRecentReports = [
            { report_id: 'r1', reporter_name: 'User A', category: 'Category A', status: 'Pending', created_at: '2026-05-25' }
        ];
        const mockCategories = [{ name: 'Umum', value: 10 }];

        pool.query.mockImplementation((sql) => {
            if (sql.includes("role = 'Pengguna'")) {
                return Promise.resolve([mockUsers]);
            }
            if (sql.includes("status = 'Active'")) {
                return Promise.resolve([mockSubs]);
            }
            if (sql.includes("created_at >= NOW()")) {
                return Promise.resolve([mockReportsCount]);
            }
            if (sql.includes("FROM reports r")) {
                return Promise.resolve([mockRecentReports]);
            }
            if (sql.includes("GROUP BY category_status")) {
                return Promise.resolve([mockCategories]);
            }
            return Promise.resolve([[]]);
        });

        await getDashboardStats(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Berhasil mengambil data statistik dashboard",
            data: {
                stats: {
                    total_users: 10,
                    active_subscriptions: 5,
                    new_reports: 2,
                    conversion_rate: 50
                },
                recent_reports: mockRecentReports,
                user_categories: mockCategories
            }
        });
    });

    it('pembagian dengan 0 jika total pengguna 0', async () => {
        const mockUsers = [{ total: 0 }];
        const mockSubs = [{ total: 0 }];
        const mockReportsCount = [{ total: 0 }];
        const mockRecentReports = [];
        const mockCategories = [];

        pool.query.mockImplementation((sql) => {
            if (sql.includes("role = 'Pengguna'")) return Promise.resolve([mockUsers]);
            if (sql.includes("status = 'Active'")) return Promise.resolve([mockSubs]);
            if (sql.includes("created_at >= NOW()")) return Promise.resolve([mockReportsCount]);
            if (sql.includes("FROM reports r")) return Promise.resolve([mockRecentReports]);
            if (sql.includes("GROUP BY category_status")) return Promise.resolve([mockCategories]);
            return Promise.resolve([[]]);
        });

        await getDashboardStats(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                stats: expect.objectContaining({
                    conversion_rate: 0
                })
            })
        }));
    });
});
