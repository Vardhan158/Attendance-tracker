const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { signAuthToken } = require("../utils/jwt");

const getUserInstitutionId = (user) => {
  if (user.role === "institution") {
    return user._id.toString();
  }

  return user.institutionId ? user.institutionId.toString() : null;
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  institutionId: getUserInstitutionId(user),
  createdAt: user.createdAt
});

const getInstitutionOptions = asyncHandler(async (_req, res) => {
  const institutions = await User.find({ role: "institution" })
    .select("_id name email")
    .sort({ name: 1 })
    .lean();

  res.status(200).json({
    status: "success",
    institutions
  });
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, institutionId } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  if (role === "institution" && institutionId) {
    throw new AppError("Institution users cannot be assigned to another institution", 400);
  }

  if (role !== "institution" && institutionId) {
    const institution = await User.findOne({ _id: institutionId, role: "institution" });

    if (!institution) {
      throw new AppError("Institution id must belong to an institution user", 400);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = new mongoose.Types.ObjectId();
  const savedInstitutionId = role === "institution" ? userId : institutionId || null;
  const user = await User.create({
    _id: userId,
    name,
    email,
    password: hashedPassword,
    role,
    institutionId: savedInstitutionId
  });

  const token = signAuthToken(user);

  res.status(201).json({
    status: "success",
    token,
    user: sanitizeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.role === "institution" && !user.institutionId) {
    user.institutionId = user._id;
    await user.save();
  }

  const token = signAuthToken(user);

  res.status(200).json({
    status: "success",
    token,
    user: sanitizeUser(user)
  });
});

module.exports = {
  signup,
  login,
  getInstitutionOptions
};
