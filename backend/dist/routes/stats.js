"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const express_1 = __importDefault(require("express"));
const statsService_1 = require("../services/statsService");
const clerkAuthOptimized_1 = require("../middleware/clerkAuthOptimized");
exports.statsRouter = express_1.default.Router();
exports.statsRouter.get("/", clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    try {
        const stats = await (0, statsService_1.getAdminStats)();
        res.status(200).json(stats);
    }
    catch (error) {
        console.error("[STATS ERROR]", error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard stats",
            code: "STATS_FETCH_FAILED",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
//# sourceMappingURL=stats.js.map