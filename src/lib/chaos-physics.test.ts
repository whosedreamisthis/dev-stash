import { describe, expect, it } from "vitest";
import {
  CHAOS_CONFIG,
  bounce,
  createParticle,
  particleTransform,
  repel,
  scaleToBounds,
  stepParticle,
  type ChaosParticle,
} from "@/lib/chaos-physics";

const BOUNDS = { width: 400, height: 300 };
const MAX_X = BOUNDS.width - CHAOS_CONFIG.iconSize;
const MAX_Y = BOUNDS.height - CHAOS_CONFIG.iconSize;
const HALF = CHAOS_CONFIG.iconSize / 2;

// Returns 0.5 every time, which makes drift and random starts zero
const noDrift = () => 0.5;

function particle(overrides: Partial<ChaosParticle> = {}): ChaosParticle {
  return { x: 100, y: 100, vx: 1, vy: 0.5, angle: 0, spin: 0.2, phase: 0, ...overrides };
}

describe("createParticle", () => {
  it("starts at the given position with values from the random source", () => {
    const created = createParticle(10, 20, noDrift);
    expect(created).toMatchObject({ x: 10, y: 20, vx: 0, vy: 0, angle: 0, spin: 0 });
    expect(created.phase).toBeCloseTo(Math.PI);
  });
});

describe("repel", () => {
  it("pushes the particle away from a nearby pointer", () => {
    const pushed = repel(particle({ vx: 0, vy: 0 }), { x: 100 + HALF - 30, y: 100 + HALF });
    expect(pushed.vx).toBeGreaterThan(0);
    expect(pushed.vy).toBeCloseTo(0);
  });

  it("ignores a pointer outside the repel radius", () => {
    const start = particle();
    expect(repel(start, { x: 100 + HALF + CHAOS_CONFIG.repelRadius + 1, y: 100 + HALF })).toBe(start);
  });

  it("ignores a missing pointer or one exactly at the center", () => {
    const start = particle();
    expect(repel(start, null)).toBe(start);
    expect(repel(start, { x: 100 + HALF, y: 100 + HALF })).toBe(start);
  });
});

describe("bounce", () => {
  it("clamps to the left wall and sends the particle right", () => {
    const bounced = bounce(particle({ x: -5, vx: -1, spin: 0.2 }), BOUNDS);
    expect(bounced).toMatchObject({ x: 0, vx: 1, spin: -0.2 });
  });

  it("clamps to the bottom wall and sends the particle up", () => {
    const bounced = bounce(particle({ y: MAX_Y + 10, vy: 2 }), BOUNDS);
    expect(bounced).toMatchObject({ y: MAX_Y, vy: -2 });
  });

  it("keeps moving inward when already heading away from the wall", () => {
    expect(bounce(particle({ x: MAX_X + 3, vx: -1 }), BOUNDS).vx).toBe(-1);
  });

  it("leaves a particle inside the box unchanged", () => {
    expect(bounce(particle(), BOUNDS)).toEqual(particle());
  });
});

describe("stepParticle", () => {
  it("moves by its velocity and turns by its spin", () => {
    const next = stepParticle(particle(), BOUNDS, null, noDrift);
    expect(next).toMatchObject({ x: 101, y: 100.5, angle: 0.2, spin: 0.2 });
  });

  it("slows down a particle faster than the max speed", () => {
    const next = stepParticle(particle({ vx: 3, vy: 0 }), BOUNDS, null, noDrift);
    expect(next.vx).toBeCloseTo(2.82);
  });

  it("speeds up a particle slower than the min speed", () => {
    const next = stepParticle(particle({ vx: 0.1, vy: 0 }), BOUNDS, null, noDrift);
    expect(next.vx).toBeCloseTo(0.11);
  });

  it("reverses the spin past the max tilt", () => {
    const next = stepParticle(particle({ angle: CHAOS_CONFIG.maxTilt, spin: 0.5 }), BOUNDS, null, noDrift);
    expect(next.spin).toBe(-0.5);
  });

  it("stays inside the box", () => {
    const next = stepParticle(particle({ x: MAX_X, vx: 1.5 }), BOUNDS, null, noDrift);
    expect(next.x).toBe(MAX_X);
    expect(next.vx).toBeLessThan(0);
  });
});

describe("scaleToBounds", () => {
  it("keeps the particle's relative position in a smaller box", () => {
    const small = { width: 200, height: 150 };
    const scaled = scaleToBounds(particle({ x: MAX_X, y: MAX_Y / 2 }), BOUNDS, small);
    expect(scaled.x).toBeCloseTo(small.width - CHAOS_CONFIG.iconSize);
    expect(scaled.y).toBeCloseTo((small.height - CHAOS_CONFIG.iconSize) / 2);
  });

  it("spreads particles that were at different spots instead of clamping them together", () => {
    const small = { width: 200, height: 300 };
    const a = scaleToBounds(particle({ x: 250 }), BOUNDS, small);
    const b = scaleToBounds(particle({ x: 340 }), BOUNDS, small);
    expect(a.x).not.toBe(b.x);
  });

  it("clamps into the box when the old box had no free space", () => {
    const scaled = scaleToBounds(particle({ x: 500 }), { width: 0, height: 0 }, BOUNDS);
    expect(scaled.x).toBe(MAX_X);
  });
});

describe("particleTransform", () => {
  it("translates from the origin and applies the tilt and pulse", () => {
    const transform = particleTransform(particle({ x: 30, y: 40, angle: 5 }), { x: 10, y: 10 }, 0);
    expect(transform).toBe("translate(20px, 30px) rotate(5deg) scale(1)");
  });
});
