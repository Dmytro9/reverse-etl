import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import connectionsRouter from "./routes/connections";
import { errorHandler } from "./middleware/errorHandler";
import { generalRateLimiter } from "./middleware/rateLimiter";
import { connectionService } from "./services/connectionService";
import { logger } from "./services/logger";
import { Pool } from "pg";

const app = express();
const PORT = process.env.PORT || 3001;

// Track server instance for graceful shutdown
let server: ReturnType<typeof app.listen> | null = null;

// CORS configuration
if (process.env.NODE_ENV === "production") {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
} else {
  app.use(cors());
}

// Body parser
app.use(express.json());

// Request logging with correlation ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = logger.generateCorrelationId();
  req.headers["x-correlation-id"] = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  logger.info("Incoming request", {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  next();
});

// Rate limiting
app.use(generalRateLimiter.middleware());

// Routes
app.use("/api/connections", connectionsRouter);

// Health check endpoint - verifies DB connectivity
app.get("/health", async (req, res) => {
  const correlationId = req.headers["x-correlation-id"] as string;
  
  try {
    // Basic health
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      activeConnections: connectionService.getConnectionCount(),
    };

    // Optional: Deep health check with ?deep=true
    if (req.query.deep === "true") {
      // Test a connection if available (for monitoring)
      // In production, you might have a dedicated health check DB connection
      logger.debug("Deep health check requested", { correlationId });
    }

    res.json(health);
  } catch (error) {
    logger.error("Health check failed", error instanceof Error ? error : undefined, {
      correlationId,
    });
    
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
function startServer(): void {
  server = app.listen(PORT, () => {
    logger.info(`Backend server started`, {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
    });
  });
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown`);

  if (server) {
    // Stop accepting new connections
    server.close(() => {
      logger.info("HTTP server closed");
    });
  }

  try {
    // Close all database connection pools
    await connectionService.closeAll();
    logger.info("All database connections closed");

    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught exception", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled rejection", reason instanceof Error ? reason : new Error(String(reason)));
  gracefulShutdown("unhandledRejection");
});

// Start the server
startServer();
