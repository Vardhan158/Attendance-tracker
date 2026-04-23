const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const handleDuplicateKey = (error) => {
  const field = Object.keys(error.keyValue || {})[0] || "field";
  return new AppError(`${field} already exists`, 409);
};

const handleValidationError = (error) => {
  const message = Object.values(error.errors)
    .map((item) => item.message)
    .join(", ");
  return new AppError(message || "Validation failed", 400);
};

const errorHandler = (error, req, res, next) => {
  let err = error;

  if (error.name === "CastError") {
    err = new AppError("Invalid resource id", 400);
  }

  if (error.code === 11000) {
    err = handleDuplicateKey(error);
  }

  if (error.name === "ValidationError") {
    err = handleValidationError(error);
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    err = new AppError("Invalid or expired token", 401);
  }

  const statusCode = err.statusCode || 500;
  const response = {
    status: err.status || "error",
    message: err.isOperational ? err.message : "Internal server error"
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler
};
