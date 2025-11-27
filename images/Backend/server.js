const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const userRoutes = require("./routes/user");
const entryRoutes = require("./routes/entries"); 

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/entries", entryRoutes);

connectDB().then(() => {
  app.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));
});
