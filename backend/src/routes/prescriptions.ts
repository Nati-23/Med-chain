import { Router } from "express";
import * as prescriptionController from "../controllers/prescriptionController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { prescriptionLimiter, verifyLimiter } from "../middleware/rateLimiter.js";
import { validate, prescriptionValidation } from "../middleware/validation.js";

const router = Router();

/**
 * @route   POST /prescriptions
 * @desc    Create new prescription (Doctor only)
 * @access  Private (Doctor)
 */
router.post(
  "/",
  authenticate,
  authorize("doctor"),
  prescriptionLimiter,
  validate(prescriptionValidation.create),
  prescriptionController.createPrescription
);

/**
 * @route   GET /prescriptions
 * @desc    Get prescriptions (role-based)
 * @access  Private
 */
router.get("/", authenticate, prescriptionController.getPrescriptions);

/**
 * @route   GET /prescriptions/:id
 * @desc    Get single prescription by ID
 * @access  Private
 */
router.get("/:id", authenticate, prescriptionController.getPrescriptionById);

/**
 * @route   POST /prescriptions/:id/cancel
 * @desc    Cancel prescription (Doctor only, own prescriptions)
 * @access  Private (Doctor)
 */
router.post(
  "/:id/cancel",
  authenticate,
  authorize("doctor"),
  prescriptionController.cancelPrescription
);

/**
 * @route   POST /verify
 * @desc    Verify prescription via hash/CID
 * @access  Public
 */
router.post(
  "/verify",
  verifyLimiter,
  validate(prescriptionValidation.verify),
  prescriptionController.verifyPrescription
);

/**
 * @route   POST /dispense
 * @desc    Dispense prescription (Pharmacist only)
 * @access  Private (Pharmacist)
 */
router.post(
  "/dispense",
  authenticate,
  authorize("pharmacist"),
  validate(prescriptionValidation.dispense),
  prescriptionController.dispensePrescription
);

export default router;
