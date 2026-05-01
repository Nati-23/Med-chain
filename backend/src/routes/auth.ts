import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate, authValidation } from "../middleware/validation.js";

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  "/register",
  validate(authValidation.register),
  authController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  authLimiter,
  validate(authValidation.login),
  authController.login
);

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticate, authController.getProfile);

/**
 * @route   POST /auth/link-wallet
 * @desc    Link wallet address to user
 * @access  Private
 */
router.post(
  "/link-wallet",
  authenticate,
  [body("walletAddress").isEthereumAddress().withMessage("Valid Ethereum address required")],
  authController.linkWallet
);

export default router;
