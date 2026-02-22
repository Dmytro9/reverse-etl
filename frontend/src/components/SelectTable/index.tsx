import { type FC } from "react";
import { useTableSchema } from "./useTableSchema";
import type { Column } from "../../types";

type Props = {
  connectionId: string;
  selectedTable: string | null;
  onTableSelected: (table: string, columns: Column[]) => void;
};

export const SelectTable: FC<Props> = ({
  connectionId,
  selectedTable,
  onTableSelected,
}) => {
  const { tables, columns, loading, error, selectTable } =
    useTableSchema(connectionId);

  const handleSelect = async (table: string) => {
    const cols = await selectTable(table);
    if (cols.length > 0) {
      onTableSelected(table, cols);
    }
  };

  if (loading)
    return (
      <div className="step-content">
        <p>Loading tables…</p>
      </div>
    );

  return (
    <div className="step-content">
      <h2>Select Table</h2>
      <p className="step-description">
        Choose a table to sync from your database.
      </p>

      {error && <div className="status status-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="table-select">Table</label>
        <select
          id="table-select"
          value={selectedTable || ""}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="" disabled>
            Select a table…
          </option>
          {tables.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {columns.length > 0 && (
        <div className="schema-table">
          <h3>Schema</h3>
          <table>
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.name}>
                  <td>
                    <code>{col.name}</code>
                  </td>
                  <td>{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
