const mongoose = require("mongoose");

const batchTrainerSchema = new mongoose.Schema(
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
    }
  },
  {
    versionKey: false
  }
);

batchTrainerSchema.index({ batchId: 1, trainerId: 1 }, { unique: true });
batchTrainerSchema.index({ trainerId: 1 });

module.exports = mongoose.model("BatchTrainer", batchTrainerSchema);
