"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuth = exports.requireAuth = void 0;
const express_1 = require("@clerk/express");
const requireAuth = async (req, res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized - No valid session found',
                code: 'NO_SESSION'
            });
            return;
        }
        const user = await express_1.clerkClient.users.getUser(userId);
        req.auth = {
            userId,
            email: user?.emailAddresses?.[0]?.emailAddress || '',
            firstName: user?.firstName || undefined,
            lastName: user?.lastName || undefined,
        };
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
exports.requireAuth = requireAuth;
const optionalAuth = async (req, _res, next) => {
    try {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId) {
            next();
            return;
        }
        const user = await express_1.clerkClient.users.getUser(userId);
        req.auth = {
            userId,
            email: user?.emailAddresses?.[0]?.emailAddress || '',
            firstName: user?.firstName || undefined,
            lastName: user?.lastName || undefined,
        };
        next();
    }
    catch (error) {
        console.warn('Optional auth failed:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireAdmin = async (req, res, next) => {
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
        const user = await express_1.clerkClient.users.getUser(userId);
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
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=clerkAuth.js.map