const { getDB } = require("../db");

async function createUser(name) {
  const db = getDB();
  const user = { name, createdAt: new Date() };

  const result = await db.collection("users").insertOne(user);
  
  return { _id: result.insertedId, ...user };
}

async function findUserByName(name) {
  const db = getDB();
  return db.collection("users").findOne({ name });
}

module.exports = { createUser, findUserByName };
