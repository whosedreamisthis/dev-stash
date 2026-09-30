// The { success, data, error } shape every server action returns
export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}
