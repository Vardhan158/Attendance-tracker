const jwt = require("jsonwebtoken");

const Batch = require("../models/Batch");
const BatchTrainer = require("../models/BatchTrainer");
const BatchStudent = require("../models/BatchStudent");
const BatchStudentInvite = require("../models/BatchStudentInvite");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const inviteSecret = () => {
  if (!process.env.INVITE_JWT_SECRET) {
    throw new Error("INVITE_JWT_SECRET is required");
  }
  return process.env.INVITE_JWT_SECRET;
};

const ensureTrainerOwnsBatch = async (trainerId, batchId) => {
  const assignment = await BatchTrainer.findOne({ trainerId, batchId });

  if (!assignment) {
    throw new AppError("Trainer is not assigned to this batch", 403);
  }

  return assignment;
};

const createBatch = asyncHandler(async (req, res) => {
  const { name, trainerId } = req.body;
  let institutionId = null;

  if (req.user.role === "institution") {
    institutionId = req.user._id;
  }

  if (req.user.role === "trainer") {
    institutionId = req.user.institutionId || req.user._id;
  }

  let trainer = null;
  if (req.user.role === "institution" && trainerId) {
    trainer = await User.findOne({
      _id: trainerId,
      role: "trainer",
      institutionId: req.user._id
    });

    if (!trainer) {
      throw new AppError("Trainer must belong to this institution", 400);
    }
  }

  const batch = await Batch.create({ name, institutionId });

  if (req.user.role === "trainer") {
    await BatchTrainer.create({ batchId: batch._id, trainerId: req.user._id });
  }

  if (trainer) {
    await BatchTrainer.create({ batchId: batch._id, trainerId });
  }

  res.status(201).json({
    status: "success",
    data: { batch }
  });
});

const generateInvite = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  await ensureTrainerOwnsBatch(req.user._id, batchId);

  const token = jwt.sign(
    {
      purpose: "batch_invite",
      batchId: batch._id.toString(),
      trainerId: req.user._id.toString()
    },
    inviteSecret(),
    { expiresIn: process.env.INVITE_EXPIRES_IN || "7d" }
  );
  const baseUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
  const inviteLink = `${baseUrl.replace(/\/$/, "")}/join-batch/${batch._id}?token=${token}`;

  res.status(201).json({
    status: "success",
    data: {
      batchId: batch._id,
      token,
      inviteLink
    }
  });
});

const joinBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const token = req.body.token || req.query.token;

  if (!token) {
    throw new AppError("Invite token is required", 400);
  }

  const decoded = jwt.verify(token, inviteSecret());

  if (decoded.purpose !== "batch_invite" || decoded.batchId !== batchId) {
    throw new AppError("Invite token is not valid for this batch", 400);
  }

  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  if (req.user.institutionId && !req.user.institutionId.equals(batch.institutionId)) {
    throw new AppError("Student cannot join a batch from another institution", 403);
  }

  const allowedStudent = await BatchStudentInvite.findOne({
    batchId,
    email: req.user.email.toLowerCase()
  });

  if (!allowedStudent) {
    throw new AppError("This invite link is not assigned to your student email", 403);
  }

  const membership = await BatchStudent.findOneAndUpdate(
    { batchId, studentId: req.user._id },
    { $setOnInsert: { batchId, studentId: req.user._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!req.user.institutionId) {
    await User.findByIdAndUpdate(req.user._id, { institutionId: batch.institutionId });
  }

  res.status(200).json({
    status: "success",
    data: { membership }
  });
});

const addBatchStudents = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { emails } = req.body;
  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  await ensureTrainerOwnsBatch(req.user._id, batchId);

  const uniqueEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()))];
  const operations = uniqueEmails.map((email) => ({
    updateOne: {
      filter: { batchId, email },
      update: { $setOnInsert: { batchId, email, createdBy: req.user._id } },
      upsert: true
    }
  }));

  if (operations.length) {
    await BatchStudentInvite.bulkWrite(operations);
  }

  const assignedStudents = await BatchStudentInvite.find({ batchId }).sort({ email: 1 });

  res.status(200).json({
    status: "success",
    data: { assignedStudents }
  });
});

const getBatchStudents = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  await ensureTrainerOwnsBatch(req.user._id, batchId);

  const assignedStudents = await BatchStudentInvite.find({ batchId }).sort({ email: 1 });

  res.status(200).json({
    status: "success",
    data: { assignedStudents }
  });
});

// GET /api/batches - Get all batches for the institution
const getBatches = asyncHandler(async (req, res) => {
  let batches = [];
  if (req.user.role === "institution") {
    batches = await Batch.find({ institutionId: req.user._id });
  } else if (req.user.role === "trainer") {
    const BatchTrainer = require("../models/BatchTrainer");
    const batchLinks = await BatchTrainer.find({ trainerId: req.user._id });
    const batchIds = batchLinks.map((b) => b.batchId);
    batches = await Batch.find({ _id: { $in: batchIds } });
  } else if (req.user.role === "student") {
    const batchLinks = await BatchStudent.find({ studentId: req.user._id });
    const batchIds = batchLinks.map((b) => b.batchId);
    batches = await Batch.find({ _id: { $in: batchIds } });
  }
  res.json({ batches });
});

// GET /api/batches/trainers - Get all trainers for the institution
const getTrainers = asyncHandler(async (req, res) => {
  let trainers = [];
  if (req.user.role === "institution") {
    const User = require("../models/User");
    trainers = await User.find({ institutionId: req.user._id, role: "trainer" });
  }
  res.json({ trainers });
});

// GET /api/institutions - Get all institutions (for manager)
const getInstitutions = asyncHandler(async (req, res) => {
  const User = require("../models/User");
  const institutions = await User.find({ role: "institution" });
  res.json({ institutions });
});

module.exports = {
  createBatch,
  generateInvite,
  joinBatch,
  getBatches,
  getTrainers,
  getInstitutions,
  addBatchStudents,
  getBatchStudents,
  ensureTrainerOwnsBatch
};
