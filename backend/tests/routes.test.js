const express = require('express');

// Mock all middlewares and controllers required by the route files
jest.mock('../middleware/authMiddleware', () => ({
    verifyToken: (req, res, next) => next(),
    isAdmin: (req, res, next) => next(),
    isMainAdmin: (req, res, next) => next()
}));

jest.mock('../controllers/authController', () => ({
    register: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn()
}));

jest.mock('../controllers/profileController', () => ({
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn()
}));

jest.mock('../controllers/searchController', () => ({
    searchRoutes: jest.fn(),
    getStopSuggestions: jest.fn()
}));

jest.mock('../controllers/reportController', () => ({
    createReport: jest.fn(),
    getMyReports: jest.fn(),
    getLocationOptions: jest.fn()
}));

jest.mock('../controllers/subscriptionController', () => ({
    createSubscription: jest.fn(),
    getMySubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    activateSubscription: jest.fn(),
    getPaymentToken: jest.fn()
}));

jest.mock('../controllers/adminSubController', () => ({
    getAllSubscriptions: jest.fn(),
    getSubscriptionDetail: jest.fn(),
    assignGuideToSubscription: jest.fn(),
    updateSubscriptionStatus: jest.fn(),
    deleteSubscription: jest.fn()
}));

jest.mock('../controllers/adminManageController', () => ({
    getAllAdmins: jest.fn(),
    assignAdminRole: jest.fn(),
    updateAdmin: jest.fn(),
    removeAdminAccess: jest.fn(),
    changePassword: jest.fn()
}));

jest.mock('../controllers/adminReportController', () => ({
    getAllReports: jest.fn(),
    updateReportStatus: jest.fn(),
    deleteReport: jest.fn()
}));

jest.mock('../controllers/adminTransportController', () => ({
    getAllTransports: jest.fn(),
    createTransport: jest.fn(),
    updateTransport: jest.fn(),
    deleteTransport: jest.fn(),
    getAllRoutes: jest.fn(),
    createRoute: jest.fn(),
    updateRoute: jest.fn(),
    deleteRoute: jest.fn(),
    getAllStops: jest.fn(),
    createStop: jest.fn(),
    updateStop: jest.fn(),
    deleteStop: jest.fn(),
    getAllRouteStops: jest.fn(),
    createRouteStop: jest.fn(),
    updateRouteStop: jest.fn(),
    deleteRouteStop: jest.fn()
}));

jest.mock('../controllers/adminDashboardController', () => ({
    getDashboardStats: jest.fn()
}));

jest.mock('../controllers/adminGuideController', () => ({
    getAllGuides: jest.fn(),
    getGuideDetail: jest.fn(),
    createGuide: jest.fn(),
    toggleGuideStatus: jest.fn(),
    updateGuide: jest.fn(),
    deleteGuide: jest.fn()
}));

jest.mock('../controllers/adminUserController', () => ({
    getAllUsers: jest.fn(),
    toggleUserStatus: jest.fn(),
    deleteUser: jest.fn()
}));

// Helper function to extract route metadata from an Express router stack
const getRoutesMeta = (router) => {
    const routes = [];
    router.stack.forEach((layer) => {
        if (layer.route) {
            const path = layer.route.path;
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            routes.push({ path, methods });
        } else if (layer.name === 'router') {
            // Nested router layers
            const nestedRoutes = getRoutesMeta(layer.handle);
            routes.push(...nestedRoutes);
        }
    });
    return routes;
};

describe('Router Registration Tests', () => {
    it('authRoutes registers expected endpoints', () => {
        const router = require('../routes/authRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/register', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/verify-email', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/login', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/forgot-password', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/reset-password', methods: 'POST' });
    });

    it('profileRoutes registers expected endpoints', () => {
        const router = require('../routes/profileRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/password', methods: 'PUT' });
    });

    it('searchRoutes registers expected endpoints', () => {
        const router = require('../routes/searchRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/suggestions', methods: 'GET' });
    });

    it('reportRoutes registers expected endpoints', () => {
        const router = require('../routes/reportRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/locations', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/my-reports', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/', methods: 'POST' });
    });

    it('subscriptionRoutes registers expected endpoints', () => {
        const router = require('../routes/subscriptionRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/my-subs', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/my-subs', methods: 'DELETE' });
        expect(meta).toContainEqual({ path: '/activate', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/payment-token', methods: 'POST' });
    });

    it('adminDashboardRoutes registers expected endpoints', () => {
        const router = require('../routes/adminDashboardRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/dashboard-stats', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/change-password', methods: 'PUT' });
    });

    it('adminGuideRoutes registers expected endpoints', () => {
        const router = require('../routes/adminGuideRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/:employee_id', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/:employee_id', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:employee_id/status', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:employee_id', methods: 'DELETE' });
    });

    it('adminManageRoutes registers expected endpoints', () => {
        const router = require('../routes/adminManageRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/assign', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/:id', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:id', methods: 'DELETE' });
    });

    it('adminReportRoutes registers expected endpoints', () => {
        const router = require('../routes/adminReportRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/all', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/status', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:id', methods: 'DELETE' });
    });

    it('adminSubRoutes registers expected endpoints', () => {
        const router = require('../routes/adminSubRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/:subs_id', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/:subs_id/assign-guide', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:subs_id/status', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:subs_id', methods: 'DELETE' });
    });

    it('adminTransportRoutes registers expected endpoints', () => {
        const router = require('../routes/adminTransportRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/trans', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/trans', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/trans/:id', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/trans/:id', methods: 'DELETE' });
        
        expect(meta).toContainEqual({ path: '/routes', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/routes', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/routes/:id', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/routes/:id', methods: 'DELETE' });

        expect(meta).toContainEqual({ path: '/stops', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/stops', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/stops/:id', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/stops/:id', methods: 'DELETE' });

        expect(meta).toContainEqual({ path: '/route-stops', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/route-stops', methods: 'POST' });
        expect(meta).toContainEqual({ path: '/route-stops/:id', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/route-stops/:id', methods: 'DELETE' });
    });

    it('adminUserRoutes registers expected endpoints', () => {
        const router = require('../routes/adminUserRoutes');
        const meta = getRoutesMeta(router);
        expect(meta).toContainEqual({ path: '/', methods: 'GET' });
        expect(meta).toContainEqual({ path: '/:user_id/status', methods: 'PUT' });
        expect(meta).toContainEqual({ path: '/:user_id', methods: 'DELETE' });
    });
});
