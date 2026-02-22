export type Column = {
  name: string;
  type: string;
};

export type MappingEntry = {
  sourceColumn: string;
  targetPath: string;
};

export type AppState = {
  connectionString: string;
  connectionId: string | null;
  tables: string[];
  selectedTable: string | null;
  columns: Column[];
  mapping: MappingEntry[];
  webhookUrl: string;
};
