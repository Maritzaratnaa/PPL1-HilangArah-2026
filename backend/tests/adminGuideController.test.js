const {
    getAllGuides,
    getGuideDetail,
    createGuide,
    toggleGuideStatus,
    updateGuide,
    deleteGuide
} = require('../controllers/adminGuideController');
const pool = require('../db');
const autoExpireSubscriptions = require('../utils/autoExpire');

jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('../utils/autoExpire', () => jest.fn());

describe('adminGuideController', () => {
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

    describe('getAllGuides', () => {
        it('mengambil semua pemandu tanpa search query', async () => {
            const mockStats = [{ total_pemandu: 5, tersedia: 3, tidak_tersedia: 2 }];
            const mockGuides = [{ employee_id: 'G-123', full_name: 'Guide A' }];

            pool.query
                .mockResolvedValueOnce([mockStats])
                .mockResolvedValueOnce([mockGuides]);

            await getAllGuides(req, res);

            expect(autoExpireSubscriptions).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil data pemandu",
                data: {
                    stats: { total: 5, tersedia: 3, tidak_tersedia: 2 },
                    list: mockGuides
                }
            });
        });

        it('mengambil data pemandu dengan search query', async () => {
            req.query.search = 'Guide A';
            const mockStats = [{ total_pemandu: 1, tersedia: 1, tidak_tersedia: 0 }];
            const mockGuides = [{ employee_id: 'G-123', full_name: 'Guide A' }];

            pool.query
                .mockResolvedValueOnce([mockStats])
                .mockResolvedValueOnce([mockGuides]);

            await getAllGuides(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('LIKE ?'),
                ['%Guide A%', '%Guide A%', '%Guide A%']
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getGuideDetail', () => {
        it('smengembalikan status 200 dan detail pemandu jika pemandu ditemukan', async () => {
            req.params.employee_id = 'G-123';
            const mockGuide = { employee_id: 'G-123', full_name: 'Guide A' };
            pool.query.mockResolvedValueOnce([[mockGuide]]);

            await getGuideDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil detail",
                data: mockGuide
            });
        });

        it('mengembalikan status 404 jika pemandu tidak ditemukan', async () => {
            req.params.employee_id = 'G-999';
            pool.query.mockResolvedValueOnce([[]]);

            await getGuideDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data pemandu tidak ditemukan."
            });
        });
    });

    describe('createGuide', () => {
        it('mengembalikan status 400 jika required field ada yang kosong', async () => {
            req.body = { full_name: 'Guide B' }; // tanpa nomor telepon, domisili, jenis kelamin

            await createGuide(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Nama, telepon, domisili, dan jenis kelamin wajib diisi!"
            });
        });

        it('mengembalikan status 201 dan menambah pemandu baru', async () => {
            req.body = {
                full_name: 'Guide B',
                phone_number: '081234567890',
                domicile: 'Jakarta',
                gender: 'Laki-laki',
                age: 25,
                detail: 'Pengalaman 5 tahun'
            };
            pool.query.mockResolvedValueOnce([]);

            await createGuide(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Pemandu berhasil ditambahkan!",
                employee_id: expect.stringMatching(/^G-\d{3}$/)
            }));
        });
    });

    describe('toggleGuideStatus', () => {
        it('mengubah status pemandu', async () => {
            req.params.employee_id = 'G-123';
            req.body.is_available = true;
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await toggleGuideStatus(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE guides SET is_available = ?'),
                [1, 'G-123']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Status berhasil diubah."
            });
        });

        it('mengembalikan status 404 jika pemandu yang ingin diubah statusnya tidak ditemukan', async () => {
            req.params.employee_id = 'G-999';
            req.body.is_available = false;
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await toggleGuideStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data pemandu tidak ditemukan."
            });
        });
    });

    describe('updateGuide', () => {
        it('update detail pemandu', async () => {
            req.params.employee_id = 'G-123';
            req.body = {
                full_name: 'Guide Updated',
                phone_number: '081234567890',
                domicile: 'Bandung',
                gender: 'Perempuan',
                age: 26,
                detail: 'Updated detail'
            };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateGuide(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data pemandu berhasil diperbarui!"
            });
        });

        it('mengembalikan status 404 jika pemandu yang ingin di update tidak ditemukan', async () => {
            req.params.employee_id = 'G-999';
            req.body = { full_name: 'Name' };
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateGuide(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data tidak ditemukan."
            });
        });
    });

    describe('deleteGuide', () => {
        it('menghapus data pemandu', async () => {
            req.params.employee_id = 'G-123';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await deleteGuide(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data berhasil dihapus."
            });
        });

        it('mengembalikan status 404 jika pemandu yang ingin dihapus tidak ditemukan', async () => {
            req.params.employee_id = 'G-999';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await deleteGuide(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data tidak ditemukan."
            });
        });
    });
});
