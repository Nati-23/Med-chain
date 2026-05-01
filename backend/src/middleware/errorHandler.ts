import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  
  // Log error
  logger.error("Error occurred", {
    error: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Mongoose validation error
  if (err.name === "ValidationError" && (err as unknown as { errors: Record<string, unknown> }).errors) {
    statusCode = 400;
    const validationErrors = Object.values((err as unknown as { errors: Record<string, { message: string }> }).errors).map(
      (e) => e.message
    );
    message = `Validation Error: ${validationErrors.join(", ")}`;
  }

  // Mongoose duplicate key error
  if (err.name === "MongoServerError" && (err as unknown as { code: number }).code === 11000) {
    statusCode = 409;
    const keyValue = (err as unknown as { keyValue: Record<string, string> }).keyValue;
    message = `Duplicate value: ${Object.keys(keyValue).join(", ")} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid identifier format`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }

  // Blockchain errors
  if (message.includes("insufficient funds")) {
    statusCode = 503;
    message = "Blockchain service temporarily unavailable. Please try again later.";
  }

  // IPFS errors
  if (message.includes("IPFS") || message.includes("Pinata")) {
    statusCode = 503;
  }

  // Send response
  const response: { error: string; stack?: string } = {
    error: message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Handle unhandled promise rejections
 */
export function unhandledRejectionHandler(reason: unknown, promise: Promise<unknown>): void {
  logger.error("Unhandled Rejection", { reason, promise });
  // Graceful shutdown in production
  if (process.env.NODE_ENV === "production") {
    setTimeout(() => process.exit(1), 1000);
  }
}

/**
 * Handle uncaught exceptions
 */
export function uncaughtExceptionHandler(error: Error): void {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  // Immediate shutdown
  process.exit(1);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
}
