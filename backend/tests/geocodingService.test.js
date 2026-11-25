const {
    getAddressFromCoordinates,
    FALLBACK_ADDRESS
} = require('../services/geocodingService');

describe('geocodingService', () => {
    const originalApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
        global.fetch = jest.fn();
    });

    afterAll(() => {
        if (originalApiKey === undefined) {
            delete process.env.GOOGLE_MAPS_API_KEY;
        } else {
            process.env.GOOGLE_MAPS_API_KEY = originalApiKey;
        }
        global.fetch = originalFetch;
    });

    it('should return the formatted address from Google Geocoding API', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'OK',
                results: [{ formatted_address: 'Jatinangor, Sumedang' }]
            })
        });

        await expect(getAddressFromCoordinates(-6.8915, 107.6102))
            .resolves.toBe('Jatinangor, Sumedang');

        const [url] = global.fetch.mock.calls[0];
        expect(new URL(url).searchParams.get('latlng')).toBe('-6.8915,107.6102');
        expect(new URL(url).searchParams.get('key')).toBe('test-api-key');
    });

    it('should return the fallback if the API key is not configured', async () => {
        delete process.env.GOOGLE_MAPS_API_KEY;
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(getAddressFromCoordinates(-6.8915, 107.6102))
            .resolves.toBe(FALLBACK_ADDRESS);
        expect(global.fetch).not.toHaveBeenCalled();

        errorSpy.mockRestore();
    });

    it('should return fallback when HTTP response is not ok', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(getAddressFromCoordinates(-6.8915, 107.6102))
            .resolves.toBe(FALLBACK_ADDRESS);

        expect(errorSpy).toHaveBeenCalledWith('Google Geocoding API returned HTTP 500.');
        errorSpy.mockRestore();
    });

    it('should return the fallback when the API request fails', async () => {
        global.fetch.mockRejectedValueOnce(new Error('network error'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(getAddressFromCoordinates(-6.8915, 107.6102))
            .resolves.toBe(FALLBACK_ADDRESS);

        errorSpy.mockRestore();
    });

    it('should abort request on timeout', async () => {
        jest.useFakeTimers();
        global.fetch.mockImplementationOnce((url, options) => {
            return new Promise((resolve, reject) => {
                options.signal.addEventListener('abort', () => {
                    const abortErr = new Error('The operation was aborted');
                    abortErr.name = 'AbortError';
                    reject(abortErr);
                });
            });
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const promise = getAddressFromCoordinates(-6.8915, 107.6102);
        jest.advanceTimersByTime(5000);

        await expect(promise).resolves.toBe(FALLBACK_ADDRESS);
        expect(errorSpy).toHaveBeenCalledWith('Google reverse geocoding failed: AbortError.');

        errorSpy.mockRestore();
        jest.useRealTimers();
    });

    it('should return the fallback when Google does not provide an address', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'ZERO_RESULTS', results: [] })
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(getAddressFromCoordinates(-6.8915, 107.6102))
            .resolves.toBe(FALLBACK_ADDRESS);

        errorSpy.mockRestore();
    });
});
