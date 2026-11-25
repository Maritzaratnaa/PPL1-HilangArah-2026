const { EventEmitter } = require('events');
const db = require('../db');

jest.mock('../db', () => ({
    query: jest.fn()
}));

jest.mock('child_process');
const { spawn } = require('child_process');

describe('predictionController', () => {
    let req, res;
    let originalFetch;
    let predictionController;

    function createMockProcess({ stdoutData = '', stderrData = '', exitCode = 0, error = null, hang = false } = {}) {
        const proc = new EventEmitter();
        proc.stdout = new EventEmitter();
        proc.stderr = new EventEmitter();
        proc.stdin = {
            write: jest.fn(),
            end: jest.fn()
        };
        proc.kill = jest.fn();

        if (!hang) {
            process.nextTick(() => {
                if (error) {
                    proc.emit('error', error);
                    return;
                }
                if (stdoutData) proc.stdout.emit('data', Buffer.from(stdoutData));
                if (stderrData) proc.stderr.emit('data', Buffer.from(stderrData));
                proc.emit('close', exitCode);
            });
        }

        return proc;
    }

    beforeAll(() => {
        originalFetch = global.fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        // Re-require to ensure fresh state
        predictionController = require('../controllers/predictionController');
    });

    describe('getRoutePrediction', () => {
        it('should handle request when body legs is not an array and weather is found', async () => {
            req.body = {};
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    weather: [{ description: 'hujan ringan' }]
                })
            });

            await predictionController.getRoutePrediction(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [],
                cuaca: 'Hujan ringan'
            });
        });

        it('should fallback to Cerah if weather data is empty', async () => {
            req.body = { legs: [] };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [] })
            });

            await predictionController.getRoutePrediction(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [],
                cuaca: 'Cerah'
            });
        });

        it('should fallback to Cerah Berawan if weather fetch throws an error', async () => {
            req.body = { legs: [] };
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await predictionController.getRoutePrediction(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [],
                cuaca: 'Cerah Berawan'
            });
        });

        it('should skip legs without route_id or halte_id', async () => {
            req.body = {
                legs: [
                    { route_id: 'R1' }, // missing halte_id
                    { halte_id: 'H1' }, // missing route_id
                    {}
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });

            await predictionController.getRoutePrediction(req, res);

            expect(db.query).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [null, null, null],
                cuaca: 'Cerah'
            });
        });

        it('should handle legs where route is not found in database', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-UNKNOWN', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'berawan' }] })
            });
            db.query.mockResolvedValueOnce([[]]); // No route found

            await predictionController.getRoutePrediction(req, res);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [null],
                cuaca: 'Berawan'
            });
        });

        it('should ignore legs where vehicle type cannot be normalized', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-UNKNOWN-VEHICLE', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockResolvedValueOnce([[{ jenis_kendaraan: 'Helikopter' }]]);

            await predictionController.getRoutePrediction(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [null],
                cuaca: 'Cerah'
            });
        });

        it('should successfully predict legs for MRT, LRT, and Bus with various options', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1', offset_menit: 10 },
                    { route_id: 'R-LRT', halte_id: 'H2' }, // without offset_menit
                    { route_id: 'R-BUS', halte_id: 'H3', offset_menit: '15' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'hujan petir' }] })
            });

            db.query
                .mockResolvedValueOnce([[{ jenis_kendaraan: 'MRT Jakarta' }]])
                .mockResolvedValueOnce([[{ jenis_kendaraan: 'LRT Jabodebek' }]])
                .mockResolvedValueOnce([[{ jenis_kendaraan: 'Transjakarta BRT' }]]);

            const mockPythonOutput = [
                { kepadatan: 'Sedang', probabilitas: 0.7 },
                { kepadatan: 'Rendah', probabilitas: 0.9 },
                { kepadatan: 'Tinggi', probabilitas: 0.85 }
            ];

            const mockProc = createMockProcess({
                stdoutData: JSON.stringify(mockPythonOutput),
                exitCode: 0
            });
            spawn.mockReturnValueOnce(mockProc);

            await predictionController.getRoutePrediction(req, res);

            expect(spawn).toHaveBeenCalledTimes(1);
            expect(mockProc.stdin.write).toHaveBeenCalled();
            expect(mockProc.stdin.end).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockPythonOutput,
                cuaca: 'Hujan petir'
            });
        });

        it('should return 500 when python process emits error', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockResolvedValueOnce([[{ jenis_kendaraan: 'MRT' }]]);

            const mockProc = createMockProcess({
                error: new Error('Spawn failed')
            });
            spawn.mockReturnValueOnce(mockProc);

            await predictionController.getRoutePrediction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Prediksi kepadatan gagal'
            });
        });

        it('should return 500 when python process exits with non-zero code and stderr', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockResolvedValueOnce([[{ jenis_kendaraan: 'MRT' }]]);

            const mockProc = createMockProcess({
                stderrData: 'ModuleNotFoundError: No module named joblib',
                exitCode: 1
            });
            spawn.mockReturnValueOnce(mockProc);

            await predictionController.getRoutePrediction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Prediksi kepadatan gagal'
            });
        });

        it('should return 500 when python process exits with non-zero code and no stderr', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockResolvedValueOnce([[{ jenis_kendaraan: 'MRT' }]]);

            const mockProc = createMockProcess({
                exitCode: 2
            });
            spawn.mockReturnValueOnce(mockProc);

            await predictionController.getRoutePrediction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Prediksi kepadatan gagal'
            });
        });

        it('should return 500 when python process returns invalid JSON', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockResolvedValueOnce([[{ jenis_kendaraan: 'MRT' }]]);

            const mockProc = createMockProcess({
                stdoutData: 'Invalid JSON output',
                exitCode: 0
            });
            spawn.mockReturnValueOnce(mockProc);

            await predictionController.getRoutePrediction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Prediksi kepadatan gagal'
            });
        });

        it('should return 500 when database throws an error', async () => {
            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockRejectedValueOnce(new Error('DB Connection Failed'));

            await predictionController.getRoutePrediction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Prediksi kepadatan gagal'
            });
        });

        it('should handle python timeout properly', async () => {
            jest.useFakeTimers();

            req.body = {
                legs: [
                    { route_id: 'R-MRT', halte_id: 'H1' }
                ]
            };
            global.fetch.mockResolvedValueOnce({
                json: async () => ({ weather: [{ description: 'cerah' }] })
            });
            db.query.mockResolvedValueOnce([[{ jenis_kendaraan: 'MRT' }]]);

            const mockProc = createMockProcess({ hang: true });
            spawn.mockReturnValueOnce(mockProc);

            const promise = predictionController.getRoutePrediction(req, res);

            // Allow microtasks (fetch, db query) to settle up to spawn()
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            // Now trigger the 30s timeout
            jest.advanceTimersByTime(30000);

            await promise;

            expect(mockProc.kill).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Prediksi kepadatan gagal'
            });

            jest.useRealTimers();
        });
    });
});
