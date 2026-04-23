const express = require("express");
const { body } = require("express-validator");

const { signup, login, getInstitutionOptions } = require("../controllers/authController");
const validate = require("../middleware/validate");
const { userRoles } = require("../models/User");

const router = express.Router();

router.get("/institutions", getInstitutionOptions);

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role").isIn(userRoles).withMessage("Invalid role"),
    body("institutionId").optional({ nullable: true, checkFalsy: true }).isMongoId()
      .withMessage("Institution id must be valid")
  ],
  validate,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  login
);

module.exports = router;
