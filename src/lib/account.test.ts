import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAccount } from "@/lib/account";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), delete: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
  },
}));
vi.mock("@/lib/email", () => ({ sendPasswordResetEmail: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

const findUnique = vi.mocked(prisma.user.findUnique);
const transaction = vi.mocked(prisma.$transaction);
const cancel = vi.fn();

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue({ subscriptions: { cancel } } as unknown as Stripe);
});

describe("deleteAccount", () => {
  it("cancels the subscription before deleting the user", async () => {
    findUnique.mockResolvedValue({ email: "ada@example.com", stripeSubscriptionId: "sub_1" } as never);
    cancel.mockResolvedValue({});

    await deleteAccount("user-1");

    expect(cancel).toHaveBeenCalledWith("sub_1");
    expect(transaction).toHaveBeenCalled();
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      transaction.mock.invocationCallOrder[0]
    );
  });

  it("keeps the account when cancelling fails", async () => {
    findUnique.mockResolvedValue({ email: "ada@example.com", stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("stripe down"));

    await expect(deleteAccount("user-1")).rejects.toThrow("stripe down");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes users without a subscription without calling Stripe", async () => {
    findUnique.mockResolvedValue({ email: "ada@example.com", stripeSubscriptionId: null } as never);

    await deleteAccount("user-1");

    expect(getStripe).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalled();
  });

  it("does nothing when the user doesn't exist", async () => {
    findUnique.mockResolvedValue(null);

    await deleteAccount("user-1");

    expect(cancel).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});
