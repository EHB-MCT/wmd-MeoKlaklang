const express = require("express");
const { getDB } = require("../db");
const { ObjectId } = require("mongodb");
const { endSession } = require("../models/Session");

const router = express.Router();

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = "30d" } = req.query;

    const daysBack = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const db = getDB();

    const sessions = await db.collection("sessions").aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "analytics_events",
          localField: "sessionId",
          foreignField: "sessionId",
          as: "ae",
        },
      },
      {
        $addFields: {
          eventCount: { $size: "$ae" },
          pageViews: {
            $size: {
              $filter: {
                input: "$ae",
                as: "e",
                cond: { $eq: ["$$e.eventName", "page_view"] },
              },
            },
          },
          uniqueRoutes: {
            $setUnion: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: "$ae",
                      as: "e",
                      cond: { $eq: ["$$e.eventName", "page_view"] },
                    },
                  },
                  as: "pv",
                  in: "$$pv.route",
                },
              },
              [],
            ],
          },
          actualDuration: {
            $cond: {
              if: { $gt: [{ $size: "$ae" }, 0] },
              then: { $subtract: [{ $max: "$ae.serverTs" }, { $min: "$ae.serverTs" }] },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          calculatedDuration: {
            $cond: {
              if: { $gt: ["$actualDuration", 0] },
              then: "$actualDuration",
              else: {
                $cond: {
                  if: { $and: [{ $ne: ["$duration", null] }, { $gt: ["$duration", 0] }] },
                  then: "$duration",
                  else: { $subtract: [{ $ifNull: ["$lastActivity", new Date()] }, "$loginTime"] },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          sessionId: 1,
          createdAt: 1,
          loginTime: 1,
          logoutTime: 1,
          lastActivity: 1,
          isActive: 1,
          ipAddress: 1,
          userAgent: 1,
          eventCount: 1,
          pageViews: 1,
          uniqueRoutes: 1,
          uniqueRouteCount: { $size: "$uniqueRoutes" },
          calculatedDuration: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.isActive).length;
    const totalDurationMs = sessions.reduce((sum, s) => sum + (s.calculatedDuration || 0), 0);

    res.json({
      sessions,
      summary: {
        totalSessions,
        activeSessions,
        totalDurationMinutes: Math.round(totalDurationMs / 1000 / 60),
        avgDurationMinutes: totalSessions ? Math.round((totalDurationMs / totalSessions) / 1000 / 60) : 0,
        timeRange: `${daysBack} days`,
      },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Error fetching sessions" });
  }
});

router.get("/active", async (req, res) => {
  try {
    const db = getDB();
    const activeSessions = await db
      .collection("sessions")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(activeSessions);
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ error: "Error fetching active sessions" });
  }
});

router.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await endSession(sessionId);
    res.json({ success: true, message: "Session ended successfully" });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Error ending session" });
  }
});

module.exports = router;
