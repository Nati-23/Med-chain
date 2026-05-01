import winston from "winston";
import { config } from "../config/index.js";

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.server.env === "production" ? "info" : "debug",
  defaultMeta: {
    service: "medchain-backend",
    environment: config.server.env,
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        config.server.env === "production" ? json() : devFormat
      ),
    }),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
});

// File logging is disabled for production cloud environments (like Vercel)
// to avoid read-only filesystem errors. Logs are sent to the console.

export { logger };
