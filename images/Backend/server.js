const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db");
const { initializeAnalytics } = require("./models/AnalyticsEvent");

const userRoutes = require("./routes/user");
const entryRoutes = require("./routes/entries");
const dogsRoutes = require("./routes/dogs");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");
const sessionsRoutes = require("./routes/sessions");

const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();

// ✅ middleware FIRST
app.use(cookieParser());

app.use(
  session({
    secret: process.env.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/dogs", dogsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sessions", sessionsRoutes);

// Create admin user endpoint
const { createAdminUser } = require("./models/User");
app.post("/api/create-admin", async (req, res) => {
  try {
    const adminUser = await createAdminUser("admin", "admin123");
    res.json({ success: true, message: "Admin user created successfully", user: adminUser });
  } catch (err) {
    console.error("❌ Error creating admin user:", err);
    res.status(500).json({ error: "Error creating admin user" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start
connectDB()
  .then(async () => {
    await initializeAnalytics();
    app.listen(5005, () => console.log("✅ Backend running on http://localhost:5005"));
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
