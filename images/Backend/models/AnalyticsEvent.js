const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

// Create indexes for analytics_events collection
async function createAnalyticsIndexes() {
  const db = getDB();
  const collection = db.collection("analytics_events");

  await collection.createIndex({ userId: 1, serverTs: -1 });
  await collection.createIndex({ sessionId: 1, serverTs: -1 });
  await collection.createIndex({ eventName: 1, serverTs: -1 });
  await collection.createIndex({ route: 1, serverTs: -1 });

  // TTL index to auto-delete events after 2 years
  await collection.createIndex(
    { serverTs: 1 },
    { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 }
  );

  console.log("Analytics indexes created successfully");
}

// Validate and sanitize analytics event (login-required tracking)
function validateEvent(event) {
  // userId is REQUIRED because you track after login only
  if (!event.userId || typeof event.userId !== "string") {
    return { valid: false, error: "Invalid userId" };
  }

  // sessionId REQUIRED
  if (!event.sessionId || typeof event.sessionId !== "string") {
    return { valid: false, error: "Invalid sessionId" };
  }

  // clientTs REQUIRED
  if (!event.clientTs || typeof event.clientTs !== "number" || event.clientTs <= 0) {
    return { valid: false, error: "Invalid clientTs" };
  }

  if (!event.eventName || typeof event.eventName !== "string") {
    return { valid: false, error: "Invalid eventName" };
  }

  // route is important; default to "/"
  const route = typeof event.route === "string" && event.route.length > 0 ? event.route : "/";

  // Limit payload size
  const payloadSize = JSON.stringify(event.payload || {}).length;
  if (payloadSize > 4000) {
    return { valid: false, error: "Payload too large" };
  }

  // sanitize
  const sanitized = {
    userId: event.userId.substring(0, 64),
    sessionId: event.sessionId.substring(0, 128),
    eventName: event.eventName.substring(0, 80),
    route: route.substring(0, 200),
    clientTs: event.clientTs,
    serverTs: new Date(),
    viewport: event.viewport ? String(event.viewport).substring(0, 20) : null,
    userAgent: event.userAgent ? String(event.userAgent).substring(0, 200) : null,
    payload: event.payload || {},
  };

  return { valid: true, event: sanitized };
}

// Store analytics events in batch
async function storeAnalyticsEvents(events) {
  try {
    const validEvents = [];
    const droppedEvents = [];

    for (const event of events) {
      const validation = validateEvent(event);
      if (validation.valid) validEvents.push(validation.event);
      else droppedEvents.push({ event, error: validation.error });
    }

    if (validEvents.length === 0) {
      return {
        success: true,
        savedCount: 0,
        droppedCount: droppedEvents.length,
        droppedSamples: droppedEvents.slice(0, 5),
      };
    }

    const db = getDB();
    const collection = db.collection("analytics_events");
    await collection.insertMany(validEvents, { ordered: false });

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `📊 Analytics batch: saved=${validEvents.length}, dropped=${droppedEvents.length}`
      );
      if (droppedEvents.length > 0) {
        console.log(
          "📊 Dropped samples:",
          droppedEvents.slice(0, 2).map((d) => `${d.error} (${d.event?.eventName || "?"})`)
        );
      }
    }

    return {
      success: true,
      savedCount: validEvents.length,
      droppedCount: droppedEvents.length,
      droppedSamples: droppedEvents.slice(0, 5),
    };
  } catch (error) {
    console.error("Store analytics events error:", error);
    return {
      success: false,
      error: error.message,
      savedCount: 0,
      droppedCount: Array.isArray(events) ? events.length : 0,
      droppedSamples: [],
    };
  }
}

// Optional: summary by userId for admin
async function getUserAnalyticsSummaryByUserId(userId, timeRange = "30d") {
  const db = getDB();
  const collection = db.collection("analytics_events");

  const now = new Date();
  const daysBack = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const eventSummary = await collection
    .aggregate([
      { $match: { userId, serverTs: { $gte: startDate } } },
      {
        $group: {
          _id: "$eventName",
          count: { $sum: 1 },
          firstSeen: { $min: "$serverTs" },
          lastSeen: { $max: "$serverTs" },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();

  const sessionStats = await collection
    .aggregate([
      { $match: { userId, serverTs: { $gte: startDate } } },
      {
        $group: {
          _id: "$sessionId",
          startTime: { $min: "$serverTs" },
          endTime: { $max: "$serverTs" },
          duration: { $subtract: [{ $max: "$serverTs" }, { $min: "$serverTs" }] },
          eventCount: { $sum: 1 },
          routes: { $addToSet: "$route" },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgSessionDuration: { $avg: "$duration" },
          totalEvents: { $sum: "$eventCount" },
          uniqueRoutes: { $sum: { $size: "$routes" } },
        },
      },
    ])
    .toArray();

  return {
    eventSummary,
    sessionStats: sessionStats[0] || {},
    timeRange,
    startDate,
    endDate: now,
  };
}

async function initializeAnalytics() {
  try {
    await createAnalyticsIndexes();
    console.log("Analytics initialized successfully");
  } catch (error) {
    console.error("Failed to initialize analytics:", error);
  }
}

module.exports = {
  initializeAnalytics,
  storeAnalyticsEvents,
  getUserAnalyticsSummaryByUserId,
  validateEvent,
};
