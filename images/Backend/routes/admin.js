const express = require("express");
const { validateAdminLogin, getAllUsers, getUserById, getUserAnalytics, updateUserRole, deactivateUser } = require("../models/User");

const router = express.Router();

// ===========================
// ADMIN LOGIN
// ===========================
router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({
        error: "Naam en wachtwoord zijn verplicht"
      });
    }

    const result = await validateAdminLogin(name, password);
    
    if (result.success) {
      // Store admin session
      req.session = req.session || {};
      req.session.isAdmin = true;
      req.session.adminUser = result.user;
      
      res.json({ 
        success: true, 
        user: result.user,
        message: "Admin login succesvol"
      });
    } else {
      res.status(401).json({
        error: result.error,
        success: false
      });
    }
  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ error: "Serverfout bij admin login" });
  }
});

// ===========================
// GET ALL USERS
// ===========================
router.get("/users", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      role = null 
    } = req.query;
    
    const result = await getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role
    });
    
    res.json(result);
  } catch (err) {
    console.error("❌ Fout bij ophalen gebruikers:", err);
    res.status(500).json({ error: "Fout bij ophalen gebruikers" });
  }
});

// ===========================
// GET USER ANALYTICS
// ===========================
router.get("/analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    const analytics = await getUserAnalytics(userId, timeRange);
    res.json(analytics);
  } catch (err) {
    console.error("❌ Fout bij ophalen user analytics:", err);
    res.status(500).json({ error: "Fout bij ophalen user analytics" });
  }
});

// ===========================
// GET DETAILED USER INFO
// ===========================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("❌ Fout bij ophalen gebruiker:", err);
    res.status(500).json({ error: "Fout bij ophalen gebruiker" });
  }
});

// ===========================
// UPDATE USER ROLE
// ===========================
router.put("/user/:userId/role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    
    if (!newRole || !['admin', 'manager', 'user'].includes(newRole)) {
      return res.status(400).json({
        error: "Ongeldige rol"
      });
    }
    
    const success = await updateUserRole(userId, newRole);
    
    if (success) {
      res.json({
        success: true,
        message: "Gebruikersrol succesvol bijgewerkt"
      });
    } else {
      res.status(404).json({
        error: "Gebruiker niet gevonden"
      });
    }
  } catch (err) {
    console.error("❌ Fout bij bijwerken gebruikersrol:", err);
    res.status(500).json({ error: "Fout bij bijwerken gebruikersrol" });
  }
});

// ===========================
// DEACTIVATE USER
// ===========================
router.put("/user/:userId/deactivate", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const success = await deactivateUser(userId);
    
    if (success) {
      res.json({
        success: true,
        message: "Gebruiker succesvol gedeactiveerd"
      });
    } else {
      res.status(404).json({
        error: "Gebruiker niet gevonden"
      });
    }
  } catch (err) {
    console.error("❌ Fout bij deactiveren gebruiker:", err);
    res.status(500).json({ error: "Fout bij deactiveren gebruiker" });
  }
});

// ===========================
// DELETE USER
// ===========================
router.delete("/user/:userId/delete", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = require("../db").getDB();
    const { ObjectId } = require("mongodb");
    
    // Check if user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "Gebruiker niet gevonden" });
    }
    
    console.log(`🗑️ Deleting user: ${user.name} (${userId}) and all associated data`);
    
    // Delete user and all associated data
    const deletePromises = [
      // Delete user
      db.collection("users").deleteOne({ _id: new ObjectId(userId) }),
      
      // Delete user's dogs
      db.collection("dogs").deleteMany({ userId: new ObjectId(userId) }),
      
      // Delete user's entries
      db.collection("entries").deleteMany({ userId: new ObjectId(userId) }),
      
      // Delete user's sessions
      db.collection("sessions").deleteMany({ userId: userId }),
      
      // Delete user's events/analytics
      db.collection("events").deleteMany({ 
        $or: [
          { userId: userId },
          { userId: new ObjectId(userId) }
        ]
      })
    ];
    
    const results = await Promise.all(deletePromises);
    
    console.log(`✅ Deleted: ${results[0].deletedCount} users, ${results[1].deletedCount} dogs, ${results[2].deletedCount} entries, ${results[3].deletedCount} sessions, ${results[4].deletedCount} events`);
    
    res.json({
      success: true,
      message: "Gebruiker en alle bijbehorende data permanent verwijderd",
      deletedCounts: {
        users: results[0].deletedCount,
        dogs: results[1].deletedCount,
        entries: results[2].deletedCount,
        sessions: results[3].deletedCount,
        events: results[4].deletedCount
      }
    });
    
  } catch (err) {
    console.error("❌ Fout bij verwijderen gebruiker:", err);
    res.status(500).json({ error: "Fout bij verwijderen gebruiker" });
  }
});

// ===========================
// ADMIN DASHBOARD STATS
// ===========================
router.get("/stats", async (req, res) => {
  try {
    const db = require("../db").getDB();
    
    // User statistics
    const totalUsers = await db.collection("users").countDocuments();
    const activeUsers = await db.collection("users").countDocuments({ isActive: true });
    const adminUsers = await db.collection("users").countDocuments({ role: "admin" });
    const managerUsers = await db.collection("users").countDocuments({ role: "manager" });
    const regularUsers = await db.collection("users").countDocuments({ role: "user" });
    
    // Dog statistics
    const totalDogs = await db.collection("dogs").countDocuments();
    const activeDogs = await db.collection("dogs").distinct("userId").then(users => users.length);
    
    // Entry statistics
    const totalEntries = await db.collection("entries").countDocuments();
    
    // Session statistics (using entries as proxy for activity)
    const totalSessions = await db.collection("entries").countDocuments();
    const uniqueSessionUsers = await db.collection("entries").distinct("userId").then(users => users.length);
    
    // Get user role distribution
    const roleStats = await db.collection("users").aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get last 30 days activity (using entries)
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const recentEvents = await db.collection("entries").countDocuments({
      date: { $gte: thirtyDaysAgo }
    });
    
    const recentEntries = await db.collection("entries").countDocuments({
      date: { $gte: thirtyDaysAgo }
    });
    
    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const recentRegistrations = await db.collection("users").countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Most popular dog breeds
    const popularBreeds = await db.collection("dogs").aggregate([
      { $group: { _id: "$breed", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    // User growth (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000));
    const userGrowth = await db.collection("users").aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } }
      },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray();
    
    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalDogs,
        activeDogs,
        totalEntries,
        totalSessions,
        uniqueSessionUsers,
        recentEvents,
        recentEntries,
        recentRegistrations
      },
      detailedStats: {
        adminUsers,
        managerUsers,
        regularUsers,
        popularBreeds,
        userGrowth
      },
      roleDistribution: roleStats,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen admin stats:", err);
    res.status(500).json({ error: "Fout bij ophalen admin stats" });
  }
});

// ===========================
// ADMIN SESSION CHECK
// ===========================
router.get("/check", (req, res) => {
  const isAdmin = req.session && req.session.isAdmin;
  const user = req.session && req.session.adminUser;
  
  res.json({
    isAdmin,
    user: isAdmin ? user : null
  });
});

// ===========================
// ADMIN LOGOUT
// ===========================
router.post("/logout", (req, res) => {
  req.session = null;
  res.json({
    success: true,
    message: "Admin logout succesvol"
  });
});

module.exports = router;