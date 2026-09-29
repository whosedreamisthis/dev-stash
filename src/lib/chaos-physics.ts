// Motion for the homepage's floating "chaos" icons: drift, wall bounce, tilt and cursor repel

export const CHAOS_CONFIG = {
  iconSize: 52, // px; matches the icons' size-13 class
  minSpeed: 0.3,
  maxSpeed: 1.6,
  drift: 0.05,
  repelRadius: 110,
  repelForce: 0.9,
  maxTilt: 25, // degrees
  pulse: 0.06, // scale amplitude
} as const;

export interface ChaosParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  phase: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

type Random = () => number;

function between(random: Random, min: number, max: number) {
  return min + random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// The room an icon has to move in, since x/y is its top-left corner
function freeSpace(bounds: Size): Size {
  return {
    width: Math.max(bounds.width - CHAOS_CONFIG.iconSize, 0),
    height: Math.max(bounds.height - CHAOS_CONFIG.iconSize, 0),
  };
}

export function createParticle(x: number, y: number, random: Random = Math.random): ChaosParticle {
  return {
    x,
    y,
    vx: between(random, -1, 1),
    vy: between(random, -1, 1),
    angle: between(random, -20, 20),
    spin: between(random, -0.3, 0.3),
    phase: between(random, 0, Math.PI * 2),
  };
}

// Pushes the particle away from the pointer, harder the closer it is
export function repel(particle: ChaosParticle, pointer: Point | null): ChaosParticle {
  if (!pointer) return particle;
  const half = CHAOS_CONFIG.iconSize / 2;
  const dx = particle.x + half - pointer.x;
  const dy = particle.y + half - pointer.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist > CHAOS_CONFIG.repelRadius) return particle;

  const strength = (1 - dist / CHAOS_CONFIG.repelRadius) * CHAOS_CONFIG.repelForce;
  return {
    ...particle,
    vx: particle.vx + (dx / dist) * strength,
    vy: particle.vy + (dy / dist) * strength,
  };
}

// Keeps the particle inside the box, sending it back inward from any wall it crossed
export function bounce(particle: ChaosParticle, bounds: Size): ChaosParticle {
  const space = freeSpace(bounds);
  let { x, y, vx, vy, spin } = particle;

  if (x < 0 || x > space.width) {
    vx = x < 0 ? Math.abs(vx) : -Math.abs(vx);
    x = clamp(x, 0, space.width);
    spin = -spin;
  }
  if (y < 0 || y > space.height) {
    vy = y < 0 ? Math.abs(vy) : -Math.abs(vy);
    y = clamp(y, 0, space.height);
  }

  return { ...particle, x, y, vx, vy, spin };
}

// Eases the speed back toward a calm cruise after drift or a push
function settleSpeed(vx: number, vy: number): [number, number] {
  const speed = Math.hypot(vx, vy);
  if (speed > CHAOS_CONFIG.maxSpeed) return [vx * 0.94, vy * 0.94];
  if (speed < CHAOS_CONFIG.minSpeed) return [vx * 1.1, vy * 1.1];
  return [vx, vy];
}

// Advances the particle by one animation frame
export function stepParticle(
  particle: ChaosParticle,
  bounds: Size,
  pointer: Point | null,
  random: Random = Math.random
): ChaosParticle {
  const pushed = repel(particle, pointer);
  const [vx, vy] = settleSpeed(
    pushed.vx + between(random, -CHAOS_CONFIG.drift, CHAOS_CONFIG.drift),
    pushed.vy + between(random, -CHAOS_CONFIG.drift, CHAOS_CONFIG.drift)
  );
  const angle = pushed.angle + pushed.spin;
  const spin = Math.abs(angle) > CHAOS_CONFIG.maxTilt ? -pushed.spin : pushed.spin;

  return bounce({ ...pushed, x: pushed.x + vx, y: pushed.y + vy, vx, vy, angle, spin }, bounds);
}

// Moves the particle to the same relative spot in a resized box, so icons don't bunch at an edge
export function scaleToBounds(particle: ChaosParticle, from: Size, to: Size): ChaosParticle {
  const fromSpace = freeSpace(from);
  const toSpace = freeSpace(to);
  const scaleX = fromSpace.width > 0 ? toSpace.width / fromSpace.width : 1;
  const scaleY = fromSpace.height > 0 ? toSpace.height / fromSpace.height : 1;
  return bounce({ ...particle, x: particle.x * scaleX, y: particle.y * scaleY }, to);
}

// CSS transform placing the particle relative to the icon's laid-out position (origin)
export function particleTransform(particle: ChaosParticle, origin: Point, time: number): string {
  const scale = 1 + Math.sin(time / 900 + particle.phase) * CHAOS_CONFIG.pulse;
  return `translate(${particle.x - origin.x}px, ${particle.y - origin.y}px) rotate(${particle.angle}deg) scale(${scale})`;
}
