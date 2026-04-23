const express = require("express");
const { param } = require("express-validator");

const {
  getSessionAttendance,
  getBatchSummary,
  getInstitutionSummary,
  getProgrammeSummary
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get(
  "/sessions/:sessionId/attendance",
  authorizeRoles("trainer", "programme_manager", "monitoring_officer"),
  [param("sessionId").isMongoId().withMessage("Session id must be valid")],
  validate,
  getSessionAttendance
);

router.get(
  "/batches/:batchId/summary",
  authorizeRoles("institution", "programme_manager", "monitoring_officer"),
  [param("batchId").isMongoId().withMessage("Batch id must be valid")],
  validate,
  getBatchSummary
);

router.get(
  "/institutions/:institutionId/summary",
  authorizeRoles("institution", "programme_manager", "monitoring_officer"),
  [
    param("institutionId")
      .custom((value) => value === "me" || /^[0-9a-fA-F]{24}$/.test(value))
      .withMessage("Institution id must be valid")
  ],
  validate,
  getInstitutionSummary
);

router.get(
  "/programme/summary",
  authorizeRoles("programme_manager", "monitoring_officer"),
  getProgrammeSummary
);

module.exports = router;
