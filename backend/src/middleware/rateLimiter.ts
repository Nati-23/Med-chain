import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    if (req.user) {
        logger.warn("Rate limit exceeded by authenticated user", {
          ip: req.ip,
          userId: req.user.id,
          role: req.user.role,
        });
    } else {
        logger.warn("Rate limit exceeded", {
          ip: req.ip,
          path: req.path,
          method: req.method,
        });
    }
    
    res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

/**
 * Stricter limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      email: req.body.email,
    });
    
    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
      retryAfter: 900,
    });
  },
});

/**
 * Prescription creation limiter (prevent spam)
 */
export const prescriptionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 prescriptions per minute per doctor
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip || "unknown",
  handler: (req, res) => {
    logger.warn("Prescription rate limit exceeded", {
      userId: req.user?.id,
      ip: req.ip,
    });
    
    res.status(429).json({
      error: "Prescription creation rate limit exceeded. Please slow down.",
      retryAfter: 60,
    });
  },
});

/**
 * Verification endpoint limiter (pharmacy scanning)
 */
export const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 verifications per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Verification rate limit exceeded. Please wait a moment.",
      retryAfter: 60,
    });
  },
});

/**
 * Admin action limiter
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 admin actions per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id?.toString() || req.ip || "unknown",
  handler: (req, res) => {
    logger.warn("Admin rate limit exceeded", {
      adminId: req.user?.id,
    });
    
    res.status(429).json({
      error: "Admin action rate limit exceeded",
      retryAfter: 60,
    });
  },
});
