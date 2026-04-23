const express = require("express");
const { body } = require("express-validator");

const { markAttendance } = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.post(
  "/mark",
  authorizeRoles("student"),
  [
    body("sessionId").isMongoId().withMessage("Session id must be valid"),
    body("status").isIn(["present", "absent", "late"]).withMessage("Invalid attendance status")
  ],
  validate,
  markAttendance
);

module.exports = router;
