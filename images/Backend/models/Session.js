const { getDB } = require("../db");
const { ObjectId } = require("mongodb");

async function createSession({ userId, sessionId, ipAddress, userAgent }) {
  const db = getDB();

  const newSession = {
    userId: new ObjectId(userId),
    sessionId,
    loginTime: new Date(),
    isActive: true,
    ipAddress,
    userAgent,
    pageViews: 0,
    actions: [],
  };

  const result = await db.collection("sessions").insertOne(newSession);
  return result.insertedId;
}

async function endSession(sessionId) {
  const db = getDB();
  const logoutTime = new Date();

  const session = await db.collection("sessions").findOne({ sessionId });

  if (!session) return;

  const duration = logoutTime - session.loginTime;

  await db.collection("sessions").updateOne(
    { sessionId },
    {
      $set: {
        logoutTime,
        duration,
        isActive: false,
      },
    }
  );
}

module.exports = { createSession, endSession };
