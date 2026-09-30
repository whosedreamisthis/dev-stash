// "1 item", "3 items"
export function formatItemCount(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

// "Sep 29, 2026"; UTC so server and browser render the same day
export const DATE_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
