const mongoose = require("mongoose");

const batchStudentSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch id is required"]
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student id is required"]
    }
  },
  {
    versionKey: false
  }
);

batchStudentSchema.index({ batchId: 1, studentId: 1 }, { unique: true });
batchStudentSchema.index({ studentId: 1 });

module.exports = mongoose.model("BatchStudent", batchStudentSchema);
