const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch id is required"]
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Trainer id is required"]
    },
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true
    },
    date: {
      type: Date,
      required: [true, "Session date is required"]
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be HH:mm"]
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be HH:mm"]
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

sessionSchema.index({ batchId: 1, date: 1 });
sessionSchema.index({ trainerId: 1 });

module.exports = mongoose.model("Session", sessionSchema);
