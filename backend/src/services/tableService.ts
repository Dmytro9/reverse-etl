import { Pool } from "pg";
import { NotFoundError, ValidationError } from "../middleware/errorHandler";
import type { Column } from "../types";

class TableService {
  // PostgreSQL reserved keywords that cannot be used as unquoted identifiers
  private readonly RESERVED_KEYWORDS = new Set([
    "all", "analyse", "analyze", "and", "any", "array", "as", "asc", "asymmetric",
    "both", "case", "cast", "check", "collate", "column", "constraint", "create",
    "current_catalog", "current_date", "current_role", "current_time",
    "current_timestamp", "current_user", "default", "deferrable", "desc",
    "distinct", "do", "else", "end", "except", "false", "fetch", "for",
    "foreign", "from", "grant", "group", "having", "in", "initially", "intersect",
    "into", "lateral", "leading", "limit", "localtime", "localtimestamp", "not",
    "null", "offset", "on", "only", "or", "order", "placing", "primary",
    "references", "returning", "select", "session_user", "some", "symmetric",
    "table", "then", "to", "trailing", "true", "union", "unique", "user",
    "using", "variadic", "when", "where", "window", "with",
  ]);

  private readonly MAX_IDENTIFIER_LENGTH = 63; // PostgreSQL limit

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

    // Check length limit
    if (identifier.length > this.MAX_IDENTIFIER_LENGTH) {
      throw new ValidationError(
        `Identifier "${identifier}" exceeds PostgreSQL's maximum length of ${this.MAX_IDENTIFIER_LENGTH} characters.`,
      );
    }

    // Check if it's a reserved keyword
    if (this.RESERVED_KEYWORDS.has(identifier.toLowerCase())) {
      // Reserved keywords must be quoted
      return `"${identifier}"`;
    }

    // Quote all identifiers for safety (prevents case sensitivity issues)
    return `"${identifier}"`;
  }
}

export const tableService = new TableService();
