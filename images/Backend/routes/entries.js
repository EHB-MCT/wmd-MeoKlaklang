const express = require("express");
const fs = require("fs");
const router = express.Router();
const dataPath = "./data/entries.json";

// Helper om JSON veilig te lezen
function readData() {
  try {
    const file = fs.readFileSync(dataPath, "utf8");
    return file ? JSON.parse(file) : [];
  } catch (err) {
    console.error("Fout bij lezen van entries.json:", err);
    return [];
  }
}

// GET all entries
router.get("/", (req, res) => {
  const data = readData();
  res.json(data);
});

// POST a new entry
router.post("/", (req, res) => {
  const newEntry = req.body;
  const data = readData();
  data.push(newEntry);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.status(201).json({ message: "Entry toegevoegd!" });
});

module.exports = router;
