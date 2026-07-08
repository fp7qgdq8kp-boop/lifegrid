import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatGoalValue(
  value: number | null | undefined,
  unit: string | null | undefined
) {
  if (value === null || value === undefined) {
    return "Not set";
  }

  const normalizedUnit = unit?.toLowerCase() ?? "";

  if (normalizedUnit.includes("dollar") || normalizedUnit.includes("revenue")) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  if (!unit) {
    return formatCompactNumber(value);
  }

  return `${formatCompactNumber(value)} ${unit}`;
}

export function formatDate(value: Date | string | null | undefined, pattern = "MMM d, yyyy") {
  if (!value) {
    return "No date";
  }

  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern) : "No date";
}

export function formatRelativeDate(value: Date | string) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) {
    return "";
  }

  return format(date, "yyyy-MM-dd");
}

