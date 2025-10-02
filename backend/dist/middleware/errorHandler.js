"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
exports.rateLimitErrorHandler = rateLimitErrorHandler;
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}
function errorHandler(err, _req, res, _next) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const status = err?.status || 500;
    res.status(status).json({ success: false, message });
}
function rateLimitErrorHandler(err, _req, res, next) {
    if (err && err.status === 429) {
        return res.status(429).json(err.message || {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            status: 429,
        });
    }
    return next(err);
}
//# sourceMappingURL=errorHandler.js.map