"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import { C, Person, Scaffold, SoftShadow, Tree, World } from "./kit";

/**
 * Corporate tower timelapse with the "12 reasons" rail: every floor that
 * rises reveals the next reason to choose Characom. Pinned and scrubbed on
 * desktop; the whole composition is scaled to fit the viewport so the tower
 * never disappears behind the navigation.
 */

const FLOOR_H = 22;
const TOWER_W = 170;
const TOWER_D = 134;

export interface Reason {
  title: string;
  text: string;
}

export default function TowerSceneClient({
  floors,
  caption,
  reasons,
}: {
  floors: number;
  caption: string;
  reasons: Reason[];
}) {
  const { reduced } = useReducedMotionPref();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const [built, setBuilt] = useState(reduced ? floors : 0);
  const builtRef = useRef(built);
  builtRef.current = built;

  const fit = () => {
    const stage = stageRef.current;
    const wrap = scaleRef.current;
    if (!stage || !wrap) return;
    wrap.style.transform = "scale(1)";
    const leaves = wrap.querySelectorAll<HTMLElement>("div");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    leaves.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    });
    const sr = stage.getBoundingClientRect();
    const s = Math.min(1, (sr.width - 24) / (maxX - minX), (sr.height - 16) / (maxY - minY));
    wrap.style.transform = `scale(${s})`;
  };

  useLayoutEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    if (reduced) {
      setBuilt(floors);
      return;
    }
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const q = (sel: string) => root.querySelectorAll(sel);
      const floorEls = gsap.utils.toArray<HTMLElement>("[data-floor]", root);
      const pinned = window.matchMedia("(min-width: 1024px)").matches;

      gsap.set(floorEls, { autoAlpha: 0, z: (i: number) => i * FLOOR_H + 40 });
      gsap.set("[data-crane]", { autoAlpha: 0.25 });
      gsap.set("[data-glow]", { autoAlpha: 0 });
      gsap.set(q("[data-scaffold]"), { autoAlpha: 0 });
      gsap.set(q("[data-worker]"), { autoAlpha: 0 });
      gsap.set(q("[data-tree]"), { scaleY: 0.05, autoAlpha: 0, transformOrigin: "bottom center" });

      const tl = gsap.timeline({
        defaults: { ease: EASE.out },
        scrollTrigger: pinned
          ? { trigger: root, start: "top top", end: "+=200%", pin: true, scrub: 0.6 }
          : { trigger: root, start: "top 70%", end: "bottom 35%", scrub: 0.6 },
        onUpdate: () => {
          const k = Math.max(
            0,
            Math.min(floors, Math.round(((tl.progress() * (floors * 0.55 + 2.4)) - 0.7) / 0.55)),
          );
          if (k !== builtRef.current) setBuilt(k);
        },
      });

      tl.to("[data-crane]", { autoAlpha: 1, duration: 0.6 }, 0);
      tl.to(q("[data-worker]"), { autoAlpha: 1, stagger: 0.1, duration: 0.4 }, 0.3);
      tl.to(q("[data-scaffold]"), { autoAlpha: 1, duration: 0.5 }, 0.4);
      floorEls.forEach((el, i) => {
        tl.to(el, { autoAlpha: 1, z: i * FLOOR_H, duration: 0.9 }, i * 0.55 + 0.7);
      });
      const done = floors * 0.55 + 0.9;
      tl.to(q("[data-scaffold]"), { autoAlpha: 0, duration: 0.6 }, done);
      tl.to(q("[data-worker]"), { autoAlpha: 0, duration: 0.5 }, done + 0.2);
      tl.to(q("[data-tree]"), { scaleY: 1, autoAlpha: 1, stagger: 0.15, duration: 0.8 }, done);
      tl.to("[data-glow]", { autoAlpha: 1, duration: 1.2 }, done + 0.4);

      requestAnimationFrame(fit);
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, floors]);

  const floorIndexes = Array.from({ length: floors }, (_, i) => i);
  const activeReason = Math.max(0, Math.min(reasons.length - 1, built - 1));
  const mastH = (floors + 3.2) * FLOOR_H;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex min-h-[100svh] flex-col pt-[calc(var(--nav-h)+1rem)] pb-6 lg:h-[100svh]">
        <div className="grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[1fr_360px]">
          {/* stage */}
          <div ref={stageRef} className="relative flex h-full min-h-[340px] items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(45% 40% at 50% 55%, ${C.purple} / 0.5), transparent 75%)` }}
            />
            <div
              ref={scaleRef}
              style={{ transformOrigin: "center center" }}
              role="img"
              aria-label="Animated scene: an office tower rises floor by floor with a crane, scaffolding and site crew"
            >
              <World size={440}>
                <SoftShadow x={124} y={144} w={TOWER_W + 40} d={TOWER_D + 40} opacity={0.5} />
                {/* foundation */}
                <div className="absolute" style={{
                  left: 122, top: 142, width: TOWER_W + 24, height: TOWER_D + 24,
                  background: `${C.gold} / 0.14)`, border: `1px solid ${C.gold} / 0.4)`,
                  transform: "translateZ(2px)",
                }} />

                {floorIndexes.map((i) => {
                  const shrink = Math.min(i * 1.1, 16);
                  const w = TOWER_W - shrink;
                  const d = TOWER_D - shrink;
                  const isPenthouse = i === floors - 1;
                  return (
                    <div
                      key={i}
                      data-floor
                      className="absolute"
                      style={{
                        left: 134 + shrink / 2,
                        top: 154 + shrink / 2,
                        width: w,
                        height: d,
                        transformStyle: "preserve-3d",
                        transform: `translateZ(${i * FLOOR_H}px)`,
                      }}
                    >
                      <div className="absolute inset-0" style={{
                        background: isPenthouse
                          ? `linear-gradient(135deg, ${C.goldBright} / 0.95), ${C.gold} / 0.8))`
                          : `linear-gradient(135deg, rgb(20 20 25 / 0.96), rgb(35 27 48 / 0.95))`,
                        border: `1px solid ${C.gold} / 0.5)`,
                        transform: `translateZ(${FLOOR_H}px)`,
                      }} />
                      <div className="absolute left-0" style={{
                        width: w, height: FLOOR_H, top: d - FLOOR_H,
                        transform: "rotateX(-90deg)", transformOrigin: "bottom",
                        background: `linear-gradient(180deg, ${C.gold} / 0.32), ${C.purple} / 0.3)), repeating-linear-gradient(90deg, transparent 0 13px, ${C.ink} / 0.55) 13px 15px)`,
                        borderInline: `1px solid ${C.gold} / 0.45)`,
                      }} />
                      <div className="absolute top-0" style={{
                        width: d, height: FLOOR_H, left: w,
                        transform: "rotateX(-90deg) rotateY(90deg)", transformOrigin: "left bottom",
                        background: `linear-gradient(180deg, ${C.goldBright} / 0.2), ${C.green} / 0.42)), repeating-linear-gradient(90deg, transparent 0 11px, ${C.ink} / 0.5) 11px 13px)`,
                      }} />
                    </div>
                  );
                })}

                {/* topping-out glow */}
                <div data-glow className="pointer-events-none absolute" style={{
                  left: 104, top: 124, width: TOWER_W + 56, height: TOWER_D + 56,
                  transform: `translateZ(${floors * FLOOR_H + 26}px)`,
                  background: `radial-gradient(closest-side, ${C.goldBright} / 0.5), transparent 70%)`,
                  filter: "blur(6px)",
                }} />

                {/* scaffolding around the lower floors */}
                <Scaffold x={130} y={278} w={178} h={FLOOR_H * 3.4} side="front" />
                <Scaffold x={304} y={152} w={140} h={FLOOR_H * 3.4} side="side" />

                {/* crane */}
                <div data-crane className="absolute" style={{ left: 64, top: 318, width: 26, height: 26, transformStyle: "preserve-3d" }}>
                  <div className="absolute inset-0" style={{ background: `${C.gold} / 0.35)`, border: `1px solid ${C.gold} / 0.7)` }} />
                  <div className="absolute" style={{
                    width: 8, left: "50%", marginLeft: -4,
                    height: mastH, top: 13 - mastH,
                    transform: "rotateX(-90deg)", transformOrigin: "bottom",
                    background: `repeating-linear-gradient(0deg, ${C.gold} / 0.95) 0 3px, ${C.gold} / 0.25) 3px 12px)`,
                  }} />
                  <div className="cs-slew absolute left-1/2 top-1/2" style={{
                    width: 210, height: 6, marginTop: -3,
                    transformStyle: "preserve-3d",
                    translate: `0 0 ${(floors + 3) * FLOOR_H}px`,
                    transformOrigin: "18px center",
                  }}>
                    <div className="absolute inset-y-0 left-[18px] right-0" style={{ background: `repeating-linear-gradient(90deg, ${C.goldBright} / 0.95) 0 10px, ${C.goldBright} / 0.3) 10px 20px)` }} />
                    <div className="absolute inset-y-0 left-0 w-[18px]" style={{ background: `${C.goldBright} / 0.8)` }} />
                    <div className="absolute" style={{
                      left: 162, top: 3, width: 1.5, height: 80,
                      transform: "rotateX(-90deg)", transformOrigin: "top",
                      background: `${C.tan} / 0.5)`,
                    }} />
                  </div>
                </div>

                {/* site crew and plaza trees */}
                <Person x={128} y={300} worker kind="worker" />
                <Person x={236} y={296} worker kind="worker" />
                <Person x={312} y={160} worker kind="worker" />
                <Tree x={60} y={130} height={50} grow />
                <Tree x={356} y={110} height={44} grow />
                <Tree x={396} y={300} height={54} grow />
              </World>
            </div>
          </div>

          {/* reasons rail */}
          <div className="relative min-h-[8.5rem] lg:min-h-0">
            <div className="lg:max-w-sm">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/45">
                Why choose Characom
              </p>
              <div className="relative mt-4 min-h-[7rem]" aria-live="polite">
                {reasons.map((reason, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 top-0 transition-opacity duration-300"
                    style={{ opacity: i === activeReason && built > 0 ? 1 : 0 }}
                    aria-hidden={i !== activeReason || built === 0}
                  >
                    <p className="font-display text-xl text-gold-bright">
                      Reason {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="font-display mt-1 text-2xl font-medium leading-snug md:text-3xl">
                      {reason.title}
                    </h3>
                    {reason.text ? (
                      <p className="mt-2 max-w-[38ch] text-sm text-plaster/65">{reason.text}</p>
                    ) : null}
                  </div>
                ))}
                <div
                  className="absolute inset-x-0 top-0 transition-opacity duration-300"
                  style={{ opacity: built === 0 ? 1 : 0 }}
                  aria-hidden={built > 0}
                >
                  <h3 className="font-display text-2xl font-medium leading-snug text-plaster/70 md:text-3xl">
                    {caption || "Scroll to raise the tower"}
                  </h3>
                </div>
              </div>
              {/* floor meter */}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-3xl font-medium tabular-nums text-gold-bright">
                  {built}
                  <span className="text-plaster/40"> / {floors}</span>
                </span>
                <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/50">
                  {built >= floors ? "Topping out" : "Floors"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cs-slew { animation: cs-slew 14s ease-in-out infinite alternate; }
        @keyframes cs-slew {
          from { transform: rotate(-24deg); }
          to { transform: rotate(38deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-slew { animation: none; transform: rotate(10deg); }
          [data-floor], [data-glow], [data-crane], [data-tree] { opacity: 1 !important; visibility: visible !important; }
          [data-scaffold], [data-worker] { opacity: 0 !important; }
        }
        html[data-reduced-motion="true"] .cs-slew { animation: none; transform: rotate(10deg); }
        html[data-reduced-motion="true"] [data-floor],
        html[data-reduced-motion="true"] [data-glow],
        html[data-reduced-motion="true"] [data-tree],
        html[data-reduced-motion="true"] [data-crane] { opacity: 1 !important; visibility: visible !important; }
      `}</style>
    </div>
  );
}
