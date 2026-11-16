
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createOrUpdateUser({ name, email, password, role }) {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  console.log(`${role} account ready: ${normalizedEmail}`);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Employee Demo Account
    await createOrUpdateUser({
      name: "Demo Employee",
      email: process.env.EMPLOYEE_EMAIL || "employee.demo@gmail.com",
      password: process.env.EMPLOYEE_PASSWORD || "Employee@123",
      role: "employee"
    });

    // Manager Demo Account
    await createOrUpdateUser({
      name: process.env.MANAGER_NAME || "Organization Manager",
      email: process.env.MANAGER_EMAIL || "manager@example.com",
      password: process.env.MANAGER_PASSWORD || "Manager@123",
      role: "manager"
    });

    console.log("Both demo accounts are ready!");
  } catch (error) {
    console.error("Account setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
