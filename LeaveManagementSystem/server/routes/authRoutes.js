
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Generate JWT token
function makeToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Return public user details
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    casualLeaveQuota: user.casualLeaveQuota,
    medicalLeaveQuota: user.medicalLeaveQuota
  };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "employee"
    });

    return res.status(201).json({
      token: makeToken(user),
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and login type are required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (
      !user ||
      user.role !== role ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: "Invalid email, password or login type"
      });
    }

    return res.json({
      token: makeToken(user),
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

// GET LOGGED-IN USER
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.json({
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      message: "Unable to fetch user",
      error: error.message
    });
  }
});

module.exports = router;
