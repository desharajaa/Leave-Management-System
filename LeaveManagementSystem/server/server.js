
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Allowed frontend URLs
const allowedOrigins = [
  "http://localhost:5173",
  "https://leave-management-system-jb5xj9jrl-desharajaa.vercel.app",
  "https://leave-management-system-ashen-six.vercel.app",
  "https://leave-management-system-fpznk14gd-desharajaa.vercel.app"
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked origin: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Leave Management API is running"
  });
});

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Leave routes
app.use("/api/leaves", require("./routes/leaveRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found"
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });
