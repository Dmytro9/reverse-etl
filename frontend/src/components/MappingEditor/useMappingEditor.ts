import { useMemo } from "react";
import { getValidationError } from "../../utils";
import type { Column, MappingEntry } from "../../types";

type UseMappingEditorParams = {
  columns: Column[];
  mapping: MappingEntry[];
  onMappingChange: (mapping: MappingEntry[]) => void;
};

export function useMappingEditor({
  columns,
  mapping,
  onMappingChange,
}: UseMappingEditorParams) {
  const update = (index: number, field: keyof MappingEntry, value: string) => {
    const next = [...mapping];
    next[index] = { ...next[index], [field]: value };
    onMappingChange(next);
  };

  const addRow = () => {
    onMappingChange([...mapping, { sourceColumn: "", targetPath: "" }]);
  };

  const removeRow = (index: number) => {
    onMappingChange(mapping.filter((_, i) => i !== index));
  };

  const autoMap = () => {
    onMappingChange(
      columns.map((col) => ({ sourceColumn: col.name, targetPath: col.name })),
    );
  };

  const hasErrors = useMemo(
    () =>
      mapping.some(
        (entry, i) => getValidationError(entry, i, mapping) !== null,
      ),
    [mapping],
  );

  return {
    update,
    addRow,
    removeRow,
    autoMap,
    hasErrors,
  };
}
