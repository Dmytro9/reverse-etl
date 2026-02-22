export interface MappingEntry {
  sourceColumn: string;
  targetPath: string;
}

export interface Column {
  name: string;
  type: string;
}

export interface TableInfo {
  tables: string[];
}

export interface ColumnInfo {
  columns: Column[];
}

export interface PreviewResponse {
  rows: Record<string, unknown>[];
}

export interface TestConnectionResponse {
  ok: boolean;
  connectionId: string;
}
