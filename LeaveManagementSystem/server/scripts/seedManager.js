require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = (process.env.MANAGER_EMAIL || "manager@example.com").toLowerCase();
    const password = process.env.MANAGER_PASSWORD || "Manager@123";
    const name = process.env.MANAGER_NAME || "Organization Manager";
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { email },
      { name, email, password: hashed, role: "manager" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Manager account ready: ${email}`);
    console.log("Use the password configured in server/.env");
  } catch (error) {
    console.error("Manager setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
