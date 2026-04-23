const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session id is required"]
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student id is required"]
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: [true, "Attendance status is required"]
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
