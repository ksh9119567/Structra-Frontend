"use client";

/**
 * Generic labeled-option filter select.
 * Generalization of RoleFilterSelect (members-table-ui) for domains where
 * the option label isn't derivable from the value itself — e.g. task status
 * ("IN_PROGRESS" → "In Progress") or priority ("HIGH" → "High").
 */

export type FilterOption<T extends string> = { value: T; label: string };

type FilterSelectProps<T extends string> = {
  value: T | "";
  onChange: (value: T | "") => void;
  options: FilterOption<T>[];
  /** Label for the "no filter" option, e.g. "All statuses". */
  allLabel: string;
};

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  allLabel,
}: FilterSelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
