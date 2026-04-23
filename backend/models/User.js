const mongoose = require("mongoose");

const userRoles = [
  "student",
  "trainer",
  "institution",
  "programme_manager",
  "monitoring_officer"
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false
    },
    role: {
      type: String,
      enum: userRoles,
      required: [true, "Role is required"]
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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

userSchema.pre("validate", function setInstitutionSelfReference(next) {
  if (this.role === "institution") {
    this.institutionId = this._id;
  }

  next();
});

userSchema.index({ role: 1 });
userSchema.index({ institutionId: 1 });

module.exports = mongoose.model("User", userSchema);
module.exports.userRoles = userRoles;
