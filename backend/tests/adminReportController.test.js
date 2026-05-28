const {
    getAllReports,
    updateReportStatus,
    deleteReport
} = require('../controllers/adminReportController');
const pool = require('../db');

jest.mock('../db', () => ({
    execute: jest.fn(),
    query: jest.fn()
}));

jest.mock('../routes/authRoutes', () => ({
    report: jest.fn()
}));

describe('adminReportController', () => {
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

    describe('getAllReports', () => {
        it('mengambil semua laporan', async () => {
            const mockReports = [
                { report_id: 'r1', reporter_name: 'User A', category: 'General', stop_name: 'Stop X', description: 'Desc X', status: 'Pending', created_at: '2026-05-25', resolved_by: null }
            ];
            pool.execute.mockResolvedValueOnce([mockReports]);

            await getAllReports(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil semua laporan.",
                data: mockReports
            });
        });
    });

    describe('updateReportStatus', () => {
        it('mengembalikan status 400 jika report_id atau status kosong', async () => {
            req.body = { report_id: 'r1' };
            req.user.user_id = 'admin1';

            await updateReportStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "ID Laporan dan Status harus diisi!"
            });
        });

        it('mengembalikan status 400 jika status invalid', async () => {
            req.body = { report_id: 'r1', status: 'InvalidStatus' };
            req.user.user_id = 'admin1';

            await updateReportStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Status tidak valid! Gunakan: Pending, Proccessed atau Resolved."
            });
        });

        it('update status menjadi Pending/Processed', async () => {
            req.body = { report_id: 'r1', status: 'Processed' };
            req.user.user_id = 'admin1';
            pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateReportStatus(req, res);

            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE reports SET status = ? WHERE report_id = ?'),
                ['Processed', 'r1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Status laporan berhasil diperbarui!"
            });
        });

        it('update status dan resolved_by untuk status diselesaikan oleh', async () => {
            req.body = { report_id: 'r1', status: 'Resolved' };
            req.user.user_id = 'admin1';
            pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateReportStatus(req, res);

            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE reports SET status = ?, resolved_by = ? WHERE report_id = ?'),
                ['Resolved', 'admin1', 'r1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Status laporan berhasil diperbarui!"
            });
        });

        it('mengembalikan status 404 jika laporan yang ingin di update tidak ditemukan', async () => {
            req.body = { report_id: 'r99', status: 'Processed' };
            req.user.user_id = 'admin1';
            pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateReportStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Laporan tidak ditemukan."
            });
        });
    });

    describe('deleteReport', () => {
        it('menghapus laporan', async () => {
            req.params.id = 'r1';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await deleteReport(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM reports WHERE report_id = ?'),
                ['r1']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Laporan berhasil dihapus secara permanen!"
            });
        });

        it('mengembalikan status 404 jika laporan yang ingin di hapus tidak ditemukan', async () => {
            req.params.id = 'r99';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await deleteReport(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Laporan tidak ditemukan atau sudah dihapus."
            });
        });
    });
});
