const express = require("express");
const {
  createUser,
  findUserByName,
  validatePassword,
  createAdminUser,
} = require("../models/User");

const router = express.Router();

const { createSession } = require("../models/Session");
const { v4: uuidv4 } = require("uuid");


// ✅ REGISTREREN: nieuwe gebruiker aanmaken
router.post("/register", async (req, res) => {
  const { name, password, isAdmin } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Name and password required" });
  }

  const existing = await findUserByName(name);
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  let newUser;
  if (isAdmin) {
    newUser = await createAdminUser(name, password);
  } else {
    newUser = await createUser(name, password);
  }
  
  res.status(201).json(newUser);
});

// ✅ LOGIN: controleren of gebruiker bestaat + wachtwoord klopt
router.post("/login", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Name and password required" });
  }

  const user = await validatePassword(name, password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ _id: user._id, name: user.name, role: user.role });
});

module.exports = router;
