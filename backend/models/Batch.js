const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Institution id is required"]
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

batchSchema.index({ institutionId: 1, name: 1 });

module.exports = mongoose.model("Batch", batchSchema);
