const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const Event = {
  // Create a new tracking event
  async create(eventData) {
    const db = getDB();
    
    const event = {
      userId: new ObjectId(eventData.userId),
      sessionId: eventData.sessionId || this.generateSessionId(),
      type: eventData.type, // 'page_view', 'click', 'navigation', 'scroll', 'hover', 'form_focus', 'form_blur', 'form_submit', 'login_attempt'
      timestamp: new Date(),
      
      // Event-specific data
      data: eventData.data || {},
      
      // Metadata
      url: eventData.url || window.location?.href,
      userAgent: eventData.userAgent || navigator.userAgent,
      referrer: eventData.referrer || document.referrer,
      
      // Performance data
      pageLoadTime: eventData.pageLoadTime || performance.timing?.loadEventEnd - performance.timing?.navigationStart,
      viewport: eventData.viewport || {
        width: window.innerWidth || screen.width,
        height: window.innerHeight || screen.height
      }
    };

    const result = await db.collection("events").insertOne(event);
    return { ...event, _id: result.insertedId };
  },

  // Get events for a user
  async getUserEvents(userId, options = {}) {
    const db = getDB();
    const { limit = 100, offset = 0, startDate, endDate, eventType } = options;
    
    const query = { userId: new ObjectId(userId) };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (eventType) {
      query.type = eventType;
    }

    const events = await db
      .collection("events")
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return events;
  },

  // Get session events
  async getSessionEvents(sessionId) {
    const db = getDB();
    const events = await db
      .collection("events")
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();

    return events;
  },

  // Get analytics for a user
  async getUserAnalytics(userId, timeRange = '7d') {
    const db = getDB();
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const events = await db
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
              date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
              type: "$type"
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            events: {
              $push: {
                type: "$_id.type",
                count: "$count"
              }
            },
            totalEvents: { $sum: "$count" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      .toArray();

    return events;
  },

  // Get user session analytics
  async getUserSessionAnalytics(userId) {
    const db = getDB();
    
    const sessions = await db
      .collection("events")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId)
          }
        },
        {
          $group: {
            _id: "$sessionId",
            startTime: { $min: "$timestamp" },
            endTime: { $max: "$timestamp" },
            duration: { $subtract: [{ $max: "$timestamp" }, { $min: "$timestamp" }] },
            eventCount: { $sum: 1 },
            pageViews: {
              $sum: {
                $cond: [{ $eq: ["$type", "page_view"] }, 1, 0]
              }
            },
            clicks: {
              $sum: {
                $cond: [{ $eq: ["$type", "click"] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { startTime: -1 }
        }
      ])
      .toArray();

    return sessions;
  },

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Store events in batch (for performance)
  async createBatch(eventsData) {
    const db = getDB();
    
    const events = eventsData.map(eventData => ({
      userId: new ObjectId(eventData.userId),
      sessionId: eventData.sessionId || this.generateSessionId(),
      type: eventData.type,
      timestamp: new Date(),
      data: eventData.data || {},
      url: eventData.url,
      userAgent: eventData.userAgent,
      referrer: eventData.referrer,
      pageLoadTime: eventData.pageLoadTime,
      viewport: eventData.viewport
    }));

    const result = await db.collection("events").insertMany(events);
    return result;
  }
};

module.exports = Event;