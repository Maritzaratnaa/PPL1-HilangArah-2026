const pool = require('../db');
const { findNearestStop } = require('../repositories/locationRepository');

jest.mock('../db', () => ({
    query: jest.fn()
}));

describe('locationRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should query the closest active stop using Haversine distance', async () => {
        const stop = {
            stop_id: 'stop-1',
            name: 'Halte Unpad',
            address: 'Jatinangor',
            latitude: -6.8915,
            longitude: 107.6102,
            distance_meters: '123.45'
        };
        pool.query.mockResolvedValueOnce([[stop]]);

        await expect(findNearestStop(-6.9, 107.6)).resolves.toEqual({
            ...stop,
            distance_meters: 123.45
        });

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('ORDER BY distance_meters ASC'),
            [-6.9, -6.9, 107.6]
        );
        expect(pool.query.mock.calls[0][0]).toContain('WHERE is_active = 1');
        expect(pool.query.mock.calls[0][0]).toContain('latitude IS NOT NULL');
        expect(pool.query.mock.calls[0][0]).toContain('longitude IS NOT NULL');
    });

    it('should return null if there are no active stops with coordinates', async () => {
        pool.query.mockResolvedValueOnce([[]]);

        await expect(findNearestStop(-6.9, 107.6)).resolves.toBeNull();
    });
});
