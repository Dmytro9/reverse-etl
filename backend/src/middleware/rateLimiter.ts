import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 * In production, use Redis or dedicated rate limiting service
 */
class RateLimiter {
  private store = new Map<string, RateLimitStore>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = this.getIdentifier(req);
      const now = Date.now();
      
      let record = this.store.get(identifier);

      // Reset if window expired
      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        this.store.set(identifier, record);
        return next();
      }

      // Increment count
      record.count++;

      // Check if exceeded
      if (record.count > this.maxRequests) {
        res.status(429).json({
          error: "Too many requests",
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
        return;
      }

      next();
    };
  }

  private getIdentifier(req: Request): string {
    // Use IP address as identifier
    // In production, consider using API keys or user IDs
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Different rate limits for different operations
export const generalRateLimiter = new RateLimiter(60000, 100); // 100 req/min
export const connectionRateLimiter = new RateLimiter(60000, 10); // 10 connections/min
