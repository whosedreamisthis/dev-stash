"use client";

import { useEffect, useRef } from "react";
import {
  createParticle,
  particleTransform,
  scaleToBounds,
  stepParticle,
  type Point,
  type Size,
} from "@/lib/chaos-physics";
import { CHAOS_ICONS } from "@/lib/homepage-content";
import { cn } from "@/lib/utils";

const LABEL = `Scattered tools: ${CHAOS_ICONS.map((icon) => icon.name).join(", ")}`;

function measure(element: HTMLElement): Size {
  return { width: element.clientWidth, height: element.clientHeight };
}

// Icons laid out by their position classes, then animated from there with transforms
function layoutOrigins(icons: HTMLElement[]): Point[] {
  return icons.map((icon) => ({ x: icon.offsetLeft, y: icon.offsetTop }));
}

export function ChaosIcons() {
  const boxRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const box = boxRef.current;
    const icons = iconRefs.current.filter((icon): icon is HTMLDivElement => icon !== null);
    if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let bounds = measure(box);
    let origins = layoutOrigins(icons);
    let particles = origins.map((origin) => createParticle(origin.x, origin.y));
    let pointer: Point | null = null;
    let frame = 0;

    const tick = (time: number) => {
      particles = particles.map((particle) => stepParticle(particle, bounds, pointer));
      particles.forEach((particle, i) => {
        icons[i].style.transform = particleTransform(particle, origins[i], time);
      });
      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onPointerLeave = () => {
      pointer = null;
    };

    const resizeObserver = new ResizeObserver(() => {
      const next = measure(box);
      particles = particles.map((particle) => scaleToBounds(particle, bounds, next));
      bounds = next;
      origins = layoutOrigins(icons);
    });

    box.addEventListener("pointermove", onPointerMove);
    box.addEventListener("pointerleave", onPointerLeave);
    resizeObserver.observe(box);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener("pointermove", onPointerMove);
      box.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={LABEL}
      className="relative h-80 overflow-hidden rounded-xl border border-dashed bg-background bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.05)_1px,transparent_0)] bg-size-[18px_18px]"
    >
      {CHAOS_ICONS.map(({ name, Icon, className }, i) => (
        <div
          key={name}
          ref={(element) => {
            iconRefs.current[i] = element;
          }}
          aria-hidden
          // size-13 (52px) must match CHAOS_CONFIG.iconSize
          className={cn(
            "absolute grid size-13 place-items-center rounded-xl border bg-card shadow-lg will-change-transform",
            className
          )}
        >
          <Icon className="size-7" />
        </div>
      ))}
    </div>
  );
}
