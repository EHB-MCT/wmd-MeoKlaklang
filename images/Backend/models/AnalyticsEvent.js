const { getDB } = require("../db");

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  // Fallback if mongoose not available
  console.warn('Mongoose not available, using MongoDB driver directly');
}

// Analytics Event Schema - using native MongoDB driver for simplicity
const analyticsEventSchema = mongoose ? new mongoose.Schema({
  userUID: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  eventName: { type: String, required: true, index: true }, // NO enum/allowlist - accept all values
  route: { type: String, required: true, index: true },
  clientTs: { type: Number, required: true, index: true },
  serverTs: { type: Date, default: Date.now, index: true },
  viewport: { type: String },
  userAgent: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: false // We use our own serverTs field
}) : null;

// Create indexes for analytics_events collection
async function createAnalyticsIndexes() {
  try {
    if (mongoose) {
      const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
      
      // Compound indexes for common queries
      await AnalyticsEvent.collection.createIndex({ userUID: 1, serverTs: -1 });
      await AnalyticsEvent.collection.createIndex({ sessionId: 1, serverTs: -1 });
      await AnalyticsEvent.collection.createIndex({ eventName: 1, serverTs: -1 });
      await AnalyticsEvent.collection.createIndex({ userId: 1, serverTs: -1 });
      
      // TTL index to auto-delete events after 2 years
      await AnalyticsEvent.collection.createIndex({ serverTs: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });
    } else {
      // Fallback using native MongoDB driver
      const db = getDB();
      const collection = db.collection('analytics_events');
      
      await collection.createIndex({ userUID: 1, serverTs: -1 });
      await collection.createIndex({ sessionId: 1, serverTs: -1 });
      await collection.createIndex({ eventName: 1, serverTs: -1 });
      await collection.createIndex({ userId: 1, serverTs: -1 });
      await collection.createIndex({ serverTs: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });
    }
    
    console.log('Analytics indexes created successfully');
  } catch (error) {
    console.error('Error creating analytics indexes:', error);
  }
}

// Validate and sanitize analytics event
function validateEvent(event) {
  // Check required base fields only - DO NOT filter eventName
  if (!event.userUID || typeof event.userUID !== 'string') {
    return { valid: false, error: 'Invalid userUID' };
  }
  
  if (!event.sessionId || typeof event.sessionId !== 'string') {
    return { valid: false, error: 'Invalid sessionId' };
  }
  
  if (!event.clientTs || typeof event.clientTs !== 'number' || event.clientTs <= 0) {
    return { valid: false, error: 'Invalid clientTs' };
  }
  
  // Allow any eventName, but limit length
  if (!event.eventName || typeof event.eventName !== 'string') {
    return { valid: false, error: 'Invalid eventName' };
  }
  
  // Limit payload size
  const payloadSize = JSON.stringify(event.payload || {}).length;
  if (payloadSize > 2000) {
    return { valid: false, error: 'Payload too large' };
  }
  
  // Trim string fields
  const sanitized = {
    ...event,
    eventName: event.eventName.substring(0, 50),
    route: event.route ? event.route.substring(0, 200) : '/',
    viewport: event.viewport ? event.viewport.substring(0, 20) : undefined,
    userAgent: event.userAgent ? event.userAgent.substring(0, 200) : undefined,
    payload: event.payload || {}
  };
  
  // Add server timestamp
  sanitized.serverTs = new Date();
  
  return { valid: true, event: sanitized };
}

// Store analytics events in batch
async function storeAnalyticsEvents(events) {
  try {
    const validEvents = [];
    const droppedEvents = [];
    
    for (const event of events) {
      const validation = validateEvent(event);
      if (validation.valid) {
        validEvents.push(validation.event);
      } else {
        droppedEvents.push({ event, error: validation.error });
      }
    }
    
    if (validEvents.length > 0) {
      if (mongoose) {
        try {
          const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
          const result = await AnalyticsEvent.insertMany(validEvents, { ordered: false });
            
          // Dev logging
          if (process.env.NODE_ENV !== 'production') {
            console.log(`📊 Analytics batch: saved=${validEvents.length}, dropped=${droppedEvents.length}`);
            if (droppedEvents.length > 0) {
              console.log('📊 Dropped reasons:', droppedEvents.slice(0, 2).map(d => `${d.error} (${d.event.eventName})`));
            }
          }
          
          return {
            success: true,
            savedCount: validEvents.length,
            droppedCount: droppedEvents.length,
            droppedSamples: droppedEvents
          };
        } catch (error) {
          console.error('Failed to store analytics events (mongoose):', error);
          return {
            success: false,
            error: error.message,
            savedCount: 0,
            droppedCount: events.length,
            droppedSamples: events.map(e => ({ event: e, error: 'Database error' }))
          };
        }
      } else {
        // Fallback using native MongoDB driver
        const db = getDB();
        const collection = db.collection('analytics_events');
        
        // Add server timestamp to each event
        const eventsWithTimestamp = validEvents.map(event => ({
          ...event,
          serverTs: new Date()
        }));
        
        const result = await collection.insertMany(eventsWithTimestamp, { ordered: false });
        
        // Dev logging
        if (process.env.NODE_ENV !== 'production') {
          console.log(`📊 Analytics batch (native): saved=${validEvents.length}, dropped=${droppedEvents.length}`);
          if (droppedEvents.length > 0) {
            console.log('📊 Dropped reasons:', droppedEvents.slice(0, 2).map(d => `${d.error} (${d.event.eventName})`));
          }
        }
        
        return {
          success: true,
          savedCount: validEvents.length,
          droppedCount: droppedEvents.length,
          droppedSamples: droppedEvents
        };
      }
    }
    
    return {
      success: true,
      savedCount: 0,
      droppedCount: droppedEvents.length,
      droppedSamples: droppedEvents
    };
  } catch (error) {
    console.error('Store analytics events error:', error);
    return {
      success: false,
      error: error.message,
      savedCount: 0,
      droppedCount: events.length,
      droppedSamples: events.map(e => ({ event: e, error: 'System error' }))
    };
  }
}

// Get analytics summary for a user
async function getUserAnalyticsSummary(userUID, timeRange = '30d') {
  if (!mongoose) {
    // Fallback using native MongoDB driver
    const db = getDB();
    const collection = db.collection('analytics_events');
    
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const summary = await collection.aggregate([
      {
        $match: {
          userUID: userUID,
          serverTs: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          firstSeen: { $min: '$serverTs' },
          lastSeen: { $max: '$serverTs' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    const sessionStats = await collection.aggregate([
      {
        $match: {
          userUID: userUID,
          serverTs: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$sessionId',
          startTime: { $min: '$serverTs' },
          endTime: { $max: '$serverTs' },
          duration: { $subtract: [{ $max: '$serverTs' }, { $min: '$serverTs' }] },
          eventCount: { $sum: 1 },
          routes: { $addToSet: '$route' }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgSessionDuration: { $avg: '$duration' },
          totalEvents: { $sum: '$eventCount' },
          uniqueRoutes: { $sum: { $size: '$routes' } }
        }
      }
    ]).toArray();
    
    return {
      eventSummary: summary,
      sessionStats: sessionStats[0] || {},
      timeRange,
      startDate,
      endDate: now
    };
  }
  
  // Original mongoose implementation would go here
  return {
    eventSummary: [],
    sessionStats: {},
    timeRange,
    startDate: new Date(),
    endDate: new Date()
  };
}

// Initialize analytics collection and indexes
async function initializeAnalytics() {
  try {
    await createAnalyticsIndexes();
    console.log('Analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

// Export model for use in routes (conditionally)
let AnalyticsEvent;
if (mongoose) {
  AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
}

module.exports = {
  initializeAnalytics,
  storeAnalyticsEvents,
  getUserAnalyticsSummary,
  validateEvent,
  AnalyticsEvent,
  mongoose
};