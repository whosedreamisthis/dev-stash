// Recruiter demo: each visitor gets a temporary Pro account seeded with the demo content

export const DEMO_PROVIDER_ID = "demo";

// Demo accounts are deleted once they're this old
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;

export const DEMO_ONLY_ERROR =
  "Sign-in and registration aren't available in this demo. Use Try the Demo instead.";

export const DEMO_ACCOUNT_ERROR = "This isn't available on the demo account.";

// Read on each call so tests can switch it with vi.stubEnv
export function isDemoOnlyMode(): boolean {
  return process.env.DEMO_ONLY_MODE === "true";
}
