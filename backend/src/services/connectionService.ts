import { Pool, PoolConfig } from "pg";
import crypto from "crypto";
import { ConnectionError, ValidationError } from "../middleware/errorHandler";
import { securityService } from "./securityService";

interface StoredConnection {
  pool: Pool;
  createdAt: number;
}

class ConnectionService {
  private connections = new Map<string, StoredConnection>();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CONNECTIONS = 100; // Maximum stored connection pools

  constructor() {
    // Periodically clean up stale connections
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60 * 1000);
  }

  async createConnection(connectionString: string): Promise<string> {
    // Validate for SSRF attacks
    if (!securityService.shouldBypassSSRFCheck()) {
      securityService.validateConnectionString(connectionString);
    }

    // Check if we've hit max connections limit
    if (this.connections.size >= this.MAX_CONNECTIONS) {
      throw new ValidationError(
        "Maximum number of concurrent connections reached. Please try again later."
      );
    }

    // Configure pool with security timeouts
    const poolConfig: PoolConfig = {
      connectionString,
      max: 5, // Max 5 clients per pool
      idleTimeoutMillis: 30000, // Close idle clients after 30s
      connectionTimeoutMillis: 10000, // Timeout connection attempts after 10s
      statement_timeout: 30000, // Kill queries after 30s
      query_timeout: 30000, // Query timeout
    };

    const pool = new Pool(poolConfig);

    try {
      const client = await pool.connect();
      try {
        // Test connection with timeout
        await client.query("SELECT 1");
      } finally {
        client.release();
      }
    } catch (error) {
      await pool.end();
      
      // Sanitize error message to prevent information leakage
      const message = error instanceof Error ? error.message : "Unknown error";
      
      // Don't leak internal details in production
      if (process.env.NODE_ENV === "production") {
        throw new ConnectionError(
          "Failed to connect to database. Please verify your connection string."
        );
      }
      
      throw new ConnectionError(`Failed to connect: ${message}`);
    }

    const id = crypto.randomUUID();
    this.connections.set(id, { pool, createdAt: Date.now() });
    return id;
  }

  getPool(connectionId: string): Pool {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new ConnectionError(
        "Connection not found or expired. Please reconnect.",
      );
    }
    return conn.pool;
  }

  /**
   * Gracefully close all connection pools
   * Called during application shutdown
   */
  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    for (const [id, conn] of this.connections) {
      closePromises.push(
        conn.pool.end().catch((err) => {
          console.error(`Failed to close connection ${id}:`, err);
        })
      );
    }
    
    await Promise.allSettled(closePromises);
    this.connections.clear();
  }

  /**
   * Get count of active connections (for monitoring)
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    for (const [id, conn] of this.connections) {
      if (now - conn.createdAt > this.TTL_MS) {
        conn.pool.end().catch(() => {});
        this.connections.delete(id);
      }
    }
  }
}

export const connectionService = new ConnectionService();
