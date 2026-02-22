import { Pool } from "pg";
import crypto from "crypto";
import { ConnectionError } from "../middleware/errorHandler";

interface StoredConnection {
  pool: Pool;
  createdAt: number;
}

class ConnectionService {
  private connections = new Map<string, StoredConnection>();
  private readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Periodically clean up stale connections
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60 * 1000);
  }

  async createConnection(connectionString: string): Promise<string> {
    const pool = new Pool({ connectionString, max: 5 });

    try {
      const client = await pool.connect();
      try {
        await client.query("SELECT 1");
      } finally {
        client.release();
      }
    } catch (error) {
      await pool.end();
      throw new ConnectionError(
        error instanceof Error
          ? `Failed to connect: ${error.message}`
          : "Failed to connect to database",
      );
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
