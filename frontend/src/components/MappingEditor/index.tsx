import { type FC } from "react";
import cn from "classnames";
import { getValidationError } from "../../utils";
import type { Column, MappingEntry } from "../../types";
import { useMappingEditor } from "./useMappingEditor";

type Props = {
  columns: Column[];
  mapping: MappingEntry[];
  onMappingChange: (mapping: MappingEntry[]) => void;
};

export const MappingEditor: FC<Props> = ({
  columns,
  mapping,
  onMappingChange,
}) => {
  const { update, addRow, removeRow, autoMap, hasErrors } = useMappingEditor({
    columns,
    mapping,
    onMappingChange,
  });

  return (
    <div className="step-content">
      <h2>Map Columns</h2>
      <p className="step-description">
        Define how each column maps to the output JSON. Use dot notation for
        nested fields (e.g. <code>user.name.first</code>).
      </p>

      <div className="mapping-actions">
        <button className="btn btn-secondary" onClick={autoMap} type="button">
          Auto-map all columns
        </button>
        <button className="btn btn-secondary" onClick={addRow} type="button">
          + Add row
        </button>
      </div>

      {mapping.length === 0 && (
        <p className="empty-state">
          No mappings yet. Click "Auto-map" or "Add row" to start.
        </p>
      )}

      {mapping.length > 0 && (
        <div className="mapping-table">
          <div className="mapping-header">
            <span>Source Column</span>
            <span></span>
            <span>JSON Path</span>
            <span></span>
          </div>
          {mapping.map((entry, i) => {
            const error = getValidationError(entry, i, mapping);
            return (
              <div
                key={i}
                className={cn("mapping-row", { "has-error": error })}
              >
                <select
                  value={entry.sourceColumn}
                  onChange={(e) => update(i, "sourceColumn", e.target.value)}
                >
                  <option value="">Select column…</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
                <span className="arrow">→</span>
                <input
                  type="text"
                  placeholder="e.g. user.name.first"
                  value={entry.targetPath}
                  onChange={(e) => update(i, "targetPath", e.target.value)}
                />
                <button
                  className="btn btn-danger btn-sm"
                  title="Remove"
                  onClick={() => removeRow(i)}
                >
                  ✕
                </button>
                {error && <span className="field-error">{error}</span>}
              </div>
            );
          })}
        </div>
      )}

      {hasErrors && mapping.length > 0 && (
        <div className="status status-error">
          Fix mapping errors before continuing.
        </div>
      )}
    </div>
  );
};
