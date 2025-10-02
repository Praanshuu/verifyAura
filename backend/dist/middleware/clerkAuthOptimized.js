"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthOptimized = exports.requireAdminOptimized = exports.requireAuthOptimized = void 0;
const express_1 = require("@clerk/express");
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            userCache.delete(key);
        }
    }
}, 10 * 60 * 1000);
async function getCachedUser(userId) {
    const cached = userCache.get(userId);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.user;
    }
    try {
        const user = await express_1.clerkClient.users.getUser(userId);
        userCache.set(userId, { user, timestamp: now });
        return user;
    }
    catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
        if (cached) {
            return cached.user;
        }
        throw error;
    }
}
const requireAuthOptimized = async (req, res, next) => {
    try {
        const { userId, sessionId } = (0, express_1.getAuth)(req);
        if (!userId || !sessionId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized - No valid session found',
                code: 'NO_SESSION'
            });
            return;
        }
        req.auth = {
            userId,
            sessionId
        };
        process.nextTick(async () => {
            try {
                const user = await getCachedUser(userId);
                if (user) {
                    req.auth.email = user?.emailAddresses?.[0]?.emailAddress || '';
                    req.auth.firstName = user?.firstName || undefined;
                    req.auth.lastName = user?.lastName || undefined;
                }
            }
            catch (error) {
                console.warn(`Failed to enrich auth data for user ${userId}:`, error);
            }
        });
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed - Invalid or expired token',
            code: 'AUTH_FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
    }
};
exports.requireAuthOptimized = requireAuthOptimized;
const requireAdminOptimized = async (req, res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized - Admin access required',
                code: 'NO_SESSION'
            });
            return;
        }
        const user = await getCachedUser(userId);
        const role = user.publicMetadata?.role;
        if (role !== 'admin') {
            console.warn(`Forbidden access attempt by user: ${userId} (Role: ${role})`);
            res.status(403).json({
                success: false,
                message: 'Admin privileges required',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }
        req.auth = {
            userId,
            email: user?.emailAddresses?.[0]?.emailAddress || '',
            firstName: user?.firstName || undefined,
            lastName: user?.lastName || undefined,
            role,
        };
        next();
    }
    catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization check failed',
            code: 'AUTH_CHECK_FAILED',
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.requireAdminOptimized = requireAdminOptimized;
const optionalAuthOptimized = async (req, _res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId) {
            next();
            return;
        }
        req.auth = { userId };
        process.nextTick(async () => {
            try {
                const user = await getCachedUser(userId);
                if (user) {
                    req.auth.email = user?.emailAddresses?.[0]?.emailAddress || '';
                    req.auth.firstName = user?.firstName || undefined;
                    req.auth.lastName = user?.lastName || undefined;
                }
            }
            catch (error) {
                console.warn('Optional auth enrichment failed:', error);
            }
        });
        next();
    }
    catch (error) {
        console.warn('Optional auth failed:', error);
        next();
    }
};
exports.optionalAuthOptimized = optionalAuthOptimized;
//# sourceMappingURL=clerkAuthOptimized.js.map