const { getDB } = require("../db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

async function createUser(name, password) {
  const db = getDB();

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = {
    name,
    password: hashedPassword,
    createdAt: new Date(),
  };

  const result = await db.collection("users").insertOne(user);
  return { _id: result.insertedId, name: user.name };
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

module.exports = { createUser, findUserByName, validatePassword };
