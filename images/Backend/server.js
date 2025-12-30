const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const userRoutes = require("./routes/user");
const entryRoutes = require("./routes/entries"); 
const dogsRoutes = require("./routes/dogs");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/dogs", dogsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

connectDB().then(() => {
  app.listen(5002, () => console.log("✅ Backend running on http://localhost:5002"));
});
