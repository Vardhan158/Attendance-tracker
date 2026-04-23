const express = require("express");
const { body, param, query } = require("express-validator");

const {
  createBatch,
  generateInvite,
  joinBatch,
  getBatches,
  getTrainers,
  getInstitutions,
  addBatchStudents,
  getBatchStudents
} = require("../controllers/batchController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorizeRoles("trainer", "institution"),
  [
    body("name").trim().notEmpty().withMessage("Batch name is required"),
    body("trainerId").optional({ nullable: true, checkFalsy: true }).isMongoId()
      .withMessage("Trainer id must be valid")
  ],
  validate,
  createBatch
);

router.post(
  "/:batchId/invite",
  authorizeRoles("trainer"),
  [param("batchId").isMongoId().withMessage("Batch id must be valid")],
  validate,
  generateInvite
);

router.post(
  "/:batchId/students",
  authorizeRoles("trainer"),
  [
    param("batchId").isMongoId().withMessage("Batch id must be valid"),
    body("emails").isArray({ min: 1 }).withMessage("At least one student email is required"),
    body("emails.*").isEmail().withMessage("Every student email must be valid").normalizeEmail()
  ],
  validate,
  addBatchStudents
);

router.get(
  "/:batchId/students",
  authorizeRoles("trainer"),
  [param("batchId").isMongoId().withMessage("Batch id must be valid")],
  validate,
  getBatchStudents
);

router.post(
  "/:batchId/join",
  authorizeRoles("student"),
  [
    param("batchId").isMongoId().withMessage("Batch id must be valid"),
    body("token").optional({ checkFalsy: true }).isJWT().withMessage("Invite token must be a JWT"),
    query("token").optional({ checkFalsy: true }).isJWT().withMessage("Invite token must be a JWT")
  ],
  validate,
  joinBatch
);

router.get(
  "/",
  authorizeRoles("institution", "trainer", "student"),
  getBatches
);

router.get(
  "/trainers",
  authorizeRoles("institution"),
  getTrainers
);

router.get(
  "/institutions",
  authorizeRoles("programme_manager"),
  getInstitutions
);

module.exports = router;
