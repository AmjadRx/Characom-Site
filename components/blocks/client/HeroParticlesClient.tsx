"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers";

/**
 * Hero canvas particle field (ARCHITECTURE.md §5.1.1 / §6.3):
 * ≤180 slow-drifting gold particles with proximity-based connecting lines.
 * devicePixelRatio capped at 2; the RAF loop fully stops when the tab is
 * hidden or the hero is off-screen; disabled under reduced motion.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const MAX_PARTICLES = 180;
const LINK_DIST = 120;

export default function HeroParticlesClient({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { reduced } = useReducedMotionPref();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    const particles: Particle[] = [];
    let raf = 0;
    let tabVisible = !document.hidden;
    let inView = true;
    let destroyed = false;

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 0.8 + Math.random() * 1.3,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(
        MAX_PARTICLES,
        Math.max(40, Math.round((width * height) / 11000)),
      );
      while (particles.length < target) particles.push(spawn());
      if (particles.length > target) particles.length = target;
    };

    const frame = () => {
      raf = 0;
      if (destroyed || !tabVisible || !inView) return;

      context.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;
      }

      // Connecting lines — gold, alpha falls off with distance.
      context.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          if (dx > LINK_DIST || dx < -LINK_DIST) continue;
          const dy = a.y - b.y;
          if (dy > LINK_DIST || dy < -LINK_DIST) continue;
          const dist = Math.hypot(dx, dy);
          if (dist >= LINK_DIST) continue;
          const alpha = (1 - dist / LINK_DIST) * 0.16;
          context.strokeStyle = `rgba(200, 145, 45, ${alpha.toFixed(3)})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      context.fillStyle = "rgba(227, 183, 92, 0.75)";
      for (const p of particles) {
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }

      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && !destroyed && tabVisible && inView) {
        raf = requestAnimationFrame(frame);
      }
    };

    const onVisibility = () => {
      tabVisible = !document.hidden;
      kick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        kick();
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);

    resize();
    kick();

    return () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      ro.disconnect();
    };
  }, [reduced]);

  // §6.4 — particles disabled entirely under reduced motion.
  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      className={cn("block", className)}
      aria-hidden="true"
    />
  );
}
