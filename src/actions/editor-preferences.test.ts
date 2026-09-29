import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/users";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import type { EditorPreferences } from "@/lib/validations/editor-preferences";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ updateEditorPreferences: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

const PREFERENCES: EditorPreferences = {
  fontSize: 16,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
};

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(updateEditorPreferences(PREFERENCES)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(updateEditorPreferencesQuery).not.toHaveBeenCalled();
  });

  it("saves the preferences for the session user", async () => {
    signIn("user-42");
    vi.mocked(updateEditorPreferencesQuery).mockResolvedValue(true);
    await expect(updateEditorPreferences(PREFERENCES)).resolves.toEqual({
      success: true,
      data: PREFERENCES,
    });
    expect(updateEditorPreferencesQuery).toHaveBeenCalledWith("user-42", PREFERENCES);
  });

  it("strips unknown fields before saving", async () => {
    signIn();
    vi.mocked(updateEditorPreferencesQuery).mockResolvedValue(true);
    await updateEditorPreferences({ ...PREFERENCES, extra: "x" } as EditorPreferences);
    expect(updateEditorPreferencesQuery).toHaveBeenCalledWith("user-1", PREFERENCES);
  });

  it("rejects values that aren't one of the options", async () => {
    signIn();
    const invalid = [
      { ...PREFERENCES, fontSize: 15 },
      { ...PREFERENCES, tabSize: 3 },
      { ...PREFERENCES, theme: "solarized" },
      { ...PREFERENCES, wordWrap: "yes" },
    ];
    for (const preferences of invalid) {
      await expect(
        updateEditorPreferences(preferences as unknown as EditorPreferences)
      ).resolves.toEqual({ success: false, error: "Those editor settings aren't valid." });
    }
    expect(updateEditorPreferencesQuery).not.toHaveBeenCalled();
  });

  it("reports a user that no longer exists as signed out", async () => {
    signIn();
    vi.mocked(updateEditorPreferencesQuery).mockResolvedValue(false);
    await expect(updateEditorPreferences(PREFERENCES)).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
  });

  it("returns an error when saving fails", async () => {
    signIn();
    vi.mocked(updateEditorPreferencesQuery).mockRejectedValue(new Error("db down"));
    await expect(updateEditorPreferences(PREFERENCES)).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
