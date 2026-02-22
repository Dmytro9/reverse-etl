import { useEffect, useState, useCallback } from "react";
import { listTables, listColumns } from "../../api/client";
import type { Column } from "../../types";

export function useTableSchema(connectionId: string) {
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTables = async () => {
      try {
        const { tables } = await listTables(connectionId);
        if (!cancelled) {
          setTables(tables);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load tables",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTables();

    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  const selectTable = useCallback(
    async (table: string): Promise<Column[]> => {
      setError(null);
      try {
        const { columns } = await listColumns(connectionId, table);
        setColumns(columns);
        return columns;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load columns";
        setError(message);
        return [];
      }
    },
    [connectionId],
  );

  return { tables, columns, loading, error, selectTable };
}
