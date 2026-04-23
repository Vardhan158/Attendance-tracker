const mongoose = require("mongoose");

const batchStudentInviteSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch id is required"]
    },
    email: {
      type: String,
      required: [true, "Student email is required"],
      lowercase: true,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator id is required"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

batchStudentInviteSchema.index({ batchId: 1, email: 1 }, { unique: true });
batchStudentInviteSchema.index({ email: 1 });

module.exports = mongoose.model("BatchStudentInvite", batchStudentInviteSchema);
