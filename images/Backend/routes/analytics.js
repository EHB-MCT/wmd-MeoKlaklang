const express = require("express");
const { getDB } = require("../db");
const { getUserAnalytics } = require("../models/User");

const router = express.Router();

/**
 * POST /api/analytics/batch
 * Used by your frontend tracker (analytics.js)
 */
router.post("/batch", async (req, res) => {
  try {
    const db = getDB();
    const incoming = Array.isArray(req.body) ? req.body : req.body?.events;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ error: "No events provided" });
    }

    const normalized = incoming.map((e) => ({
      userId: e.userId ?? null, // keep as string if sent as string
      sessionId: e.sessionId ?? null,
      type: e.type || e.eventType || e.eventName || "unknown",
      eventName: e.eventName || e.type || "unknown",
      page: e.page || e.path || e.url || null,
      meta: e.meta || e.data || {},
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      createdAt: new Date(),
    }));

    await db.collection("events").insertMany(normalized);
    return res.json({ success: true, inserted: normalized.length });
  } catch (err) {
    console.error("❌ /api/analytics/batch error:", err);
    return res.status(500).json({ error: "Failed to store analytics events" });
  }
});

/**
 * GET /api/analytics/user/:userId?timeRange=7d|30d|90d
 * Used by Analytics.jsx
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = "30d" } = req.query;

    const analytics = await getUserAnalytics(userId, timeRange);
    return res.json(analytics);
  } catch (err) {
    console.error("❌ Analytics route error:", err);
    return res.status(500).json({ error: "Fout bij ophalen analytics" });
  }
});

module.exports = router;
