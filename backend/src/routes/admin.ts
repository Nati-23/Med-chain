import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticate, adminOnly } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/rateLimiter.js";
import { validate, userValidation } from "../middleware/validation.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);
router.use(adminLimiter);

/**
 * @route   GET /admin/users/pending
 * @desc    Get pending doctors/pharmacists awaiting approval
 * @access  Private (Admin)
 */
router.get("/users/pending", adminController.getPendingUsers);

/**
 * @route   POST /admin/users/approve
 * @desc    Approve or reject user
 * @access  Private (Admin)
 */
router.post(
  "/users/approve",
  validate(userValidation.approve),
  adminController.approveUser
);

/**
 * @route   GET /admin/users
 * @desc    Get all users with filtering
 * @access  Private (Admin)
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route   POST /admin/users/:id/revoke
 * @desc    Revoke user access
 * @access  Private (Admin)
 */
router.post("/users/:id/revoke", adminController.revokeUser);

/**
 * @route   GET /admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get("/stats", adminController.getStats);

export default router;
