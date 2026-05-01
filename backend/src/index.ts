import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { config, validateConfig } from "./config/index.js";
import { SupabaseService } from "./config/supabase.js";
import { logger } from "./utils/logger.js";
import { errorHandler, notFoundHandler, unhandledRejectionHandler, uncaughtExceptionHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

// Import routes
import authRoutes from "./routes/auth.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import adminRoutes from "./routes/admin.js";

// Load environment variables
dotenv.config();

// Validate configuration
validateConfig();

const app = express();

// Trust proxy for Vercel/Rate Limiting
app.set('trust proxy', 1);

// Enable CORS at the very top
app.use(cors({
  origin: true, // Reflects the request origin, very robust for Vercel
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Handle OPTIONS preflight
app.options("*", cors() as any);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request logging
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "medchain-ethiopia-backend",
    version: "1.0.0",
  });
});

// API routes
app.use("/auth", authRoutes);
app.use("/prescriptions", prescriptionRoutes);
app.use("/admin", adminRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "MedChain Ethiopia API",
    version: "1.0.0",
    description: "Blockchain-Based Prescription Verification System",
    documentation: "/health",
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    logger.info("Connecting to Supabase...");
    
    // Initialize Supabase service
    const supabaseService = SupabaseService.getInstance();
    
    // Test connection with health check
    const isHealthy = await supabaseService.healthCheck();
    
    if (isHealthy) {
      logger.info("Supabase connected successfully");
    } else {
      throw new Error("Supabase health check failed");
    }
  } catch (error) {
    logger.error("Failed to connect to Supabase", { error });
    throw error;
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`, {
        environment: config.server.env,
        port: config.server.port,
        apiUrl: config.server.apiUrl,
      });
      
      console.log(`\n🚀 MedChain Ethiopia Backend`);
      console.log(`   Environment: ${config.server.env}`);
      console.log(`   Port: ${config.server.port}`);
      console.log(`   Health Check: http://localhost:${config.server.port}/health\n`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("unhandledRejection", unhandledRejectionHandler);
process.on("uncaughtException", uncaughtExceptionHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server if not on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
