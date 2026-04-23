const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAuthToken } = require("../utils/jwt");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new AppError("Authentication token is required", 401);
  }

  const decoded = verifyAuthToken(token);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new AppError("User for this token no longer exists", 401);
  }

  req.user = user;
  next();
});

module.exports = {
  protect
};
