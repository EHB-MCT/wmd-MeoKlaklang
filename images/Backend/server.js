
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const userRoutes = require("./routes/user");

const app = express();
app.use(cors());
app.use(express.json()); 

// Connect to DB and start server
connectDB().then(() => {
  app.listen(5000, () => console.log("Backend running on port 5000"));
});

app.use("/api/users", userRoutes);
