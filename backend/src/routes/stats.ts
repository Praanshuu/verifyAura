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
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});
