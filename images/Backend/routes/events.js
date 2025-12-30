const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const Event = require("../models/Event");

const router = express.Router();

// ===========================
// POST: Track single event
// ===========================
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      type,
      data,
      url,
      userAgent,
      referrer,
      pageLoadTime,
      viewport
    } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        error: "userId and event type are required"
      });
    }

    const event = await Event.create({
      userId,
      sessionId,
      type,
      data,
      url,
      userAgent,
      referrer,
      pageLoadTime,
      viewport
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("❌ Fout bij opslaan event:", err);
    res.status(500).json({ error: "Fout bij opslaan event" });
  }
});

// ===========================
// POST: Track multiple events (batch)
// ===========================
router.post("/batch", async (req, res) => {
  try {
    const { userId, events } = req.body;

    if (!userId || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: "userId and events array are required"
      });
    }

    // Add userId to each event
    const eventsWithUserId = events.map(event => ({
      ...event,
      userId
    }));

    const result = await Event.createBatch(eventsWithUserId);
    res.status(201).json({ 
      success: true, 
      insertedCount: result.insertedCount,
      events: result.insertedIds 
    });
  } catch (err) {
    console.error("❌ Fout bij batch opslaan events:", err);
    res.status(500).json({ error: "Fout bij batch opslaan events" });
  }
});

// ===========================
// GET: Events voor gebruiker
// ===========================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      limit = 100, 
      offset = 0, 
      startDate, 
      endDate, 
      eventType 
    } = req.query;

    const events = await Event.getUserEvents(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate,
      eventType
    });

    res.json(events);
  } catch (err) {
    console.error("❌ Fout bij ophalen user events:", err);
    res.status(500).json({ error: "Fout bij ophalen user events" });
  }
});

// ===========================
// GET: Analytics voor gebruiker
// ===========================
router.get("/analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '7d' } = req.query;

    const analytics = await Event.getUserAnalytics(userId, timeRange);
    res.json(analytics);
  } catch (err) {
    console.error("❌ Fout bij ophalen analytics:", err);
    res.status(500).json({ error: "Fout bij ophalen analytics" });
  }
});

// ===========================
// GET: Sessie analytics
// ===========================
router.get("/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await Event.getUserSessionAnalytics(userId);
    res.json(sessions);
  } catch (err) {
    console.error("❌ Fout bij ophalen sessies:", err);
    res.status(500).json({ error: "Fout bij ophalen sessies" });
  }
});

// ===========================
// GET: Gebruiker patronen (friction, hesitation)
// ===========================
router.get("/patterns/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '7d' } = req.query;
    
    const db = getDB();
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    // Get form submission patterns
    const formPatterns = await db
      .collection("events")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            timestamp: { $gte: startDate },
            type: { $in: ['form_focus', 'form_blur', 'form_submit'] }
          }
        },
        {
          $group: {
            _id: "$sessionId",
            formFields: { $push: "$data.fieldName" },
            submitAttempts: {
              $sum: {
                $cond: [{ $eq: ["$type", "form_submit"] }, 1, 0]
              }
            },
            focusEvents: {
              $sum: {
                $cond: [{ $eq: ["$type", "form_focus"] }, 1, 0]
              }
            },
            blurEvents: {
              $sum: {
                $cond: [{ $eq: ["$type", "form_blur"] }, 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            hesitationScore: {
              $divide: ["$blurEvents", { $max: ["$focusEvents", 1] }]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgHesitationScore: { $avg: "$hesitationScore" },
            avgSubmitAttempts: { $avg: "$submitAttempts" },
            totalSessions: { $sum: 1 }
          }
        }
      ])
      .toArray();

    // Get scroll depth patterns
    const scrollPatterns = await db
      .collection("events")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            timestamp: { $gte: startDate },
            type: "scroll"
          }
        },
        {
          $group: {
            _id: "$sessionId",
            maxScrollDepth: { $max: "$data.scrollDepth" },
            avgScrollDepth: { $avg: "$data.scrollDepth" }
          }
        },
        {
          $group: {
            _id: null,
            avgMaxScrollDepth: { $avg: "$maxScrollDepth" },
            engagementRate: {
              $avg: {
                $cond: [
                  { $gte: ["$maxScrollDepth", 0.8] }, // 80% scroll depth
                  1, 0
                ]
              }
            }
          }
        }
      ])
      .toArray();

    // Get time on page patterns
    const timePatterns = await db
      .collection("events")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              sessionId: "$sessionId",
              url: "$url"
            },
            startTime: { $min: "$timestamp" },
            endTime: { $max: "$timestamp" },
            eventCount: { $sum: 1 }
          }
        },
        {
          $addFields: {
            duration: { $subtract: ["$endTime", "$startTime"] }
          }
        },
        {
          $group: {
            _id: "$_id.url",
            avgTimeOnPage: { $avg: "$duration" },
            visitCount: { $sum: 1 },
            bounceRate: {
              $avg: {
                $cond: [
                  { $lte: ["$duration", 5000] }, // Less than 5 seconds
                  1, 0
                ]
              }
            }
          }
        }
      ])
      .toArray();

    res.json({
      formBehavior: formPatterns[0] || {},
      scrollBehavior: scrollPatterns[0] || {},
      timeOnPage: timePatterns,
      timeRange
    });

  } catch (err) {
    console.error("❌ Fout bij ophalen patronen:", err);
    res.status(500).json({ error: "Fout bij ophalen patronen" });
  }
});

module.exports = router;