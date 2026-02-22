import { Pool } from "pg";
import { NotFoundError, ValidationError } from "../middleware/errorHandler";
import type { Column } from "../types";

class TableService {
  async listTables(pool: Pool): Promise<string[]> {
    const result = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );
    return result.rows.map((r) => r.table_name);
  }

  async validateTableExists(pool: Pool, tableName: string): Promise<void> {
    const result = await pool.query(
      `SELECT 1 
       FROM information_schema.tables
       WHERE table_schema = 'public' 
         AND table_type = 'BASE TABLE' 
         AND table_name = $1`,
      [tableName],
    );

    if (result.rowCount === 0) {
      throw new NotFoundError(`Table "${tableName}" not found`);
    }
  }

  async listColumns(pool: Pool, tableName: string): Promise<Column[]> {
    await this.validateTableExists(pool, tableName);

    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName],
    );

    return result.rows.map((r) => ({
      name: r.column_name,
      type: r.data_type,
    }));
  }

  async validateColumnsExist(
    pool: Pool,
    tableName: string,
    columnNames: string[],
  ): Promise<void> {
    const result = await pool.query(
      `SELECT column_name 
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName],
    );

    const validColumns = new Set(result.rows.map((r) => r.column_name));
    const invalidColumns = columnNames.filter((col) => !validColumns.has(col));

    if (invalidColumns.length > 0) {
      throw new ValidationError(
        `Unknown columns: ${invalidColumns.join(", ")}`,
      );
    }
  }

  sanitizeIdentifier(identifier: string): string {
    // PostgreSQL identifier validation
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new ValidationError(
        `Invalid identifier: "${identifier}". Must start with letter or underscore and contain only alphanumeric characters and underscores.`,
      );
    }
    return `"${identifier}"`;
  }
}

export const tableService = new TableService();
