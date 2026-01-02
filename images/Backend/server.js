const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const { initializeAnalytics } = require("./models/AnalyticsEvent");
const userRoutes = require("./routes/user");
const entryRoutes = require("./routes/entries"); 
const dogsRoutes = require("./routes/dogs");
const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// Session middleware for admin
const session = require('express-session');
app.use(session({
  secret: process.env.ADMIN_SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/dogs", dogsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

// Regular users route for admin creation
const createAdminUser = require("./models/User").createAdminUser;

app.post("/api/create-admin", async (req, res) => {
  try {
    const adminUser = await createAdminUser("admin", "admin123");
    res.json({ 
      success: true, 
      message: "Admin user created successfully",
      user: adminUser
    });
  } catch (err) {
    console.error("❌ Error creating admin user:", err);
    res.status(500).json({ error: "Error creating admin user" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

connectDB().then(async () => {
  await initializeAnalytics();
  app.listen(5005, () => console.log("✅ Backend running on http://localhost:5005"));
});
