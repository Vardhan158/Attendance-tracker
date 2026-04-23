const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return process.env.JWT_SECRET;
};

const getTokenInstitutionId = (user) => {
  if (user.role === "institution") {
    return user._id.toString();
  }

  return user.institutionId ? user.institutionId.toString() : null;
};

const signAuthToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      institutionId: getTokenInstitutionId(user)
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const verifyAuthToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = {
  signAuthToken,
  verifyAuthToken
};
