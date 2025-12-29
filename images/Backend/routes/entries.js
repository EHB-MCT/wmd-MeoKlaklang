const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

/* ===========================
   POST: nieuwe dagelijkse entry
=========================== */
router.post("/", async (req, res) => {
  const db = getDB();

  const {
    userId,
    dogId,
    date,

    // basis
    food,
    water,
    sleepHours,
    walks,
    playtimeMinutes,
    aloneHours,

    // gezondheid & gedrag
    poop,
    vomit,
    meds,
    behavior,
    emotion,
    appetite,
    energyLevel,

    stressSignals,
    painSignals,
    trainingDone,
    leftAloneTooLong,

    // subjectief (weapon)
    ownerConcern,

    // impliciete data
    hoveredOptions,
    timeOnPage,
    emptyFields,
  } = req.body;

  /* ===== Validatie ===== */
  if (!userId || !dogId) {
    return res.status(400).json({
      error: "userId en dogId zijn verplicht",
    });
  }

  const newEntry = {
    userId: new ObjectId(userId),
    dogId: new ObjectId(dogId),

    date: date || new Date().toISOString().split("T")[0],

    /* ===== Zorgdata ===== */
    food: food || null,
    water: Number(water) || 0,
    sleepHours: Number(sleepHours) || 0,
    walks: Number(walks) || 0,
    playtimeMinutes: Number(playtimeMinutes) || 0,
    aloneHours: Number(aloneHours) || 0,

    /* ===== Gezondheid ===== */
    poop: poop || null,
    vomit: Boolean(vomit),
    meds: Boolean(meds),
    behavior: behavior || null,
    emotion: emotion || null,
    appetite: appetite || null,
    energyLevel: energyLevel || null,

    stressSignals: Boolean(stressSignals),
    painSignals: Boolean(painSignals),
    trainingDone: Boolean(trainingDone),
    leftAloneTooLong: Boolean(leftAloneTooLong),

    /* ===== Subjectieve zorg ===== */
    ownerConcern: ownerConcern || null,

    /* ===== Weapon data ===== */
    hoveredOptions: Array.isArray(hoveredOptions) ? hoveredOptions : [],
    timeOnPage: Number(timeOnPage) || 0,
    emptyFields: Number(emptyFields) || 0,

    createdAt: new Date(),
  };

  try {
    await db.collection("entries").insertOne(newEntry);
    res.status(201).json({ message: "Dagelijkse entry opgeslagen 🐾" });
  } catch (err) {
    console.error("❌ Fout bij opslaan:", err);
    res.status(500).json({ error: "Fout bij opslaan van entry" });
  }
});

/* ===========================
   GET: entries per gebruiker
=========================== */
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
      .sort({ createdAt: -1 })
      .toArray();

    res.json(entries);
  } catch (err) {
    console.error("❌ Fout bij ophalen:", err);
    res.status(500).json({ error: "Fout bij ophalen van entries" });
  }
});

module.exports = router;
