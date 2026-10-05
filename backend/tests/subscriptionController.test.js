const {
    createSubscription,
    getMySubscription,
    cancelSubscription,
    activateSubscription,
    getPaymentToken
} = require('../controllers/subscriptionController');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const midtransClient = require('midtrans-client');

jest.mock('midtrans-client');

jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('uuid', () => ({
    v4: jest.fn()
}));

describe('subscriptionController', () => {
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

    describe('createSubscription', () => {
        it('mengembalikan statu 400 jika ada required field yang kosong', async () => {
            req.user.user_id = 'u1';
            req.body = { phone_number: '08123' };

            await createSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Semua kolom yang wajib harus diisi!"
            });
        });

        it('mengembalikan statu 400 jika user sudah memiliki subscription yang akatif/pending', async () => {
            req.user.user_id = 'u1';
            req.body = { phone_number: '08123', emergency_contact_name: 'Contact A', emergency_contact_phone: '08124', domicile: 'Jakarta' };
            pool.query.mockResolvedValueOnce([[{ status: 'Active' }]]); // existing sub

            await createSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Anda sudah memiliki langganan dengan status: Active. Selesaikan atau tunggu langganan sebelumnya."
            });
        });

        it('menambah data subscription baru', async () => {
            req.user.user_id = 'u1';
            req.body = {
                phone_number: '08123',
                emergency_contact_name: 'Contact A',
                emergency_contact_phone: '08124',
                domicile: 'Jakarta',
                specific_needs: 'Wheelchair ramp access',
                duration: 'Monthly'
            };
            pool.query.mockResolvedValueOnce([[]]); 
            uuidv4.mockReturnValueOnce('mock-sub-uuid');
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 

            await createSubscription(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('INSERT INTO subs'),
                ['mock-sub-uuid', 'u1', '08123', 'Contact A', '08124', 'Jakarta', 'Wheelchair ramp access', 'Monthly']
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Formulir langganan berhasil dikirim. Silakan lanjutkan ke pembayaran.",
                subs_id: 'mock-sub-uuid'
            });
        });

    });

    describe('getMySubscription', () => {
        it('mengambil detail subscription', async () => {
            req.user.user_id = 'u1';
            const mockSub = {
                subs_id: 's1',
                status: 'Active',
                days_left: 10,
                duration: 'Monthly'
            };
            pool.query.mockResolvedValueOnce([[mockSub]]);

            await getMySubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan berhasil diambil.",
                data: mockSub
            });
        });

        it('update status ke Expired jika statusnya Active dan sisa hari <= 0', async () => {
            req.user.user_id = 'u1';
            const mockSub = {
                subs_id: 's1',
                status: 'Active',
                days_left: 0,
                duration: 'Monthly'
            };
            pool.query.mockResolvedValueOnce([[mockSub]]);
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await getMySubscription(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining("UPDATE subs SET status = 'Expired' WHERE subs_id = ?"),
                ['s1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data langganan berhasil diambil.",
                data: expect.objectContaining({
                    status: 'Expired'
                })
            });
        });

        it('mengembalikan statu 404 jika tidak ada riwayat subscription', async () => {
            req.user.user_id = 'u1';
            pool.query.mockResolvedValueOnce([[]]);

            await getMySubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Anda belum memiliki riwayat langganan pemandu."
            });
        });

    });

    describe('cancelSubscription', () => {
        it('cancel subscription', async () => {
            req.user.user_id = 'u1';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await cancelSubscription(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM subs WHERE user_id = ?'),
                ['u1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Langganan berhasil dibatalkan dan dihapus."
            });
        });

        it('mengembalikan statu 404 jika subscription yang ingin di cancel tidak ditemukan', async () => {
            req.user.user_id = 'u1';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await cancelSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

    });

    describe('activateSubscription', () => {
        it('mengembalikan statu 404 jika data subscription invalid', async () => {
            req.user.user_id = 'u1';
            req.body = { subs_id: 's99' };
            pool.query.mockResolvedValueOnce([[]]);

            await activateSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Langganan tidak valid."
            });
        });

        it('mengaktifkan subscription harian', async () => {
            req.user.user_id = 'u1';
            req.body = { subs_id: 's1' };
            pool.query.mockResolvedValueOnce([[{ duration: 'Daily' }]]);
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await activateSubscription(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining("UPDATE subs"),
                [expect.any(String), expect.any(String), 's1', 'u1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('mengaktifkan subscription mingguan', async () => {
            req.user.user_id = 'u1';
            req.body = { subs_id: 's1' };
            pool.query.mockResolvedValueOnce([[{ duration: 'Weekly' }]]);
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); 

            await activateSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('mengaktifkan subscription bulanan', async () => {
            req.user.user_id = 'u1';
            req.body = { subs_id: 's1' };
            pool.query.mockResolvedValueOnce([[{ duration: 'Monthly' }]]); 
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await activateSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('mengembalikan status 404 jika update subscription gagal (affectedRows === 0)', async () => {
            req.user.user_id = 'u1';
            req.body = { subs_id: 's1' };
            pool.query.mockResolvedValueOnce([[{ duration: 'Monthly' }]]); 
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]); 

            await activateSubscription(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Langganan tidak valid atau sudah diaktifkan."
            });
        });

    });

    describe('getPaymentToken', () => {
        it('mengembalikan token pembayaran dari midtrans client', async () => {
            req.body = { subs_id: 's1', amount: 50000 };
            req.user = { full_name: 'Alice', email: 'alice@test.com' };
            const spy = jest.spyOn(midtransClient.Snap.prototype, 'createTransaction').mockResolvedValueOnce({ token: 'midtrans-token-xyz' });

            await getPaymentToken(req, res);

            expect(spy).toHaveBeenCalledWith({
                transaction_details: {
                    order_id: 's1',
                    gross_amount: 50000
                },
                customer_details: {
                    first_name: 'Alice',
                    email: 'alice@test.com'
                },
                enabled_payments: ['credit_card']
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                token: 'midtrans-token-xyz'
            });
            spy.mockRestore();
        });

        it('bypass pembayaran jika email adalah akun tester', async () => {
            req.body = { subs_id: 's1', amount: 50000 };
            req.user = { email: 'tester.arahin@gmail.com' }; // Tester email bypass check

            await getPaymentToken(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                token: "TESTER_BYPASS_TOKEN", 
                is_tester: true 
            });
        });

        it('handle error transaksi midtrans dan mengembalikan status 500', async () => {
            req.body = { subs_id: 's1', amount: 50000 };
            req.user = { full_name: 'Alice', email: 'alice@test.com' };
            const spy = jest.spyOn(midtransClient.Snap.prototype, 'createTransaction').mockRejectedValueOnce(new Error('Midtrans Error'));

            await getPaymentToken(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Gagal membuat token pembayaran"
            });
            spy.mockRestore();
        });
    });
});
