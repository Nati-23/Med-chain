import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { User, IUser, UserRole } from "../models/User.js";
import { logger } from "../utils/logger.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * JWT Authentication Middleware
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    // Check if user exists and is approved
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!user.approved && user.role !== "admin") {
      res.status(403).json({ error: "Account pending approval" });
      return;
    }

    // Remove password before attaching to request (good practice)
    const { password, ...userWithoutPassword } = user;
    
    // Attach user to request
    req.user = userWithoutPassword as IUser;
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    
    logger.error("Authentication error", { error });
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Role-based Authorization Middleware Factory
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Unauthorized access attempt", {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      res.status(403).json({ 
        error: "Access denied. Insufficient permissions.",
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Optional Authentication (for public endpoints that benefit from user context)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    
    const user = await User.findById(decoded.userId);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword as IUser;
      req.token = token;
    }

    next();
  } catch {
    // Continue without user - this is optional auth
    next();
  }
}

/**
 * Admin-only middleware
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

/**
 * Doctor-only middleware
 */
export function doctorOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "doctor") {
    res.status(403).json({ error: "Doctor access required" });
    return;
  }
  next();
}

/**
 * Pharmacist-only middleware
 */
export function pharmacistOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "pharmacist") {
    res.status(403).json({ error: "Pharmacist access required" });
    return;
  }
  next();
}
