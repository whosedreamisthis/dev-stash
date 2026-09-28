export interface PaginatedResult<T> {
  items: T[];
  total: number;
  // The page that was returned; a page past the end falls back to the last one
  page: number;
  totalPages: number;
}
