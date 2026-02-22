import type { MappingEntry } from "../types";

const PATH_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

export const getValidationError = (
  entry: MappingEntry,
  index: number,
  all: MappingEntry[],
): string | null => {
  if (!entry.sourceColumn) return "Select a source column";
  if (!entry.targetPath.trim()) return "Target path is required";
  if (!PATH_REGEX.test(entry.targetPath.trim()))
    return "Invalid path (use alphanumeric.dot notation)";

  const path = entry.targetPath.trim();
  const duplicates = all.filter(
    (m, i) => i !== index && m.targetPath.trim() === path,
  );
  if (duplicates.length > 0) return "Duplicate path";

  // Check for collisions: current path is a prefix of another, or another is a prefix of this
  for (let i = 0; i < all.length; i++) {
    if (i === index) continue;
    const other = all[i].targetPath.trim();
    if (!other) continue;
    if (other.startsWith(path + ".") || path.startsWith(other + ".")) {
      return `Conflicts with "${other}"`;
    }
  }

  return null;
};
