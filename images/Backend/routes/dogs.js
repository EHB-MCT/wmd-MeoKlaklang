const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

/* ===========================
   GET honden per gebruiker
=========================== */
router.get("/:userId", async (req, res) => {
  const db = getDB();
  const { userId } = req.params;

  try {
    const dogs = await db
      .collection("dogs")
      .find({ userId: new ObjectId(userId) })
      .toArray();

    res.json(dogs);
  } catch (err) {
    console.error("❌ Fout bij ophalen honden:", err);
    res.status(500).json({ error: "Fout bij ophalen honden" });
  }
});

/* ===========================
   POST nieuwe hond
=========================== */
router.post("/", async (req, res) => {
  const db = getDB();

  const {
    userId,
    name,
    breed,
    age,
    weight,
    foodType,
    toys,
    notes,
  } = req.body;

  if (!userId || !name || !breed) {
    return res.status(400).json({
      error: "userId, naam en ras zijn verplicht",
    });
  }

  const newDog = {
    userId: new ObjectId(userId),
    name,
    breed,
    age: Number(age) || null,
    weight: Number(weight) || null,
    foodType: foodType || null,
    toys: Array.isArray(toys) ? toys : [],
    notes: notes || null,
    createdAt: new Date(),
  };

  try {
    const result = await db.collection("dogs").insertOne(newDog);
    res.status(201).json({ ...newDog, _id: result.insertedId });
  } catch (err) {
    console.error("❌ Fout bij opslaan hond:", err);
    res.status(500).json({ error: "Fout bij opslaan hond" });
  }
});

module.exports = router;
