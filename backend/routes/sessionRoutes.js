const express = require("express");
const { body } = require("express-validator");

const { createSession, getSessions } = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("trainer"),
  [
    body("batchId").isMongoId().withMessage("Batch id must be valid"),
    body("title").trim().notEmpty().withMessage("Session title is required"),
    body("date").isISO8601().withMessage("Session date must be a valid ISO date"),
    body("startTime")
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("Start time must be HH:mm"),
    body("endTime")
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("End time must be HH:mm")
      .custom((endTime, { req }) => endTime > req.body.startTime)
      .withMessage("End time must be after start time")
  ],
  validate,
  createSession
);

router.get(
  "/",
  authorizeRoles("trainer", "student"),
  getSessions
);

module.exports = router;
