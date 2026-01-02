const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

/* ===========================
    POST: nieuwe dagelijkse entry
=========================== */
router.post("/", async (req, res) => {
  console.log('📝 Entries POST route called');
  console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
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

  // Required fields validation
  const requiredFields = ['food', 'poop', 'behavior', 'emotion'];
  const missingRequired = requiredFields.filter(field => {
    const value = req.body[field];
    return !value || value === '';
  });
  if (missingRequired.length > 0) {
    return res.status(400).json({
      error: `Verplichte velden missen: ${missingRequired.join(', ')}`,
      missingFields
    });
  }

  /* ===== Validatie en cleaning ===== */
  // Helper to safely convert to number and validate
  const safeNumber = (value, fieldName) => {
    const num = Number(value);
    if (isNaN(num)) {
      return null; // Will be handled as missing/invalid
    }
    return num;
  };

  // Clean and convert numeric inputs
  let waterNum = safeNumber(water, 'water');
  let sleepHoursNum = safeNumber(sleepHours, 'sleepHours');
  let walksNum = safeNumber(walks, 'walks');
  let playtimeMinutesNum = safeNumber(playtimeMinutes, 'playtimeMinutes');
  let aloneHoursNum = safeNumber(aloneHours, 'aloneHours');

  // Reject if conversion failed for required fields
  if (waterNum === null && water !== null && water !== undefined && water !== '') {
    return res.status(400).json({ error: "Water moet een geldig getal zijn" });
  }

  // Numeric validation and clamping
  waterNum = waterNum !== null ? Math.max(0, waterNum) : null;
  sleepHoursNum = sleepHoursNum !== null ? Math.min(24, Math.max(0, sleepHoursNum)) : null;
  walksNum = walksNum !== null ? Math.max(0, walksNum) : null;
  playtimeMinutesNum = playtimeMinutesNum !== null ? Math.min(480, Math.max(0, playtimeMinutesNum)) : null;
  aloneHoursNum = aloneHoursNum !== null ? Math.min(24, Math.max(0, aloneHoursNum)) : null;
  if (sleepHoursNum < 0 || sleepHoursNum > 24) {
    return res.status(400).json({ error: "Slaapuren moet tussen 0-24 uur liggen" });
  }
  if (walksNum < 0 || walksNum > 20) {
    return res.status(400).json({ error: "Aantal wandelingen moet tussen 0-20 liggen" });
  }
  if (playtimeMinutesNum < 0 || playtimeMinutesNum > 480) { // Max 8 hours
    return res.status(400).json({ error: "Speeltijd moet tussen 0-480 minuten liggen" });
  }
  if (aloneHoursNum < 0 || aloneHoursNum > 24) {
    return res.status(400).json({ error: "Alleen thuis uren moet tussen 0-24 liggen" });
  }

  const newEntry = {
    userId: new ObjectId(userId),
    dogId: new ObjectId(dogId),

    date: date || new Date().toISOString().split("T")[0],

    /* ===== Zorgdata ===== */
    food: food || null,
    water: waterNum,
    sleepHours: sleepHoursNum,
    walks: walksNum,
    playtimeMinutes: playtimeMinutesNum,
    aloneHours: aloneHoursNum,

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
    timeOnPage: Math.max(0, Number(timeOnPage) || 0),
    // Recompute emptyFields on backend
    emptyFields: ['food', 'poop', 'behavior', 'emotion'].filter(field => 
      !req.body[field] || req.body[field] === ''
    ).length,

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
