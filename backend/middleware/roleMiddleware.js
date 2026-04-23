const AppError = require("../utils/AppError");

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AppError("You are not authorized to access this resource", 403);
  }

  next();
};

module.exports = {
  authorizeRoles
};
