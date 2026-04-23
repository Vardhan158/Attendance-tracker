const Attendance = require("../models/Attendance");
const Batch = require("../models/Batch");
const BatchStudent = require("../models/BatchStudent");
const Session = require("../models/Session");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const isSameId = (left, right) => left && right && left.toString() === right.toString();

const attendedStatuses = ["present", "late"];

const percent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Number(((value / total) * 100).toFixed(2));
};

const assertInstitutionBatchAccess = (user, batch) => {
  if (user.role === "institution" && !isSameId(batch.institutionId, user._id)) {
    throw new AppError("Institution can only access its own batch data", 403);
  }
};

const buildBatchSummary = async (batch) => {
  const [sessions, memberships] = await Promise.all([
    Session.find({ batchId: batch._id }).lean(),
    BatchStudent.find({ batchId: batch._id }).populate("studentId", "name email").lean()
  ]);
  const sessionIds = sessions.map((session) => session._id);
  const attendance = await Attendance.find({ sessionId: { $in: sessionIds } }).lean();
  const attendanceByStudent = new Map();

  attendance.forEach((record) => {
    const studentKey = record.studentId.toString();
    const current = attendanceByStudent.get(studentKey) || {
      present: 0,
      absent: 0,
      late: 0,
      attended: 0
    };

    current[record.status] += 1;

    if (attendedStatuses.includes(record.status)) {
      current.attended += 1;
    }

    attendanceByStudent.set(studentKey, current);
  });

  const students = memberships.map((membership) => {
    const student = membership.studentId;
    const counts = attendanceByStudent.get(student._id.toString()) || {
      present: 0,
      absent: 0,
      late: 0,
      attended: 0
    };

    return {
      studentId: student._id,
      name: student.name,
      email: student.email,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      attendancePercentage: percent(counts.attended, sessions.length)
    };
  });

  const possibleMarks = sessions.length * memberships.length;
  const attendedMarks = attendance.filter((record) => attendedStatuses.includes(record.status)).length;

  return {
    batchId: batch._id,
    batchName: batch.name,
    institutionId: batch.institutionId,
    totalSessions: sessions.length,
    totalStudents: memberships.length,
    attendancePercentage: percent(attendedMarks, possibleMarks),
    students
  };
};

const getSessionAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await Session.findById(sessionId).populate("batchId", "name institutionId").lean();

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (req.user.role === "trainer" && !isSameId(session.trainerId, req.user._id)) {
    throw new AppError("Trainer can only view attendance for their sessions", 403);
  }

  const [memberships, attendance] = await Promise.all([
    BatchStudent.find({ batchId: session.batchId._id }).populate("studentId", "name email").lean(),
    Attendance.find({ sessionId }).lean()
  ]);
  const attendanceByStudent = new Map(
    attendance.map((record) => [record.studentId.toString(), record])
  );

  const students = memberships.map((membership) => {
    const student = membership.studentId;
    const record = attendanceByStudent.get(student._id.toString());

    return {
      studentId: student._id,
      name: student.name,
      email: student.email,
      status: record ? record.status : "not_marked",
      markedAt: record ? record.markedAt : null
    };
  });

  res.status(200).json({
    status: "success",
    data: {
      session: {
        id: session._id,
        batchId: session.batchId._id,
        batchName: session.batchId.name,
        trainerId: session.trainerId,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime
      },
      students
    }
  });
});

const getBatchSummary = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const batch = await Batch.findById(batchId).lean();

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  assertInstitutionBatchAccess(req.user, batch);

  const summary = await buildBatchSummary(batch);

  res.status(200).json({
    status: "success",
    data: { summary }
  });
});

const getInstitutionSummary = asyncHandler(async (req, res) => {
  const institutionId = req.params.institutionId === "me" ? req.user._id : req.params.institutionId;

  if (req.user.role === "institution" && !isSameId(req.user._id, institutionId)) {
    throw new AppError("Institution can only access its own summary", 403);
  }

  const institution = await User.findOne({ _id: institutionId, role: "institution" }).lean();

  if (!institution) {
    throw new AppError("Institution not found", 404);
  }

  const batches = await Batch.find({ institutionId }).lean();
  const batchSummaries = await Promise.all(batches.map(buildBatchSummary));
  const totalSessions = batchSummaries.reduce((sum, batch) => sum + batch.totalSessions, 0);
  const totalStudents = new Set();
  const memberships = await BatchStudent.find({
    batchId: { $in: batches.map((batch) => batch._id) }
  }).lean();

  memberships.forEach((membership) => totalStudents.add(membership.studentId.toString()));

  const possibleMarks = batchSummaries.reduce(
    (sum, batch) => sum + batch.totalSessions * batch.totalStudents,
    0
  );
  const attendedMarks = batchSummaries.reduce(
    (sum, batch) =>
      sum +
      batch.students.reduce(
        (studentSum, student) => studentSum + student.present + student.late,
        0
      ),
    0
  );

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        institutionId: institution._id,
        institutionName: institution.name,
        totalBatches: batches.length,
        totalStudents: totalStudents.size,
        totalSessions,
        attendancePercentage: percent(attendedMarks, possibleMarks),
        batches: batchSummaries
      }
    }
  });
});

const getProgrammeSummary = asyncHandler(async (req, res) => {
  const [institutions, batches, students, trainers, sessions, attendance] = await Promise.all([
    User.countDocuments({ role: "institution" }),
    Batch.find({}).lean(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "trainer" }),
    Session.countDocuments({}),
    Attendance.find({}).lean()
  ]);
  const memberships = await BatchStudent.find({}).lean();
  const membershipsByBatch = new Map();
  const sessionsByBatch = new Map();

  memberships.forEach((membership) => {
    const key = membership.batchId.toString();
    membershipsByBatch.set(key, (membershipsByBatch.get(key) || 0) + 1);
  });

  const sessionRows = await Session.find({}).select("batchId").lean();
  sessionRows.forEach((session) => {
    const key = session.batchId.toString();
    sessionsByBatch.set(key, (sessionsByBatch.get(key) || 0) + 1);
  });

  const possibleMarks = batches.reduce((sum, batch) => {
    const key = batch._id.toString();
    return sum + (membershipsByBatch.get(key) || 0) * (sessionsByBatch.get(key) || 0);
  }, 0);
  const statusCounts = attendance.reduce(
    (counts, record) => {
      counts[record.status] += 1;
      return counts;
    },
    { present: 0, absent: 0, late: 0 }
  );
  const attendedMarks = statusCounts.present + statusCounts.late;

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalInstitutions: institutions,
        totalBatches: batches.length,
        totalStudents: students,
        totalTrainers: trainers,
        totalSessions: sessions,
        totalAttendanceRecords: attendance.length,
        attendancePercentage: percent(attendedMarks, possibleMarks),
        statusCounts
      }
    }
  });
});

module.exports = {
  getSessionAttendance,
  getBatchSummary,
  getInstitutionSummary,
  getProgrammeSummary
};
