const express = require("express");
const { getDB } = require("../db");

const router = express.Router();

// GET /api/sessions/user/:userId - Get user sessions with enhanced tracking
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }
    
    const db = getDB();
    const { ObjectId } = require("mongodb");
    
    // Calculate date range
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[timeRange] || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Get user sessions with analytics data
    const sessions = await db
      .collection("sessions")
      .aggregate([
        {
          $match: { 
            userId: new ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'events',
            localField: 'sessionId',
            foreignField: 'sessionId',
            as: 'sessionEvents'
          }
        },
        {
          $addFields: {
            eventCount: { $size: '$sessionEvents' },
            pageViews: {
              $size: {
                $filter: {
                  input: '$sessionEvents',
                  cond: { $eq: ['$$this.type', 'page_view'] }
                }
              }
            },
            clicks: {
              $size: {
                $filter: {
                  input: '$sessionEvents',
                  cond: { $eq: ['$$this.type', 'click'] }
                }
              }
            },
            // Calculate actual session duration from events
            actualDuration: {
              $cond: {
                if: { $gt: [{ $size: '$sessionEvents' }, 0] },
                then: {
                  $subtract: [
                    { $max: '$sessionEvents.timestamp' },
                    { $min: '$sessionEvents.timestamp' }
                  ]
                },
                else: 0
              }
            }
          }
        },
        {
          $addFields: {
            // Use actual duration if available, otherwise fallback to expiresAt - createdAt
            calculatedDuration: {
              $cond: {
                if: { $gt: ['$actualDuration', 0] },
                then: '$actualDuration',
                else: {
                  $subtract: [
                    { $ifNull: ['$expiresAt', new Date()] },
                    '$createdAt'
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            sessionId: 1,
            createdAt: 1,
            expiresAt: 1,
            ip: 1,
            userAgent: 1,
            eventCount: 1,
            pageViews: 1,
            clicks: 1,
            calculatedDuration: 1,
            isActive: {
              $cond: {
                if: { $gt: ['$expiresAt', new Date()] },
                then: true,
                else: false
              }
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();
    
    // Calculate summary statistics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;
    const totalDuration = sessions.reduce((sum, session) => sum + (session.calculatedDuration || 0), 0);
    const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
    
    res.json({
      sessions,
      summary: {
        totalSessions,
        activeSessions,
        totalDuration: Math.round(totalDuration / 1000 / 60), // minutes
        avgDuration: Math.round(avgDuration / 1000 / 60), // minutes
        timeRange: `${daysBack} days`
      }
    });
    
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ 
      error: "Error fetching sessions" 
    });
  }
});

// GET /api/sessions/active - Get active sessions
router.get("/active", async (req, res) => {
  try {
    const db = getDB();
    const now = new Date();
    
    const activeSessions = await db
      .collection("sessions")
      .find({ 
        expiresAt: { $gt: now }
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(activeSessions);
    
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ 
      error: "Error fetching active sessions" 
    });
  }
});

// DELETE /api/sessions/:sessionId - Logout session
router.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required"
      });
    }
    
    const db = getDB();
    
    // Delete session
    const result = await db
      .collection("sessions")
      .deleteOne({ sessionId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Session not found"
      });
    }
    
    res.json({ 
      success: true,
      message: "Session logged out successfully"
    });
    
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ 
      error: "Error deleting session" 
    });
  }
});

// GET /api/sessions/user/:userId/health-alerts - Get pet health alerts for user
router.get("/user/:userId/health-alerts", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }
    
    const db = getDB();
    const { ObjectId } = require("mongodb");
    
    // Calculate date range
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[timeRange] || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Get user's pets
    const dogs = await db
      .collection("dogs")
      .find({ userId: new ObjectId(userId) })
      .toArray();
    
    if (dogs.length === 0) {
      return res.json({ alerts: [], dogs: [] });
    }
    
    // Get entries for all user's dogs in the time range
    const dogIds = dogs.map(dog => dog._id);
    const entries = await db
      .collection("entries")
      .find({
        userId: new ObjectId(userId),
        dogId: { $in: dogIds },
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Generate health alerts based on entries
    const alerts = [];
    
    entries.forEach(entry => {
      const dog = dogs.find(d => d._id.toString() === entry.dogId.toString());
      if (!dog) return;
      
      const entryDate = new Date(entry.createdAt).toLocaleDateString('nl-NL');
      
      // Critical alerts - immediate veterinary attention
      if (entry.vomit && entry.painSignals) {
        alerts.push({
          type: 'critical',
          title: `🚨 Dringend: ${dog.name} heeft medische aandacht nodig`,
          message: `${dog.name} heeft overgegeven en toont pijn signalen. Neem onmiddellijk contact op met uw dierenarts.`,
          recommendation: 'Neem contact op met dierenarts',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
      
      // High priority alerts
      if (entry.vomit && !alerts.find(a => a.dogId === dog._id && a.title.includes('overgegeven'))) {
        alerts.push({
          type: 'high',
          title: `⚠️ Let op: ${dog.name} heeft overgegeven`,
          message: `${dog.name} heeft overgegeven op ${entryDate}. Houd de situatie goed in de gaten.`,
          recommendation: 'Observeer en neem bij aanhoudende klachten contact op met dierenarts',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
      
      if (entry.painSignals && !alerts.find(a => a.dogId === dog._id && a.title.includes('pijn signalen'))) {
        alerts.push({
          type: 'high',
          title: `⚠️ Pijn signalen gedetecteerd bij ${dog.name}`,
          message: `${dog.name} toont pijn signalen. Dit kan wijzen op medische problemen.`,
          recommendation: 'Observeer gedrag en overweeg dierenarts te raadplegen',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
      
      // Medium priority alerts
      if (entry.stressSignals && !alerts.find(a => a.dogId === dog._id && a.title.includes('stress signalen'))) {
        alerts.push({
          type: 'medium',
          title: `😰 Stress signalen bij ${dog.name}`,
          message: `${dog.name} toont stress signalen. Probeer de oorzaak te identificeren en een rustige omgeving te creëren.`,
          recommendation: 'Creëer rustige omgeving, overweeg gedragstherapeut',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
      
      if (entry.leftAloneTooLong && !alerts.find(a => a.dogId === dog._id && a.title.includes('alleen gelaten'))) {
        alerts.push({
          type: 'medium',
          title: `🏠 ${dog.name} te lang alleen gelaten`,
          message: `${dog.name} is te lang alleen gelaten. Dit kan stress en angst veroorzaken.`,
          recommendation: 'Overweeg oppas of hondenuitlaatservice',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
      
      // Low priority alerts - behavioral concerns
      if (entry.behavior === 'agressief' && !alerts.find(a => a.dogId === dog._id && a.title.includes('agressief gedrag'))) {
        alerts.push({
          type: 'low',
          title: `🐕 Agressief gedrag bij ${dog.name}`,
          message: `${dog.name} toont agressief gedrag. Dit kan wijzen op onderliggende problemen.`,
          recommendation: 'Observeer triggers, overweeg gedragstraining',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
      
      // Wellness recommendations based on patterns
      if (entry.appetite === 'slecht' && !alerts.find(a => a.dogId === dog._id && a.title.includes('eetlust'))) {
        alerts.push({
          type: 'low',
          title: `🍽️ Verminderde eetlust bij ${dog.name}`,
          message: `${dog.name} heeft slechte eetlust getoond. Houd dit goed in de gaten.`,
          recommendation: 'Monitor gewicht, raadpleeg dierenarts als aanhoudend',
          date: entryDate,
          dogName: dog.name,
          dogId: dog._id,
          entryId: entry._id
        });
      }
    });
    
    // Sort alerts by priority (critical first) and then by date (most recent)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      if (priorityOrder[a.type] !== priorityOrder[b.type]) {
        return priorityOrder[a.type] - priorityOrder[b.type];
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    res.json({
      alerts,
      dogs: dogs.map(dog => ({
        id: dog._id,
        name: dog.name,
        breed: dog.breed,
        age: dog.age
      })),
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.type === 'critical').length,
        high: alerts.filter(a => a.type === 'high').length,
        medium: alerts.filter(a => a.type === 'medium').length,
        low: alerts.filter(a => a.type === 'low').length
      }
    });
    
  } catch (error) {
    console.error("Error fetching health alerts:", error);
    res.status(500).json({ 
      error: "Error fetching health alerts" 
    });
  }
});

module.exports = router;