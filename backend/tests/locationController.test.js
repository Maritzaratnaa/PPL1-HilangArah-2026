const { findNearestStop } = require('../repositories/locationRepository');
const { getAddressFromCoordinates } = require('../services/geocodingService');
const { getNearestStop } = require('../controllers/locationController');

jest.mock('../repositories/locationRepository', () => ({
    findNearestStop: jest.fn()
}));
jest.mock('../services/geocodingService', () => ({
    getAddressFromCoordinates: jest.fn()
}));

describe('locationController', () => {
    let req;
    let res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    it.each([
        [{ lng: 107.6102 }],
        [{ lat: -6.8915 }],
        [{ lat: '-6.8915', lng: 107.6102 }],
        [{ lat: 91, lng: 107.6102 }],
        [{ lat: -6.8915, lng: 181 }],
        [null]
    ])('should reject invalid coordinates: %j', async (body) => {
        req.body = body;

        await getNearestStop(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getAddressFromCoordinates).not.toHaveBeenCalled();
        expect(findNearestStop).not.toHaveBeenCalled();
    });

    it('should reverse geocode then return the nearest stop', async () => {
        req.body = { lat: -6.8915, lng: 107.6102 };
        const nearestStop = {
            stop_id: 'stop-1',
            name: 'Halte Unpad',
            address: 'Jatinangor',
            latitude: -6.8915,
            longitude: 107.6102,
            distance_meters: 123.45
        };
        getAddressFromCoordinates.mockResolvedValueOnce('Jatinangor, Sumedang');
        findNearestStop.mockResolvedValueOnce(nearestStop);

        await getNearestStop(req, res);

        expect(getAddressFromCoordinates).toHaveBeenCalledWith(-6.8915, 107.6102);
        expect(findNearestStop).toHaveBeenCalledWith(-6.8915, 107.6102);
        expect(getAddressFromCoordinates.mock.invocationCallOrder[0])
            .toBeLessThan(findNearestStop.mock.invocationCallOrder[0]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            address: 'Jatinangor, Sumedang',
            nearest_stop: {
                stop_id: 'stop-1',
                name: 'Halte Unpad',
                address: 'Jatinangor',
                distance_meters: 123.45
            }
        });
    });

    it('should return 404 if no stop with coordinates is available', async () => {
        req.body = { lat: -6.8915, lng: 107.6102 };
        getAddressFromCoordinates.mockResolvedValueOnce('Jatinangor, Sumedang');
        findNearestStop.mockResolvedValueOnce(null);

        await getNearestStop(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Tidak ada halte aktif dengan koordinat yang tersedia."
        });
    });

    it('should return 500 if the database query fails', async () => {
        req.body = { lat: -6.8915, lng: 107.6102 };
        getAddressFromCoordinates.mockResolvedValueOnce('Jatinangor, Sumedang');
        findNearestStop.mockRejectedValueOnce(new Error('database error'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await getNearestStop(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        errorSpy.mockRestore();
    });
});
