"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const compression_1 = __importDefault(require("compression"));
const express_2 = require("@clerk/express");
const path_1 = __importDefault(require("path"));
const certificates_1 = __importDefault(require("./routes/certificates"));
const admin_1 = __importDefault(require("./routes/admin"));
const participants_1 = __importDefault(require("./routes/participants"));
const logs_1 = __importDefault(require("./routes/logs"));
const stats_1 = require("./routes/stats");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
app.use((0, express_2.clerkMiddleware)());
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://*.clerk.com",
                "https://*.clerk.services",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://classic-fawn-35.clerk.accounts.dev"
            ],
            scriptSrcElem: [
                "'self'",
                "https://*.clerk.com",
                "https://*.clerk.services",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://classic-fawn-35.clerk.accounts.dev"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use((0, compression_1.default)());
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:8080',
        'http://localhost:8080',
        'http://localhost:3000',
        'http://localhost:5173',
        'https://verify-aura-frontend.vercel.app/'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Clerk-Auth-Token']
};
app.use((0, cors_1.default)(corsOptions));
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
});
const certificateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many certificate verification requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/certificates/verify', certificateLimiter);
app.use(generalLimiter);
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf.toString());
        }
        catch (e) {
            res.status(400).json({
                success: false,
                message: 'Invalid JSON payload',
                code: 'INVALID_JSON'
            });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
}));
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    res.setHeader('X-Request-ID', requestId);
    console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${req.ip}`);
    if (NODE_ENV === 'development' && req.method !== 'GET' && req.body) {
        console.log(`[${requestId}] Request Body:`, JSON.stringify(req.body, null, 2));
    }
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
        const resetColor = '\x1b[0m';
        console.log(`${statusColor}[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms${resetColor}`);
        if (duration > 1000) {
            console.warn(`[${requestId}] SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    next();
});
app.get('/health', async (req, res) => {
    try {
        const startTime = Date.now();
        const { error: dbError } = await require('./services/supabase').supabase
            .from('events')
            .select('id')
            .limit(1);
        const dbHealthy = !dbError;
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const healthStatus = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime),
            environment: NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            services: {
                database: dbHealthy ? 'healthy' : 'unhealthy',
                memory: memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'healthy' : 'warning'
            },
            performance: {
                responseTime: Date.now() - startTime,
                memoryUsage: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
                    external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
                }
            }
        };
        res.status(dbHealthy ? 200 : 503).json(healthStatus);
    }
    catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.use('/api/certificates', certificates_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin/participants', participants_1.default);
app.use('/api/admin/logs', logs_1.default);
app.use('/api/admin/stats', stats_1.statsRouter);
app.use(express_1.default.static(path_1.default.join(__dirname, 'dist')));
app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
        return next();
    }
    res.sendFile(path_1.default.join(__dirname, 'dist', 'index.html'));
});
app.use(errorHandler_1.rateLimitErrorHandler);
app.use('*', errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Certificate verification: http://localhost:${PORT}/api/certificates/verify`);
    console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔧 Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || '100'} requests per 15 minutes`);
    console.log(`📝 Logging: ${NODE_ENV === 'development' ? 'Detailed' : 'Production'}`);
});
server.timeout = 30000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
exports.default = app;
//# sourceMappingURL=index.js.map