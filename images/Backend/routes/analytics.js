const express = require("express");
const { storeAnalyticsEvents } = require("../models/AnalyticsEvent");
const { touchSession } = require("../models/Session");

const router = express.Router();

// POST /api/analytics/batch
router.post("/batch", async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "events must be an array" });
    }

    // Touch session based on events (keep lastActivity updated)
    // We do it best-effort (ignore failures)
    const sessionIds = new Set(events.map((e) => e?.sessionId).filter(Boolean));
    for (const sid of sessionIds) {
      try {
        await touchSession(sid);
      } catch (_) {}
    }

    const result = await storeAnalyticsEvents(events);
    return res.json(result);
  } catch (err) {
    console.error("Analytics batch error:", err);
    return res.status(500).json({ error: "Failed to store analytics events" });
  }
});

module.exports = router;
