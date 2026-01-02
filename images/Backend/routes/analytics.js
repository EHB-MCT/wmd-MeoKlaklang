const express = require('express');
const { storeAnalyticsEvents, getAnalyticsEvents, getUserAnalyticsSummary } = require('../models/AnalyticsEvent');

const router = express.Router();

// POST /api/analytics/batch - Store analytics events in batch
router.post('/batch', async (req, res) => {
  try {
    const { events } = req.body;
    
    // Validate request
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        ok: false,
        error: 'events array is required'
      });
    }
    
    if (events.length === 0) {
      return res.json({
        ok: true,
        savedCount: 0,
        droppedCount: 0
      });
    }
    
    if (events.length > 100) {
      return res.status(400).json({
        ok: false,
        error: 'Maximum 100 events per batch'
      });
    }
    
    // Store events
    const result = await storeAnalyticsEvents(events);
    
    if (result.success) {
      return res.json({
        ok: true,
        savedCount: result.savedCount,
        droppedCount: result.droppedCount,
        droppedSamples: result.droppedSamples
      });
    } else {
      return res.status(500).json({
        ok: false,
        error: result.error,
        savedCount: result.savedCount,
        droppedCount: result.droppedCount
      });
    }
    
  } catch (error) {
    console.error('Analytics batch endpoint error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/analytics/debug/latest - Dev-only debug route
router.get('/debug/latest', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const { AnalyticsEvent, mongoose } = require('../models/AnalyticsEvent');
    
    let events;
    if (mongoose && AnalyticsEvent) {
      events = await AnalyticsEvent
        .find({})
        .sort({ serverTs: -1 })
        .limit(parseInt(limit))
        .lean();
    } else {
      // Fallback to native MongoDB driver
      const { getDB } = require('../db');
      const db = getDB();
      const collection = db.collection('analytics_events');
      events = await collection
        .find({})
        .sort({ serverTs: -1 })
        .limit(parseInt(limit))
        .toArray();
    }
    
    return res.json({
      ok: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Analytics debug route error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/analytics/events - Query analytics events (admin only)
router.get('/events', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      sortBy = 'serverTs',
      sortOrder = '-1',
      userUID,
      sessionId,
      eventName,
      startDate,
      endDate
    } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 1000), // Cap at 1000
      sortBy,
      sortOrder: parseInt(sortOrder),
      userUID,
      sessionId,
      eventName,
      startDate,
      endDate
    };
    
    const result = await getAnalyticsEvents({}, options);
    
    return res.json({
      ok: true,
      ...result
    });
    
  } catch (error) {
    console.error('Analytics events query error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/analytics/user/:userUID/summary - Get user analytics summary
router.get('/user/:userUID/summary', async (req, res) => {
  try {
    const { userUID } = req.params;
    const { timeRange = '30d' } = req.query;
    
    if (!userUID) {
      return res.status(400).json({
        ok: false,
        error: 'userUID is required'
      });
    }
    
    const summary = await getUserAnalyticsSummary(userUID, timeRange);
    
    return res.json({
      ok: true,
      summary
    });
    
  } catch (error) {
    console.error('User analytics summary error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'analytics'
  });
});

// GET /api/analytics/user/:userUID - Get user analytics data
router.get('/user/:userUID', async (req, res) => {
  try {
    const { userUID } = req.params;
    const { timeRange = '30d' } = req.query;
    
    if (!userUID) {
      return res.status(400).json({
        ok: false,
        error: 'userUID is required'
      });
    }
    
    // Calculate date range
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[timeRange] || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { AnalyticsEvent, mongoose } = require('../models/AnalyticsEvent');
    
    let events;
    if (mongoose && AnalyticsEvent) {
      events = await AnalyticsEvent
        .find({ 
          userUID,
          serverTs: { $gte: startDate }
        })
        .sort({ serverTs: -1 })
        .lean();
    } else {
      // Fallback to native MongoDB driver
      const { getDB } = require('../db');
      const db = getDB();
      const collection = db.collection('analytics_events');
      events = await collection
        .find({ 
          userUID,
          serverTs: { $gte: startDate }
        })
        .sort({ serverTs: -1 })
        .toArray();
    }
    
    // Calculate summary statistics
    const summary = {
      totalEvents: events.length,
      dateRange: `${daysBack} days`,
      timeRange,
      events
    };
    
    return res.json(summary);
    
  } catch (error) {
    console.error('User analytics route error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;