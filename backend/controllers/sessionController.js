const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const BatchStudent = require("../models/BatchStudent");
const Session = require("../models/Session");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ensureTrainerOwnsBatch } = require("./batchController");

const createSession = asyncHandler(async (req, res) => {
  const { batchId, title, date, startTime, endTime } = req.body;
  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  await ensureTrainerOwnsBatch(req.user._id, batchId);

  const session = await Session.create({
    batchId,
    trainerId: req.user._id,
    title,
    date,
    startTime,
    endTime
  });

  res.status(201).json({
    status: "success",
    data: { session }
  });
});

// GET /api/sessions - Get sessions for the logged-in user (student/trainer)
const getSessions = asyncHandler(async (req, res) => {
  let sessions;

  if (req.user.role === "trainer") {
    sessions = await Session.find({ trainerId: req.user._id }).sort({ date: 1, startTime: 1 });
    return res.json({ sessions });
  }

  if (req.user.role === "student") {
    const batchLinks = await BatchStudent.find({ studentId: req.user._id });
    const batchIds = batchLinks.map((b) => b.batchId);
    const sessionDocs = await Session.find({ batchId: { $in: batchIds } })
      .populate("batchId", "name")
      .sort({ date: 1, startTime: 1 })
      .lean();
    const attendanceRows = await Attendance.find({
      studentId: req.user._id,
      sessionId: { $in: sessionDocs.map((session) => session._id) }
    }).lean();
    const attendanceBySession = new Map(
      attendanceRows.map((attendance) => [attendance.sessionId.toString(), attendance])
    );

    sessions = sessionDocs.map((session) => {
      const attendance = attendanceBySession.get(session._id.toString());

      return {
        ...session,
        attendanceStatus: attendance ? attendance.status : "not_marked",
        markedAt: attendance ? attendance.markedAt : null
      };
    });

    return res.json({ sessions });
  } else {
    sessions = [];
  }

  res.json({ sessions });
});

module.exports = {
  createSession,
  getSessions
};
