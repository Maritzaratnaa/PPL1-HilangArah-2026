const {
    getAllTransports,
    createTransport,
    updateTransport,
    deleteTransport,
    getAllRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    getAllStops,
    createStop,
    updateStop,
    deleteStop,
    getAllRouteStops,
    createRouteStop,
    updateRouteStop,
    deleteRouteStop
} = require('../controllers/adminTransportController');
const pool = require('../db');

jest.mock('../db', () => {
    const conn = {
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        query: jest.fn(),
        release: jest.fn()
    };
    return {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue(conn)
    };
});

describe('adminTransportController', () => {
    let req, res, mockConnection;

    beforeEach(async () => {
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
        mockConnection = await pool.getConnection();
        mockConnection.query.mockReset();
    });

    describe('generateCustomId (via createTransport / createRoute etc.)', () => {
        it('should generate custom ID ending with 001 if no rows found', async () => {
            req.body = { name: 'Bus', type: 'BRT' };
            pool.query.mockResolvedValueOnce([[]]); // for generateCustomId
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // for insert

            await createTransport(req, res);

            expect(pool.query).toHaveBeenNthCalledWith(1,
                expect.stringContaining('SELECT trans_id FROM trans'),
                ['TR-%']
            );
            expect(pool.query).toHaveBeenNthCalledWith(2,
                expect.stringContaining('INSERT INTO trans'),
                ['TR-001', 'Bus', 'BRT', 0, 0, 0, 0, 1]
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should increment custom ID if existing row found', async () => {
            req.body = { name: 'Bus', type: 'BRT' };
            pool.query.mockResolvedValueOnce([[{ trans_id: 'TR-005' }]]); // for generateCustomId
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // for insert

            await createTransport(req, res);

            expect(pool.query).toHaveBeenNthCalledWith(2,
                expect.stringContaining('INSERT INTO trans'),
                ['TR-006', 'Bus', 'BRT', 0, 0, 0, 0, 1]
            );
        });

        it('should return 001 if existing ID is not incrementable', async () => {
            req.body = { name: 'Bus', type: 'BRT' };
            pool.query.mockResolvedValueOnce([[{ trans_id: 'TR-abc' }]]); // for generateCustomId
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // for insert

            await createTransport(req, res);

            expect(pool.query).toHaveBeenNthCalledWith(2,
                expect.stringContaining('INSERT INTO trans'),
                ['TR-001', 'Bus', 'BRT', 0, 0, 0, 0, 1]
            );
        });
    });

    describe('getAllTransports', () => {
        it('should successfully get all transports without type filter', async () => {
            const mockSummary = [{ type: 'BRT', total: 2 }];
            const mockTransports = [{ trans_id: 'TR-001', name: 'Bus A', type: 'BRT' }];
            pool.query
                .mockResolvedValueOnce([mockSummary])
                .mockResolvedValueOnce([mockTransports]);

            await getAllTransports(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil, mengambil data transportasi",
                summary: mockSummary,
                data: mockTransports
            });
        });

        it('should filter transports by type', async () => {
            req.query.type = 'Train';
            const mockSummary = [{ type: 'Train', total: 1 }];
            const mockTransports = [{ trans_id: 'TR-002', name: 'Train A', type: 'Train' }];
            pool.query
                .mockResolvedValueOnce([mockSummary])
                .mockResolvedValueOnce([mockTransports]);

            await getAllTransports(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('WHERE type = ?'),
                ['Train']
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateTransport', () => {
        it('should update transport successfully', async () => {
            req.params.id = 'TR-001';
            req.body = { name: 'New Bus', type: 'BRT', is_low_entry: 1, has_wheelchair_slot: 1, has_priority_seat: 1, has_women_area: 1, is_active: 0 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateTransport(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data transportasi berhasil diubah!"
            });
        });

        it('should return 404 if transport not found to update', async () => {
            req.params.id = 'TR-999';
            req.body = { name: 'New Bus' };
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateTransport(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteTransport', () => {
        it('should delete transport successfully', async () => {
            req.params.id = 'TR-001';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await deleteTransport(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if transport to delete not found', async () => {
            req.params.id = 'TR-999';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await deleteTransport(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getAllRoutes', () => {
        it('should get all routes and their stops', async () => {
            const mockRoutes = [
                { route_id: 'RT-001', route_name: 'Route 1' }
            ];
            const mockRouteStops = [
                { route_stop_id: 1, route_id: 'RT-001', stop_id: 'STP-001', stop_order: 1, est_time_minutes: 5 }
            ];
            pool.query
                .mockResolvedValueOnce([mockRoutes])
                .mockResolvedValueOnce([mockRouteStops]);

            await getAllRoutes(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil data rute",
                total_routes: 1,
                data: [
                    {
                        route_id: 'RT-001',
                        route_name: 'Route 1',
                        route_stops: mockRouteStops
                    }
                ]
            });
        });
    });

    describe('createRoute', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { route_name: 'Route X' }; // missing origin/dest/trans
            mockConnection.query.mockResolvedValueOnce([[]]); // for generateCustomId

            await createRoute(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should successfully create route with route stops in transaction', async () => {
            req.body = {
                route_name: 'Route X',
                origin_stop_id: 'STP-001',
                destination_stop_id: 'STP-002',
                trans_id: 'TR-001',
                is_active: 1,
                route_stops: [
                    { stop_id: 'STP-001', stop_order: 1, est_time_minutes: 0 },
                    { stop_id: 'STP-002', stop_order: 2, est_time_minutes: 10 }
                ]
            };
            
            mockConnection.query
                .mockResolvedValueOnce([[]]) // generateCustomId
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // insert route
                .mockResolvedValueOnce([{ affectedRows: 2 }]); // insert stops

            await createRoute(req, res);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should rollback transaction on db error', async () => {
            req.body = {
                route_name: 'Route X',
                origin_stop_id: 'STP-001',
                destination_stop_id: 'STP-002',
                trans_id: 'TR-001'
            };
            mockConnection.query.mockRejectedValueOnce(new Error('Transaction Error'));

            await createRoute(req, res);

            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateRoute', () => {
        it('should update route and recreate route stops in transaction', async () => {
            req.params.id = 'RT-001';
            req.body = {
                route_name: 'Route Updated',
                origin_stop_id: 'STP-001',
                destination_stop_id: 'STP-002',
                trans_id: 'TR-001',
                is_active: 1,
                route_stops: [{ stop_id: 'STP-001', stop_order: 1, est_time_minutes: 5 }]
            };

            mockConnection.query
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // update route
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // delete old stops
                .mockResolvedValueOnce([{ affectedRows: 1 }]); // insert new stops

            await updateRoute(req, res);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should rollback and return 404 if route to update not found', async () => {
            req.params.id = 'RT-999';
            req.body = { route_name: 'Route', origin_stop_id: 'STP-001', destination_stop_id: 'STP-002', trans_id: 'TR-001' };
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 0 }]); // update fails

            await updateRoute(req, res);

            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteRoute', () => {
        it('should delete route and stops in transaction successfully', async () => {
            req.params.id = 'RT-001';
            mockConnection.query
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // delete stops
                .mockResolvedValueOnce([{ affectedRows: 1 }]); // delete route

            await deleteRoute(req, res);

            expect(mockConnection.commit).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should rollback if route to delete not found', async () => {
            req.params.id = 'RT-999';
            mockConnection.query
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // delete stops
                .mockResolvedValueOnce([{ affectedRows: 0 }]); // delete route fails

            await deleteRoute(req, res);

            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getAllStops', () => {
        it('should get stops summary and list without facility filter', async () => {
            const mockSummary = [{ total_stops: 10, total_with_ramp: 5, total_with_elevator: 2 }];
            const mockStops = [{ stop_id: 'STP-001', name: 'Stop A' }];
            pool.query
                .mockResolvedValueOnce([mockSummary])
                .mockResolvedValueOnce([mockStops]);

            await getAllStops(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil data halte",
                summary: { total: 10, with_ramp: 5, with_elevator: 2 },
                data: mockStops
            });
        });

        it('should filter stops by ramp facility', async () => {
            req.query.facility = 'ramp';
            pool.query
                .mockResolvedValueOnce([[{}]])
                .mockResolvedValueOnce([[]]);

            await getAllStops(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('WHERE has_ramp = 1'),
                []
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should filter stops by elevator facility', async () => {
            req.query.facility = 'elevator';
            pool.query
                .mockResolvedValueOnce([[{}]])
                .mockResolvedValueOnce([[]]);

            await getAllStops(req, res);

            expect(pool.query).toHaveBeenLastCalledWith(
                expect.stringContaining('WHERE has_elevator = 1'),
                []
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('createStop', () => {
        it('should create stop successfully', async () => {
            req.body = { name: 'Stop A', address: 'Jalan A', latitude: 1.0, longitude: 2.0, has_ramp: 1, has_elevator: 0, is_active: 1 };
            pool.query
                .mockResolvedValueOnce([[]]) // generateCustomId
                .mockResolvedValueOnce([{ affectedRows: 1 }]); // insert

            await createStop(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data halte berhasil ditambahkan!"
            });
        });
    });

    describe('updateStop', () => {
        it('should update stop details successfully', async () => {
            req.params.id = 'STP-001';
            req.body = { name: 'Stop New', address: 'Jalan New', latitude: 1.1, longitude: 2.1, has_ramp: 0, has_elevator: 1, is_active: 1 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateStop(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if stop to update not found', async () => {
            req.params.id = 'STP-999';
            req.body = { name: 'Stop New' };
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateStop(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteStop', () => {
        it('should delete stop successfully', async () => {
            req.params.id = 'STP-001';
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await deleteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if stop to delete not found', async () => {
            req.params.id = 'STP-999';
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await deleteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getAllRouteStops', () => {
        it('should return route stops list', async () => {
            const mockStops = [{ route_stop_id: 1, route_id: 'RT-001', stop_id: 'STP-001', stop_order: 1 }];
            pool.query.mockResolvedValueOnce([mockStops]);

            await getAllRouteStops(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Berhasil mengambil data rute stop",
                total_route_stops: 1,
                data: mockStops
            });
        });
    });

    describe('createRouteStop', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { route_id: 'RT-001' }; // missing stop_id and stop_order

            await createRouteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should create route stop successfully', async () => {
            req.body = { route_id: 'RT-001', stop_id: 'STP-001', stop_order: 1, est_time_minutes: 5 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await createRouteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Data rute stop berhasil ditambahkan!"
            });
        });
    });

    describe('updateRouteStop', () => {
        it('should update route stop successfully', async () => {
            req.params.id = 1;
            req.body = { route_id: 'RT-001', stop_id: 'STP-001', stop_order: 2, est_time_minutes: 10 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await updateRouteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if route stop to update not found', async () => {
            req.params.id = 999;
            req.body = { route_id: 'RT-001', stop_id: 'STP-001', stop_order: 2 };
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await updateRouteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteRouteStop', () => {
        it('should delete route stop successfully', async () => {
            req.params.id = 1;
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await deleteRouteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if route stop not found to delete', async () => {
            req.params.id = 999;
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await deleteRouteStop(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
