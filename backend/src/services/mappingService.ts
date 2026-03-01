import { Pool } from "pg";
import { ValidationError } from "../middleware/errorHandler";
import type { MappingEntry } from "../types";
import { tableService } from "./tableService";

class MappingService {
  validateMapping(mapping: MappingEntry[]): void {
    const errors: string[] = [];
    const paths = mapping.map((m) => m.targetPath.trim());

    // Validate each mapping entry
    for (let i = 0; i < mapping.length; i++) {
      const { sourceColumn, targetPath } = mapping[i];

      if (!sourceColumn) {
        errors.push(`Row ${i + 1}: source column is required`);
      }

      if (!targetPath || !targetPath.trim()) {
        errors.push(`Row ${i + 1}: target path is required`);
        continue;
      }

      // Validate path segments
      const segments = targetPath.trim().split(".");
      for (const seg of segments) {
        if (!seg || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(seg)) {
          errors.push(
            `Row ${i + 1}: "${targetPath}" contains invalid segment "${seg}". Use alphanumeric/underscore only`,
          );
          break;
        }
      }
    }

    // Check for duplicate paths
    const seen = new Set<string>();
    for (const p of paths) {
      const normalized = p.trim();
      if (!normalized) continue;
      if (seen.has(normalized)) {
        errors.push(`Duplicate target path: "${normalized}"`);
      }
      seen.add(normalized);
    }

    // Check for path collisions (one path is a prefix of another)
    const sorted = [...seen].sort();
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].startsWith(sorted[i] + ".")) {
        errors.push(
          `Path collision: "${sorted[i]}" conflicts with "${sorted[i + 1]}". A path cannot be both a value and a parent object`,
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Invalid mapping", errors);
    }
  }

  async fetchAndTransformData(
    pool: Pool,
    tableName: string,
    limit: number,
    mapping: MappingEntry[],
  ): Promise<Record<string, unknown>[]> {
    this.validateMapping(mapping);

    await tableService.validateTableExists(pool, tableName);

    const sourceColumns = [...new Set(mapping.map((m) => m.sourceColumn))];

    await tableService.validateColumnsExist(pool, tableName, sourceColumns);

    // Build query with sanitized identifiers
    const quotedColumns = sourceColumns
      .map((col) => tableService.sanitizeIdentifier(col))
      .join(", ");
    const quotedTable = tableService.sanitizeIdentifier(tableName);

    const result = await pool.query(
      `SELECT ${quotedColumns} FROM ${quotedTable} LIMIT $1`,
      [limit],
    );

    return result.rows.map((row) => this.applyMapping(row, mapping));
  }

  private applyMapping(
    row: Record<string, unknown>,
    mapping: MappingEntry[],
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const { sourceColumn, targetPath } of mapping) {
      const value = row[sourceColumn] ?? null;
      this.setNestedValue(result, targetPath.trim(), value);
    }

    return result;
  }

  private setNestedValue(
    obj: Record<string, unknown>,
    dotPath: string,
    value: unknown,
  ): void {
    const segments = dotPath.split(".");
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < segments.length - 1; i++) {
      const key = segments[i];
      const existing = current[key];
      
      // Check if the path already exists and is not an object
      if (existing !== undefined && existing !== null) {
        if (typeof existing !== "object" || Array.isArray(existing)) {
          throw new ValidationError(
            `Path collision at "${segments.slice(0, i + 1).join(".")}": ` +
            `Cannot create nested path because a scalar value already exists at this location.`
          );
        }
      }
      
      // Create object if it doesn't exist
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      }
      
      current = current[key] as Record<string, unknown>;
    }

    const finalKey = segments[segments.length - 1];
    
    // Check if we're trying to overwrite an object with a scalar
    if (current[finalKey] !== undefined && 
        typeof current[finalKey] === "object" && 
        !Array.isArray(current[finalKey]) &&
        Object.keys(current[finalKey] as object).length > 0) {
      throw new ValidationError(
        `Path collision at "${dotPath}": ` +
        `Cannot assign scalar value because nested properties already exist at this location.`
      );
    }

    current[finalKey] = value;
  }
}

export const mappingService = new MappingService();
