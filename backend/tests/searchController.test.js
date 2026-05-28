const { searchRoutes } = require('../controllers/searchController');
const pool = require('../db');

jest.mock('../db', () => ({
    query: jest.fn()
}));

describe('searchController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    it('mengembalikan status 400 jika kolom asal atau tujuan kosong', async () => {
        req.user.user_id = 'u1';
        req.query = { origin: 'Halte A' };

        await searchRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Asal dan tujuan wajib diisi!"
        });
    });

    it('menemukan dan merekomendasikan rute untuk user kategori disabilitas', async () => {
        req.user.user_id = 'u1';
        req.query = { origin: 'Halte A', destination: 'Halte B' };

        const mockProfile = [{ category_status: 'disability' }];
        const mockDirectRoute = [{
            r_id: 'RT-001',
            route_name: 'Route Direct',
            origin_stop_name: 'Halte A',
            destination_stop_name: 'Halte B',
            total_stops: 5,
            total_time: 15,
            trans_name: 'Bus 1',
            trans_type: 'BRT',
            trans_low: 1, // wheelchair friendly
            trans_wheel: 1,
            trans_prio: 0,
            trans_women: 0,
            r_start: 1,
            r_end: 5
        }];
        const mockPath = [
            { stop_name: 'Halte A', latitude: 1.0, longitude: 1.0, has_ramp: true, has_elevator: false }
        ];

        pool.query
            .mockResolvedValueOnce([mockProfile]) 
            .mockResolvedValueOnce([mockDirectRoute]) 
            .mockResolvedValueOnce([mockPath]);

        await searchRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            filter_applied: 'disability',
            data: [
                expect.objectContaining({
                    route_type: "direct",
                    is_recommended: true, // low_entry dan wheelchair_slot ada
                    legs: expect.arrayContaining([
                        expect.objectContaining({
                            route_name: 'Route Direct',
                            route_path: mockPath
                        })
                    ])
                })
            ]
        });
    });

    it('should successfully find transit 1x routes for an elderly user', async () => {
        req.user.user_id = 'u1';
        req.query = { origin: 'Halte A', destination: 'Halte C' };

        const mockProfile = [{ category_status: 'elderly' }];
        const mockTransitRoute = [{
            r1_id: 'RT-001',
            r1_name: 'Route 1',
            t1_name: 'Bus 1',
            t1_type: 'BRT',
            t1_low: 0,
            t1_wheel: 0,
            t1_prio: 1, // priority seat for elderly
            t1_women: 0,
            origin_name: 'Halte A',
            transit_name: 'Transit Stop',
            r1_start: 1,
            r1_end: 3,
            r2_id: 'RT-002',
            r2_name: 'Route 2',
            t2_name: 'Bus 2',
            t2_type: 'BRT',
            t2_low: 0,
            t2_wheel: 0,
            t2_prio: 1, // priority seat
            t2_women: 0,
            dest_name: 'Halte C',
            r2_start: 1,
            r2_end: 4,
            leg1_time: 10,
            leg2_time: 12,
            leg1_stops: 2,
            leg2_stops: 3
        }];
        const mockPath1 = [{ stop_name: 'Halte A' }];
        const mockPath2 = [{ stop_name: 'Transit Stop' }];

        pool.query
            .mockResolvedValueOnce([mockProfile]) // get profile
            .mockResolvedValueOnce([[]]) // direct route empty
            .mockResolvedValueOnce([mockTransitRoute]) // transit 1x
            .mockResolvedValueOnce([mockPath1])
            .mockResolvedValueOnce([mockPath2]);

        await searchRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            filter_applied: 'elderly',
            data: [
                expect.objectContaining({
                    route_type: "transit",
                    is_recommended: true,
                    total_estimated_time: 22
                })
            ]
        });
    });

    it('should successfully find transit 2x routes for a women user', async () => {
        req.user.user_id = 'u1';
        req.query = { origin: 'Halte A', destination: 'Halte D' };

        const mockProfile = [{ category_status: 'women' }];
        const mockTransit2xRoute = [{
            r1_id: 'RT-001', r1_name: 'Route 1', t1_name: 'Bus 1', t1_type: 'BRT',
            t1_low: 0, t1_wheel: 0, t1_prio: 0, t1_women: 1, // women area
            origin_name: 'Halte A', transit1_name: 'Transit Stop 1', r1_start: 1, r1_end: 3,
            r2_id: 'RT-002', r2_name: 'Route 2', t2_name: 'Bus 2', t2_type: 'BRT',
            t2_low: 0, t2_wheel: 0, t2_prio: 0, t2_women: 1,
            transit2_name: 'Transit Stop 2', r2_start: 1, r2_end: 2,
            r3_id: 'RT-003', r3_name: 'Route 3', t3_name: 'Bus 3', t3_type: 'BRT',
            t3_low: 0, t3_wheel: 0, t3_prio: 0, t3_women: 1,
            dest_name: 'Halte D', r3_start: 1, r3_end: 4,
            leg1_time: 8, leg2_time: 5, leg3_time: 12,
            leg1_stops: 2, leg2_stops: 1, leg3_stops: 3
        }];

        pool.query
            .mockResolvedValueOnce([mockProfile]) // profile
            .mockResolvedValueOnce([[]]) // direct empty
            .mockResolvedValueOnce([[]]) // transit 1x empty
            .mockResolvedValueOnce([mockTransit2xRoute]) // transit 2x
            .mockResolvedValueOnce([[]]) // path1
            .mockResolvedValueOnce([[]]) // path2
            .mockResolvedValueOnce([[]]); // path3

        await searchRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            filter_applied: 'women',
            data: expect.arrayContaining([
                expect.objectContaining({
                    is_recommended: true,
                    total_estimated_time: 25
                })
            ])
        }));
    });

    it('should return 404 if no routes are found at all', async () => {
        req.user.user_id = 'u1';
        req.query = { origin: 'Halte A', destination: 'Halte D' };

        pool.query
            .mockResolvedValueOnce([[]]) // profile defaults to Umum
            .mockResolvedValueOnce([[]]) // direct empty
            .mockResolvedValueOnce([[]]) // transit 1x empty
            .mockResolvedValueOnce([[]]); // transit 2x empty

        await searchRoutes(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Rute tidak ditemukan. Pastikan nama halte benar."
        });
    });


});
