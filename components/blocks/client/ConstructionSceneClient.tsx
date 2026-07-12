"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";

/**
 * Isometric CSS-3D tower timelapse. Floors assemble bottom-up, scrubbed by
 * scroll (pinned on desktop); a gold crane slews continuously above the
 * rising structure. Under reduced motion (or below lg) the tower renders
 * complete/animates in simply — nothing is scroll-locked.
 *
 * Geometry: a `world` plane tilted rotateX(58deg) rotateZ(-42deg); each
 * floor is a 3D box built from front/side/top faces, lifted translateZ.
 */

const FLOOR_H = 26; // px per floor (z height)
const TOWER_W = 190;
const TOWER_D = 150;

export default function ConstructionSceneClient({
  floors,
  caption,
}: {
  floors: number;
  caption: string;
}) {
  const { reduced } = useReducedMotionPref();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const [builtLabel, setBuiltLabel] = useState(false);

  useLayoutEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const floorEls = gsap.utils.toArray<HTMLElement>("[data-floor]", root);
      const crane = root.querySelector<HTMLElement>("[data-crane]");
      const glow = root.querySelector<HTMLElement>("[data-glow]");
      const pinned = window.matchMedia("(min-width: 1024px)").matches;

      gsap.set(floorEls, { autoAlpha: 0, z: (i: number) => i * FLOOR_H + 46 });
      gsap.set(crane, { autoAlpha: 0.25 });
      gsap.set(glow, { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: EASE.out },
        scrollTrigger: pinned
          ? {
              trigger: root,
              start: "center center",
              end: "+=140%",
              pin: true,
              scrub: 0.6,
            }
          : {
              trigger: root,
              start: "top 70%",
              end: "bottom 45%",
              scrub: 0.6,
            },
        onUpdate: () => {
          if (!counterRef.current) return;
          const built = Math.round(tl.progress() * floors);
          counterRef.current.textContent = String(Math.min(built, floors));
        },
      });

      tl.to(crane, { autoAlpha: 1, duration: 0.6 }, 0);
      floorEls.forEach((el, i) => {
        tl.to(
          el,
          { autoAlpha: 1, z: i * FLOOR_H, duration: 0.9 },
          i * 0.55 + 0.2,
        );
      });
      tl.to(
        glow,
        { autoAlpha: 1, duration: 1.4 },
        floors * 0.55 + 0.3,
      );
      tl.call(
        () => setBuiltLabel(true),
        undefined,
        Math.max(floors * 0.55, 1),
      );
    }, root);

    return () => ctx.revert();
  }, [reduced, floors]);

  const floorIndexes = Array.from({ length: floors }, (_, i) => i);

  return (
    <div ref={rootRef} className="relative mt-4">
      <div
        className="relative mx-auto flex h-[520px] max-w-3xl items-center justify-center md:h-[560px]"
        style={{ perspective: "1400px" }}
        aria-label="Animated construction scene: a tower rising floor by floor with a crane"
        role="img"
      >
        {/* world plane */}
        <div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(58deg) rotateZ(-42deg)",
            width: 460,
            height: 460,
          }}
        >
          {/* ground: tan grid */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(closest-side, rgb(237 230 217 / 0.13), rgb(237 230 217 / 0.045) 70%, transparent), repeating-linear-gradient(0deg, transparent 0 45px, rgb(237 230 217 / 0.07) 45px 46px), repeating-linear-gradient(90deg, transparent 0 45px, rgb(237 230 217 / 0.07) 45px 46px)",
              border: "1px solid rgb(237 230 217 / 0.12)",
              boxShadow: "0 0 120px rgb(70 38 92 / 0.45)",
            }}
          />
          {/* foundation slab */}
          <div
            className="absolute"
            style={{
              left: 120,
              top: 140,
              width: TOWER_W + 24,
              height: TOWER_D + 24,
              background: "rgb(196 160 82 / 0.14)",
              border: "1px solid rgb(196 160 82 / 0.4)",
              transform: "translateZ(2px)",
              transformStyle: "preserve-3d",
            }}
          />

          {/* floors — each a 3D box: top + two visible walls */}
          {floorIndexes.map((i) => {
            const shrink = Math.min(i * 1.2, 18);
            const w = TOWER_W - shrink;
            const d = TOWER_D - shrink;
            const isPenthouse = i === floors - 1;
            return (
              <div
                key={i}
                data-floor
                className="absolute"
                style={{
                  left: 132 + shrink / 2,
                  top: 152 + shrink / 2,
                  width: w,
                  height: d,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${i * FLOOR_H}px)`,
                }}
              >
                {/* top slab */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: isPenthouse
                      ? "linear-gradient(135deg, rgb(227 197 124 / 0.95), rgb(196 160 82 / 0.8))"
                      : "linear-gradient(135deg, rgb(20 20 25 / 0.96), rgb(35 27 48 / 0.95))",
                    border: "1px solid rgb(196 160 82 / 0.5)",
                    transform: `translateZ(${FLOOR_H}px)`,
                  }}
                />
                {/* front wall (faces viewer, glass + gold mullions) */}
                <div
                  className="absolute left-0 bottom-0 origin-bottom"
                  style={{
                    width: w,
                    height: FLOOR_H,
                    transform: "rotateX(-90deg)",
                    transformOrigin: "bottom",
                    top: d - FLOOR_H,
                    background:
                      "linear-gradient(180deg, rgb(196 160 82 / 0.32), rgb(70 38 92 / 0.30)), repeating-linear-gradient(90deg, transparent 0 14px, rgb(10 10 13 / 0.55) 14px 16px)",
                    borderInline: "1px solid rgb(196 160 82 / 0.45)",
                  }}
                />
                {/* side wall */}
                <div
                  className="absolute top-0 origin-left"
                  style={{
                    width: d,
                    height: FLOOR_H,
                    left: w,
                    transform: "rotateX(-90deg) rotateY(90deg)",
                    transformOrigin: "left bottom",
                    background:
                      "linear-gradient(180deg, rgb(227 197 124 / 0.2), rgb(23 53 42 / 0.42)), repeating-linear-gradient(90deg, transparent 0 12px, rgb(10 10 13 / 0.5) 12px 14px)",
                  }}
                />
              </div>
            );
          })}

          {/* topping-out glow */}
          <div
            data-glow
            className="pointer-events-none absolute"
            style={{
              left: 100,
              top: 120,
              width: TOWER_W + 60,
              height: TOWER_D + 60,
              transform: `translateZ(${floors * FLOOR_H + 30}px)`,
              background:
                "radial-gradient(closest-side, rgb(227 197 124 / 0.5), transparent 70%)",
              filter: "blur(6px)",
            }}
          />

          {/* crane: base pad, mast, slewing jib */}
          <div
            data-crane
            className="absolute"
            style={{
              left: 68,
              top: 330,
              width: 26,
              height: 26,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "rgb(196 160 82 / 0.35)",
                border: "1px solid rgb(196 160 82 / 0.7)",
              }}
            />
            {/* mast — stands up from the pad (same pattern as floor walls:
                bottom edge stays on the plane, body rotates up along +Z) */}
            <div
              className="absolute"
              style={{
                width: 8,
                height: (floors + 3.2) * FLOOR_H,
                left: "50%",
                marginLeft: -4,
                top: 13 - (floors + 3.2) * FLOOR_H,
                transform: "rotateX(-90deg)",
                transformOrigin: "bottom",
                background:
                  "repeating-linear-gradient(0deg, rgb(196 160 82 / 0.95) 0 3px, rgb(196 160 82 / 0.25) 3px 12px)",
              }}
            />
            {/* slewing jib (rotates in plan, i.e. around Z of the world) */}
            <div
              className="absolute left-1/2 top-1/2 cs-slew"
              style={{
                width: 220,
                height: 6,
                marginTop: -3,
                transformStyle: "preserve-3d",
                translate: `0 0 ${(floors + 3) * FLOOR_H}px`,
                transformOrigin: "18px center",
              }}
            >
              <div
                className="absolute inset-y-0 left-[18px] right-0"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, rgb(227 197 124 / 0.95) 0 10px, rgb(227 197 124 / 0.3) 10px 20px)",
                }}
              />
              {/* counter-jib */}
              <div
                className="absolute inset-y-0 left-0 w-[18px]"
                style={{ background: "rgb(227 197 124 / 0.8)" }}
              />
              {/* hook cable */}
              <div
                className="absolute"
                style={{
                  left: 168,
                  top: 3,
                  width: 1.5,
                  height: 84,
                  transform: "rotateX(-90deg)",
                  transformOrigin: "top",
                  background: "rgb(237 230 217 / 0.5)",
                }}
              />
            </div>
          </div>
        </div>

        {/* dusk halo behind the scene */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(45% 40% at 50% 55%, rgb(70 38 92 / 0.5), transparent 75%)",
          }}
        />
      </div>

      {/* progress caption */}
      <div className="mt-2 flex items-baseline justify-center gap-3 text-center">
        <span className="font-display text-3xl font-medium tabular-nums text-gold-bright">
          <span ref={counterRef}>{reduced ? floors : 0}</span>
          <span className="text-plaster/50"> / {floors}</span>
        </span>
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/50">
          {builtLabel || reduced ? "Topping out" : caption || "Floors"}
        </span>
      </div>

      {/* crane slew animation + reduced-motion completion */}
      <style>{`
        .cs-slew { animation: cs-slew 14s ease-in-out infinite alternate; }
        @keyframes cs-slew {
          from { transform: rotate(-24deg); }
          to { transform: rotate(38deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-slew { animation: none; transform: rotate(10deg); }
          [data-floor] { opacity: 1 !important; visibility: visible !important; }
          [data-glow] { opacity: 1 !important; visibility: visible !important; }
          [data-crane] { opacity: 1 !important; visibility: visible !important; }
        }
        html[data-reduced-motion="true"] .cs-slew { animation: none; transform: rotate(10deg); }
        html[data-reduced-motion="true"] [data-floor],
        html[data-reduced-motion="true"] [data-glow],
        html[data-reduced-motion="true"] [data-crane] { opacity: 1 !important; visibility: visible !important; }
      `}</style>
    </div>
  );
}
