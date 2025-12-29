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

/* ===========================
   PUT bestaande hond bijwerken
=========================== */
router.put("/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  
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

  try {
    const updatedDog = {
      name,
      breed,
      age: Number(age) || null,
      weight: Number(weight) || null,
      foodType: foodType || null,
      toys: Array.isArray(toys) ? toys : [],
      notes: notes || null,
      updatedAt: new Date(),
    };

    const result = await db.collection("dogs").updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { $set: updatedDog }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Hond niet gevonden" });
    }

    // Return the updated dog with the original userId
    res.status(200).json({ 
      _id: id, 
      userId: new ObjectId(userId),
      ...updatedDog 
    });
  } catch (err) {
    console.error("❌ Fout bij bijwerken hond:", err);
    res.status(500).json({ error: "Fout bij bijwerken hond" });
  }
});

/* ===========================
   DELETE hond
=========================== */
router.delete("/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    const result = await db.collection("dogs").deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Hond niet gevonden" });
    }

    res.status(200).json({ message: "Hond succesvol verwijderd" });
  } catch (err) {
    console.error("❌ Fout bij verwijderen hond:", err);
    res.status(500).json({ error: "Fout bij verwijderen hond" });
  }
});

module.exports = router;
