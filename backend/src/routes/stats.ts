// backend/src/routes/stats.ts

import express from "express";
import { getAdminStats } from "../services/statsService";
import { requireAdmin } from "../middleware/clerkAuth";

export const statsRouter = express.Router();

// GET /api/admin/stats
statsRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("[STATS ERROR]", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to load dashboard stats",
      code: "STATS_FETCH_FAILED",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
