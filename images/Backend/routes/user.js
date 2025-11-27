const express = require("express");
const {
  createUser,
  findUserByName,
  validatePassword,
} = require("../models/User");

const router = express.Router();

// ✅ REGISTREREN: nieuwe gebruiker aanmaken
router.post("/register", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Name and password required" });
  }

  const existing = await findUserByName(name);
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  const newUser = await createUser(name, password);
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

  res.json({ _id: user._id, name: user.name });
});

module.exports = router;
