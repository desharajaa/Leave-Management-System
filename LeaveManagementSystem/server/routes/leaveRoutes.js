const express = require("express");
const Leave = require("../models/Leave");
const { protect, managerOnly } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

function dateOnly(value) {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function calculateDays(start, end) {
  return Math.floor((dateOnly(end) - dateOnly(start)) / 86400000) + 1;
}

async function getBalance(userId, user) {
  const approved = await Leave.find({ employee: userId, status: "Approved" });
  const usedCasual = approved.filter(x => x.leaveType === "Casual Leave").reduce((sum, x) => sum + x.days, 0);
  const usedMedical = approved.filter(x => x.leaveType === "Medical Leave").reduce((sum, x) => sum + x.days, 0);
  return {
    casual: { total: user.casualLeaveQuota, used: usedCasual, available: Math.max(0, user.casualLeaveQuota - usedCasual) },
    medical: { total: user.medicalLeaveQuota, used: usedMedical, available: Math.max(0, user.medicalLeaveQuota - usedMedical) }
  };
}

router.get("/balance", async (req, res) => {
  if (req.user.role !== "employee") return res.status(403).json({ message: "Employee access only" });
  res.json(await getBalance(req.user._id, req.user));
});

router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ message: "Only employees can apply for leave" });
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!["Casual Leave", "Medical Leave"].includes(leaveType) || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({ message: "Please complete all leave request fields" });
    }
    const start = dateOnly(startDate);
    const end = dateOnly(endDate);
    const today = dateOnly(new Date());
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ message: "Please select valid leave dates" });
    }
    if (start < today) return res.status(400).json({ message: "Leave start date cannot be in the past" });

    const days = calculateDays(startDate, endDate);
    const balance = await getBalance(req.user._id, req.user);
    const remaining = leaveType === "Casual Leave" ? balance.casual.available : balance.medical.available;
    if (days > remaining) return res.status(400).json({ message: `Not enough ${leaveType} balance. Available: ${remaining} day(s)` });

    const overlapping = await Leave.findOne({
      employee: req.user._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });
    if (overlapping) return res.status(409).json({ message: "You already have a pending or approved leave for overlapping dates" });

    const leave = await Leave.create({ employee: req.user._id, leaveType, startDate: start, endDate: end, days, reason: reason.trim() });
    res.status(201).json({ message: "Leave request submitted successfully", leave });
  } catch {
    res.status(500).json({ message: "Could not submit leave request" });
  }
});

router.get("/mine", async (req, res) => {
  if (req.user.role !== "employee") return res.status(403).json({ message: "Employee access only" });
  const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
  res.json(leaves);
});

router.get("/all", managerOnly, async (req, res) => {
  const filter = {};
  if (["Pending", "Approved", "Rejected"].includes(req.query.status)) filter.status = req.query.status;
  const leaves = await Leave.find(filter).populate("employee", "name email").sort({ createdAt: -1 });
  res.json(leaves);
});

router.patch("/:id/review", managerOnly, async (req, res) => {
  try {
    const { status, managerComment } = req.body;
    if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ message: "Choose Approved or Rejected" });
    if (status === "Rejected" && !managerComment?.trim()) return res.status(400).json({ message: "A rejection reason is required" });

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    if (leave.status !== "Pending") return res.status(409).json({ message: "This request has already been reviewed" });

    if (status === "Approved") {
      const employee = await require("../models/User").findById(leave.employee);
      const balance = await getBalance(employee._id, employee);
      const available = leave.leaveType === "Casual Leave" ? balance.casual.available : balance.medical.available;
      if (leave.days > available) return res.status(400).json({ message: "Insufficient balance now; employee must submit a new request" });
    }

    leave.status = status;
    leave.managerComment = (managerComment || "").trim();
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();
    const updated = await Leave.findById(leave._id).populate("employee", "name email");
    res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave: updated });
  } catch {
    res.status(500).json({ message: "Could not review leave request" });
  }
});

module.exports = router;
