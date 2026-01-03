const { getDB } = require("../db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

async function createUser(name, password, role = 'user') {
  const db = getDB();

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    name,
    password: hashedPassword,
    role, // 'admin', 'manager', 'user'
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Generate email for admin use
    createdAt: new Date(),
    lastLogin: null,
    isActive: true,
    permissions: getDefaultPermissions(role)
  };

  const result = await db.collection("users").insertOne(user);
  return { _id: result.insertedId, name: user.name, role };
}

function getDefaultPermissions(role) {
  const permissions = {
    admin: ['read_all_users', 'write_all_users', 'delete_users', 'view_analytics', 'manage_system'],
    manager: ['read_own_users', 'view_analytics', 'export_data'],
    user: ['read_own_data', 'view_own_analytics']
  };
  return permissions[role] || permissions.user;
}

async function findUserByName(name) {
  const db = getDB();
  return db.collection("users").findOne({ name });
}

async function validatePassword(name, inputPassword) {
  const user = await findUserByName(name);
  if (!user) return false;

  const isMatch = await bcrypt.compare(inputPassword, user.password);
  return isMatch ? user : null;
}

// ===========================
// USER MANAGEMENT FUNCTIONS
// ===========================
async function createAdminUser(name, password) {
  return createUser(name, password, 'admin');
}

async function updateUserRole(userId, newRole) {
  const db = getDB();
  const { ObjectId } = require("mongodb");
  
  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        role: newRole,
        permissions: getDefaultPermissions(newRole),
        updatedAt: new Date()
      }
    }
  );
  
  return result.modifiedCount > 0;
}

// ===========================
// ADMIN AUTHENTICATION
// ===========================
async function validateAdminLogin(name, password) {
  const user = await findUserByName(name);
  if (!user) return { success: false, error: "Gebruiker niet gevonden" };
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    return { success: false, error: "Geen admin toegang" };
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, error: "Ongeldig wachtwoord" };
  
  // Update last login
  await updateUserLastLogin(user._id);
  
  return { success: true, user: { _id: user._id, name: user.name, role: user.role } };
}

async function updateUserLastLogin(userId) {
  const db = getDB();
  const { ObjectId } = require("mongodb");
  
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { lastLogin: new Date() } }
  );
}

// ===========================
// USER ANALYTICS FOR ADMIN
// ===========================
async function getAllUsers(options = {}) {
  const db = getDB();
  const { page = 1, limit = 50, search = '', role = null } = options;
  const { ObjectId } = require("mongodb");
  
  let query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  const users = await db
    .collection("users")
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const total = await db.collection("users").countDocuments(query);
  
  return {
    users: users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

async function getUserById(userId) {
  const db = getDB();
  const { ObjectId } = require("mongodb");
  
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  
  if (!user) return null;
  
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    permissions: user.permissions
  };
}

async function getUserAnalytics(userId, timeRange = "30d") {
  try {
    const db = getDB();
    const { ObjectId } = require("mongodb");

    // Date range
    const now = new Date();
    const daysBack =
      timeRange === "7d" ? 7 :
      timeRange === "30d" ? 30 :
      timeRange === "90d" ? 90 : 30;

    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Safe ObjectId conversion
    let userObjectId = null;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      userObjectId = null;
    }

    // Match user as BOTH string or ObjectId
    const matchUser = userObjectId
      ? { $or: [{ userId: userId }, { userId: userObjectId }] }
      : { userId: userId };

    // ---- EVENTS ----
    // Use "events" collection (Mongo does not error if empty / not created yet)
    const events = await db.collection("events").aggregate([
      {
        $match: {
          ...matchUser,
          // some trackers use "timestamp", some use "createdAt"
          $or: [
            { timestamp: { $gte: startDate } },
            { createdAt: { $gte: startDate } }
          ]
        }
      },
      {
        $addFields: {
          safeType: { $ifNull: ["$type", { $ifNull: ["$eventName", "unknown"] }] },
          safeTime: { $ifNull: ["$timestamp", { $ifNull: ["$createdAt", new Date()] }] }
        }
      },
      {
        $group: {
          _id: "$safeType",
          count: { $sum: 1 },
          lastOccurrence: { $max: "$safeTime" }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // ---- SESSIONS SUMMARY from events ----
    const sessionsAgg = await db.collection("events").aggregate([
      {
        $match: {
          ...matchUser,
          $or: [
            { timestamp: { $gte: startDate } },
            { createdAt: { $gte: startDate } }
          ]
        }
      },
      {
        $addFields: {
          safeTime: { $ifNull: ["$timestamp", { $ifNull: ["$createdAt", new Date()] }] },
          safeSessionId: { $ifNull: ["$sessionId", "unknown-session"] },
          safeType: { $ifNull: ["$type", { $ifNull: ["$eventName", "unknown"] }] }
        }
      },
      {
        $group: {
          _id: "$safeSessionId",
          startTime: { $min: "$safeTime" },
          endTime: { $max: "$safeTime" },
          eventCount: { $sum: 1 },
          pageViews: {
            $sum: { $cond: [{ $eq: ["$safeType", "page_view"] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          duration: { $subtract: ["$endTime", "$startTime"] }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgSessionDuration: { $avg: "$duration" },
          totalEvents: { $sum: "$eventCount" },
          avgPageViews: { $avg: "$pageViews" },
          bounceRate: {
            $avg: {
              $cond: [{ $eq: ["$pageViews", 1] }, 1, 0]
            }
          }
        }
      }
    ]).toArray();

    const sessionsSummary = sessionsAgg[0] || {};

    // ---- DOGS / ENTRIES ----
    // your dogs/entries store ObjectId userId, so only count if valid ObjectId
    const dogsCount = userObjectId ? await db.collection("dogs").countDocuments({ userId: userObjectId }) : 0;
    const entriesCount = userObjectId ? await db.collection("entries").countDocuments({ userId: userObjectId }) : 0;

    return {
      events,
      sessions: sessionsSummary,
      summary: {
        totalEvents: sessionsSummary.totalEvents || 0,
        totalSessions: sessionsSummary.totalSessions || 0,
        avgSessionDuration: sessionsSummary.avgSessionDuration || 0,
        avgPageViews: sessionsSummary.avgPageViews || 0,
        bounceRate: sessionsSummary.bounceRate || 0,
        totalDogs: dogsCount,
        totalEntries: entriesCount,
        lastLogin: new Date()
      }
    };
  } catch (err) {
    console.error("❌ getUserAnalytics crashed:", err);
    // Never crash the API: return safe default
    return {
      events: [],
      sessions: {},
      summary: {
        totalEvents: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        avgPageViews: 0,
        bounceRate: 0,
        totalDogs: 0,
        totalEntries: 0,
        lastLogin: new Date()
      },
      error: "analytics_failed"
    };
  }
}



async function deactivateUser(userId) {
  const db = getDB();
  const { ObjectId } = require("mongodb");
  
  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { isActive: false, updatedAt: new Date() } }
  );
  
  return result.modifiedCount > 0;
}

module.exports = { 
  createUser, 
  createAdminUser, 
  findUserByName, 
  validatePassword,
  validateAdminLogin,
  updateUserRole,
  getAllUsers,
  getUserById,
  getUserAnalytics,
  deactivateUser,
  updateUserLastLogin
};
