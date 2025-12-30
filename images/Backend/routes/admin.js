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
// ADMIN DASHBOARD STATS
// ===========================
router.get("/stats", async (req, res) => {
  try {
    const db = require("../db").getDB();
    
    const totalUsers = await db.collection("users").countDocuments();
    const activeUsers = await db.collection("users").countDocuments({ isActive: true });
    const totalEvents = await db.collection("events").countDocuments();
    const totalSessions = await db.collection("events").distinct("sessionId").then(sessions => sessions.length);
    
    // Get user role distribution
    const roleStats = await db.collection("users").aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get last 30 days activity
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const recentEvents = await db.collection("events").countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });
    
    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalEvents,
        totalSessions,
        recentEvents
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