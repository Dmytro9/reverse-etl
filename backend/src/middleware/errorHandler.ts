import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../services/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: string[],
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string[]) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ConnectionError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = "ConnectionError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const correlationId = req.headers["x-correlation-id"] as string;

  // Log error with structured logging
  logger.error("Request error", err, {
    correlationId,
    path: req.path,
    method: req.method,
    statusCode: err instanceof AppError ? err.statusCode : 500,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
      correlationId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
      correlationId,
    });
    return;
  }

  // Don't leak error details in production
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
    correlationId,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
