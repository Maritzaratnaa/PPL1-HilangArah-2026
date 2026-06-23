const autoExpireSubscriptions = require('../utils/autoExpire');
const sendEmail = require('../utils/sendEmail');
const sendResetEmail = require('../utils/sendResetEmail');
const pool = require('../db');

jest.mock('../db', () => ({
    query: jest.fn()
}));

describe('utils', () => {
    let originalFetch, logSpy, errorSpy;

    beforeEach(() => {
        originalFetch = global.fetch;
        global.fetch = jest.fn();
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    describe('autoExpireSubscriptions', () => {
        it('should successfully run update queries to expire subscriptions and release guides', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 2 }]); // guides query
            pool.query.mockResolvedValueOnce([{ affectedRows: 2 }]); // subs query

            await autoExpireSubscriptions();

            expect(pool.query).toHaveBeenCalledTimes(2);
            expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE guides'));
            expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE subs'));
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('should handle database errors and log them', async () => {
            pool.query.mockRejectedValueOnce(new Error('Database error connection lost'));

            await autoExpireSubscriptions();

            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(errorSpy).toHaveBeenCalledWith(
                "Error executing Lazy Auto-Expire Subs:",
                expect.any(Error)
            );
        });
    });

    describe('sendEmail (Brevo Verification OTP)', () => {
        it('should call fetch and log success when Brevo API responds with ok', async () => {
            const mockResponseJson = { messageId: 'msg-123' };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponseJson)
            });

            await sendEmail('test@test.com', '123456');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.brevo.com/v3/smtp/email',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'accept': 'application/json',
                        'content-type': 'application/json'
                    })
                })
            );
            expect(logSpy).toHaveBeenCalledWith(
                "📧 [Brevo API] Email OTP berhasil dikirim ke:",
                'test@test.com'
            );
        });

        it('should call fetch and log failure when Brevo API responds with an error status', async () => {
            const mockResponseJson = { code: 'invalid_parameter', message: 'API key is invalid' };
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockResolvedValueOnce(mockResponseJson)
            });

            await sendEmail('test@test.com', '123456');

            expect(errorSpy).toHaveBeenCalledWith(
                "❌ Gagal mengirim via Brevo:",
                mockResponseJson
            );
        });

        it('should log an error when fetch fails due to a network failure', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await sendEmail('test@test.com', '123456');

            expect(errorSpy).toHaveBeenCalledWith(
                "❌ Gagal mengirim email:",
                expect.any(Error)
            );
        });
    });

    describe('sendResetEmail (Brevo Reset Password Link)', () => {
        it('should call fetch and log success when Brevo API responds with ok', async () => {
            const mockResponseJson = { messageId: 'msg-reset-123' };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponseJson)
            });

            await sendResetEmail('test@test.com', 'reset-token-xyz');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.brevo.com/v3/smtp/email',
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(logSpy).toHaveBeenCalledWith(
                "📧 [Brevo API] Email Reset Password berhasil dikirim ke:",
                'test@test.com'
            );
        });

        it('should call fetch and log failure when Brevo API responds with an error status', async () => {
            const mockResponseJson = { code: 'unauthorized', message: 'API key is missing' };
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: jest.fn().mockResolvedValueOnce(mockResponseJson)
            });

            await sendResetEmail('test@test.com', 'reset-token-xyz');

            expect(errorSpy).toHaveBeenCalledWith(
                "❌ Gagal mengirim reset password via Brevo:",
                mockResponseJson
            );
        });

        it('should log an error when fetch fails due to a network failure', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Connection failure'));

            await sendResetEmail('test@test.com', 'reset-token-xyz');

            expect(errorSpy).toHaveBeenCalledWith(
                "❌ Terjadi eror pada fungsi sendResetEmail:",
                expect.any(Error)
            );
        });
    });
});
