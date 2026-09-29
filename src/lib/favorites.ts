// Shared by the favorite item and collection rows
export const FAVORITE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const FAVORITE_ROW_CLASS =
  "relative flex items-center gap-3 px-3 py-1.5 font-mono text-sm transition-colors hover:bg-accent/40";
