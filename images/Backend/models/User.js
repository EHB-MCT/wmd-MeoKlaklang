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

async function getUserAnalytics(userId, timeRange = '30d') {
  const db = getDB();
  const { ObjectId } = require("mongodb");
  
  // Calculate date range
  const now = new Date();
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 30;
  const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  
  // Get user's events
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
          _id: "$type",
          count: { $sum: 1 },
          lastOccurrence: { $max: "$timestamp" }
        }
      }
    ])
    .toArray();
    
  // Get user's sessions
  const sessions = await db
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
          _id: "$sessionId",
          startTime: { $min: "$timestamp" },
          endTime: { $max: "$timestamp" },
          duration: { $subtract: [{ $max: "$timestamp" }, { $min: "$timestamp" }] },
          eventCount: { $sum: 1 },
          pageViews: {
            $sum: {
              $cond: [{ $eq: ["$type", "page_view"] }, 1, 0]
            }
          }
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
              $cond: [
                { $eq: ["$pageViews", 1] },
                1, 0
              ]
            }
          }
        }
      }
    ])
    .toArray();

  // Get user's dogs and entries
  const dogsCount = await db.collection("dogs").countDocuments({ userId: new ObjectId(userId) });
  const entriesCount = await db.collection("entries").countDocuments({ userId: new ObjectId(userId) });

  return {
    events,
    sessions: sessions[0] || {},
    summary: {
      totalEvents: sessions[0]?.totalEvents || 0,
      totalSessions: sessions[0]?.totalSessions || 0,
      avgSessionDuration: sessions[0]?.avgSessionDuration || 0,
      avgPageViews: sessions[0]?.avgPageViews || 0,
      bounceRate: sessions[0]?.bounceRate || 0,
      totalDogs: dogsCount,
      totalEntries: entriesCount,
      lastLogin: new Date()
    }
  };
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
