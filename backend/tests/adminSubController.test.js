const {
    getAllSubscriptions,
    getSubscriptionDetail,
    assignGuideToSubscription,
    updateSubscriptionStatus,
    deleteSubscription
} = require('../controllers/adminSubController');
const pool = require('../db');
const autoExpireSubscriptions = require('../utils/autoExpire');

jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('../utils/autoExpire', () => jest.fn());

describe('adminSubController', () => {
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

    describe('getAllSubscriptions', () => {
        it('mengambil semua data subscription tanpa query', async () => {
            const mockSubs = [{ subs_id: 's1', status: 'Active', customer_name: 'User A' }];
            pool.query.mockResolvedValueOnce([mockSubs]);

            await getAllSubscriptions(req, res);

            expect(autoExpireSubscriptions).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil semua data langganan",
                total: 1,
                data: mockSubs
            });
        });

        it('filter subscriptions berdasarkan status dan query', async () => {
            req.query.status = 'Active';
            req.query.search = 'User A';
            const mockSubs = [{ subs_id: 's1', status: 'Active', customer_name: 'User A' }];
            pool.query.mockResolvedValueOnce([mockSubs]);

            await getAllSubscriptions(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('AND s.status = ? AND p.full_name LIKE ?'),
                ['Active', '%User A%']
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getSubscriptionDetail', () => {
        it('mengembalikan detail subscription jika ditemukan', async () => {
            req.params.subs_id = 's1';
            const mockSub = { subs_id: 's1', status: 'Active', customer_name: 'User A' };
            pool.query.mockResolvedValueOnce([[mockSub]]);

            await getSubscriptionDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil detail langganan",
                data: mockSub
            });
        });

        it('mengembalikan statu 404 jika data subscription tidak ditemukan', async () => {
            req.params.subs_id = 's99';
            pool.query.mockResolvedValueOnce([[]]);

            await getSubscriptionDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan tidak ditemukan."
            });
        });
    });

    describe('assignGuideToSubscription', () => {
        it('mengembalikan statu 400 jika employee_id kosong', async () => {
            req.params.subs_id = 's1';
            req.body = {};

            await assignGuideToSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "ID Pemandu (employee_id) wajib diisi!"
            });
        });

        it('mengembalikan statu 404 jika data subscription tidak ditemukan', async () => {
            req.params.subs_id = 's99';
            req.body = { employee_id: 'g1' };
            pool.query.mockResolvedValueOnce([[]]);

            await assignGuideToSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan tidak ditemukan."
            });
        });

        it('mengembalikan statu 400 jika status subscription tidak Active', async () => {
            req.params.subs_id = 's1';
            req.body = { employee_id: 'g1' };
            pool.query.mockResolvedValueOnce([[{ status: 'Pending' }]]);

            await assignGuideToSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Hanya bisa menugaskan pemandu pada langganan yang sudah Aktif (Sudah dibayar)."
            });
        });

        it('menugaskan pemandu dan menandai pemandu tidak tersedia', async () => {
            req.params.subs_id = 's1';
            req.body = { employee_id: 'g1' };
            pool.query.mockResolvedValueOnce([[{ status: 'Active' }]]); // cek sub passes
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update sub
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update pemandu

            await assignGuideToSubscription(req, res);

            expect(pool.query).toHaveBeenNthCalledWith(2,
                expect.stringContaining('UPDATE subs SET employee_id = ? WHERE subs_id = ?'),
                ['g1', 's1']
            );
            expect(pool.query).toHaveBeenNthCalledWith(3,
                expect.stringContaining('UPDATE guides SET is_available = 0 WHERE employee_id = ?'),
                ['g1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil menugaskan pemandu pada langganan ini."
            });
        });

    });

    describe('updateSubscriptionStatus', () => {
        it('mengembalikan statu 400 jika status invalid', async () => {
            req.params.subs_id = 's1';
            req.body = { status: 'InvalidStatus' };

            await updateSubscriptionStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Status tidak valid!"
            });
        });

        it('update status ke Active dan menetapkan tanggan mulai - selesai', async () => {
            req.params.subs_id = 's1';
            req.body = { status: 'Active' };
            pool.query.mockResolvedValueOnce([[{ employee_id: 'g1' }]]); 
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateSubscriptionStatus(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('UPDATE subs SET status = ?, start_date = ?, end_date = ? WHERE subs_id = ?'),
                ['Active', expect.any(String), expect.any(String), 's1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengubah status langganan menjadi Active"
            });
        });

        it('update ke Expired/Cancelled dan pemandu menjadi tersedia jika ada pemandu yang ditugaskan', async () => {
            req.params.subs_id = 's1';
            req.body = { status: 'Expired' };
            pool.query.mockResolvedValueOnce([[{ employee_id: 'g1' }]]); 
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 

            await updateSubscriptionStatus(req, res);

            expect(pool.query).toHaveBeenNthCalledWith(2,
                expect.stringContaining('UPDATE subs SET status = ? WHERE subs_id = ?'),
                ['Expired', 's1']
            );
            expect(pool.query).toHaveBeenNthCalledWith(3,
                expect.stringContaining('UPDATE guides SET is_available = 1 WHERE employee_id = ?'),
                ['g1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('update ke Expired/Cancelled dan tidak membuat pemandu tersedia jika tidak ada pemandu yg ditugaskan', async () => {
            req.params.subs_id = 's1';
            req.body = { status: 'Expired' };
            pool.query.mockResolvedValueOnce([[{ employee_id: null }]]);
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 

            await updateSubscriptionStatus(req, res);

            expect(pool.query).toHaveBeenCalledTimes(2); 
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('mengembalikan statu 404 jika data subscription yang ingin di update tidak ditemukan', async () => {
            req.params.subs_id = 's99';
            req.body = { status: 'Pending' };
            pool.query.mockResolvedValueOnce([[]]); 
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]); 

            await updateSubscriptionStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan tidak ditemukan."
            });
        });
    });

    describe('deleteSubscription', () => {
        it('menghapus data subscription', async () => {
            req.params.subs_id = 's1';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await deleteSubscription(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM subs WHERE subs_id = ?'),
                ['s1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan berhasil dihapus."
            });
        });

        it('mengembalikan statu 404 jika data subscription yang ingin dihapus tidak ditemukan', async () => {
            req.params.subs_id = 's99';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await deleteSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan tidak ditemukan."
            });
        });
    });
});
