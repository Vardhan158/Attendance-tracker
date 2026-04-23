const Attendance = require("../models/Attendance");
const BatchStudent = require("../models/BatchStudent");
const Session = require("../models/Session");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const markAttendance = asyncHandler(async (req, res) => {
  const { sessionId, status } = req.body;
  const session = await Session.findById(sessionId);

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const membership = await BatchStudent.findOne({
    batchId: session.batchId,
    studentId: req.user._id
  });

  if (!membership) {
    throw new AppError("Student can only mark attendance for sessions in their batch", 403);
  }

  const attendance = await Attendance.findOneAndUpdate(
    { sessionId, studentId: req.user._id },
    { status, markedAt: new Date() },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    status: "success",
    data: { attendance }
  });
});

module.exports = {
  markAttendance
};
