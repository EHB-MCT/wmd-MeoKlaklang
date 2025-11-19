const express = require("express");
const { createUser, findUserByName } = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Name required" });

  let user = await findUserByName(name);

  if (!user) {
    user = await createUser(name);
  }

  res.json(user);
});

module.exports = router;
