import crypto from "crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
  correlationId?: string;
}

/**
 * Structured logger for production-ready logging
 * In production, this would integrate with logging services like DataDog, CloudWatch, etc.
 */
class Logger {
  private context: LogContext = {};

  /**
   * Set global context for all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Generate correlation ID for request tracing
   */
  generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
          },
        }
      : {};

    this.log("error", message, { ...context, ...errorContext });
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...context,
    };

    // In development, pretty print
    if (process.env.NODE_ENV === "development") {
      const emoji = this.getEmoji(level);
      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, context || "");
    } else {
      // In production, output JSON for log aggregation
      console.log(JSON.stringify(logEntry));
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "🔍";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "❌";
    }
  }
}

export const logger = new Logger();
