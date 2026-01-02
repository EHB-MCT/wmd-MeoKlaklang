const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

async function createSession({ userId, sessionId, ipAddress, userAgent }) {
  const db = getDB();

  if (!userId || !sessionId) {
    throw new Error("createSession requires userId and sessionId");
  }

  const now = new Date();

  const newSession = {
    userId: new ObjectId(userId),
    sessionId: String(sessionId),
    createdAt: now,
    loginTime: now,
    lastActivity: now,
    logoutTime: null,
    duration: null,
    isActive: true,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const result = await db.collection("sessions").insertOne(newSession);
  return result.insertedId;
}

async function touchSession(sessionId) {
  const db = getDB();
  if (!sessionId) return;

  await db.collection("sessions").updateOne(
    { sessionId: String(sessionId) },
    { $set: { lastActivity: new Date() } }
  );
}

async function endSession(sessionId) {
  const db = getDB();
  const logoutTime = new Date();
  if (!sessionId) return;

  const session = await db.collection("sessions").findOne({ sessionId: String(sessionId) });
  if (!session) return;

  const duration = logoutTime - new Date(session.loginTime);

  await db.collection("sessions").updateOne(
    { sessionId: String(sessionId) },
    {
      $set: {
        logoutTime,
        duration,
        isActive: false,
        lastActivity: logoutTime,
        expiresAt: logoutTime,
      },
    }
  );
}

module.exports = { createSession, touchSession, endSession };
