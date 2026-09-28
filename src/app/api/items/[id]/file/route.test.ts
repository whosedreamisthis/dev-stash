import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getSignedFileUrl } from "@/lib/uploadthing";
import { GET } from "./route";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ getItemFile: vi.fn() }));
vi.mock("@/lib/uploadthing", () => ({ getSignedFileUrl: vi.fn() }));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;

const FILE = { key: "abc_photo.svg", name: "photo.svg", mimeType: "image/svg+xml" };

function callGet(id: string) {
  return GET(new Request(`http://localhost/api/items/${id}/file`), {
    params: Promise.resolve({ id }),
  });
}

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId }, expires: "" } as Session);
}

describe("GET /api/items/[id]/file", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(getSignedFileUrl).mockResolvedValue("https://app.ufs.sh/f/abc_photo.svg?sig=1");
  });

  it("returns 401 without a session", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await callGet("item-1");
    expect(response.status).toBe(401);
    expect(getItemFile).not.toHaveBeenCalled();
  });

  it("returns 404 when the item isn't the user's or has no file", async () => {
    signIn("user-1");
    vi.mocked(getItemFile).mockResolvedValue(null);
    const response = await callGet("item-1");
    expect(response.status).toBe(404);
    expect(getItemFile).toHaveBeenCalledWith("user-1", "item-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("streams the file as a sandboxed attachment", async () => {
    signIn();
    vi.mocked(getItemFile).mockResolvedValue(FILE);
    fetchMock.mockResolvedValue(
      new Response("<svg/>", { headers: { "content-length": "6" } })
    );

    const response = await callGet("item-1");

    expect(fetchMock).toHaveBeenCalledWith("https://app.ufs.sh/f/abc_photo.svg?sig=1");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/svg+xml");
    expect(response.headers.get("content-disposition")).toMatch(/^attachment;/);
    expect(response.headers.get("content-security-policy")).toContain("sandbox");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-length")).toBe("6");
    await expect(response.text()).resolves.toBe("<svg/>");
  });

  it("returns 502 when UploadThing can't serve the file", async () => {
    signIn();
    vi.mocked(getItemFile).mockResolvedValue(FILE);
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    const response = await callGet("item-1");
    expect(response.status).toBe(502);
  });

  it("returns 500 when the lookup fails", async () => {
    signIn();
    vi.mocked(getItemFile).mockRejectedValue(new Error("db down"));
    const response = await callGet("item-1");
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});
