const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

// POST: nieuwe entry koppelen aan user
router.post("/", async (req, res) => {
  const db = getDB();
  const {
    userId,
    date,
    food,
    water,
    poop,
    vomit,
    meds,
    behavior,
    emotion,
    hoveredOptions,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId ontbreekt" });
  }

  const newEntry = {
    userId: new ObjectId(userId),
    date: date || new Date().toISOString().split("T")[0],
    food,
    water,
    poop,
    vomit,
    meds,
    behavior,
    emotion,
    hoveredOptions: hoveredOptions || [],
    createdAt: new Date(),
  };

  try {
    await db.collection("entries").insertOne(newEntry);
    res.status(201).json({ message: "Entry succesvol opgeslagen." });
  } catch (err) {
    console.error("❌ Fout bij opslaan:", err);
    res.status(500).json({ error: "Fout bij opslaan." });
  }
});

// GET entries per gebruiker
router.get("/", async (req, res) => {
  const db = getDB();
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId query ontbreekt" });
  }

  try {
    const entries = await db
      .collection("entries")
      .find({ userId: new ObjectId(userId) })
      .toArray();

    res.json(entries);
  } catch (err) {
    console.error("❌ Fout bij ophalen:", err);
    res.status(500).json({ error: "Fout bij ophalen van entries." });
  }
});

module.exports = router;
