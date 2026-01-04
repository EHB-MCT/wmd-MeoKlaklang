const express = require("express");
const crypto = require("crypto");

const {
  createUser,
  findUserByName,
  validatePassword,
  createAdminUser,
  updateUserLastLogin,
} = require("../models/User");

const { createSession } = require("../models/Session");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, password, isAdmin } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Name and password required" });
    }

    const existing = await findUserByName(name);
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const newUser = isAdmin
      ? await createAdminUser(name, password)
      : await createUser(name, password);

    return res.status(201).json(newUser);
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Name and password required" });
    }

    const user = await validatePassword(name, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionId = crypto.randomBytes(16).toString("hex");

    await createSession({
      userId: user._id.toString(),
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || null,
    });

    await updateUserLastLogin(user._id);

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      sessionId,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
