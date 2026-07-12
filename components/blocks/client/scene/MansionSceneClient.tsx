"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/constants";
import { useReducedMotionPref } from "@/components/providers";
import SceneFrame, { type SceneHeader } from "./SceneFrame";
import type { Reason } from "./TowerSceneClient";
import {
  C,
  Excavator,
  Person,
  Scaffold,
  SoftShadow,
  Tree,
  Truck,
  Volume,
  World,
} from "./kit";

/**
 * Residential mansion timelapse: crew and vehicles arrive, the villa rises
 * behind scaffolding, the pool fills, trees grow, the crew leaves and the
 * family arrives. Four company-background reasons reveal with the phases.
 * The whole frame (title included) is pinned for exactly two extra screens,
 * so the section always spans three whole viewports on desktop.
 */

const PHASES = ["Breaking ground", "Structure rising", "Finishing touches", "Welcome home"];

export default function MansionSceneClient({
  caption,
  reasons,
  header,
}: {
  caption: string;
  reasons: Reason[];
  header: SceneHeader;
}) {
  const { reduced } = useReducedMotionPref();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState(0);

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
    const s = Math.min(1, (sr.width - 24) / (maxX - minX), (sr.height - 12) / (maxY - minY));
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
      setPhase(3);
      return;
    }
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const q = (sel: string) => root.querySelectorAll(sel);
      const pinned = window.matchMedia("(min-width: 1024px)").matches;

      gsap.set(q("[data-b]"), { autoAlpha: 0, z: 36 });
      gsap.set(q("[data-scaffold]"), { autoAlpha: 0 });
      gsap.set(q("[data-tree]"), { scaleY: 0.05, autoAlpha: 0, transformOrigin: "bottom center" });
      gsap.set(q("[data-worker],[data-resident]"), { autoAlpha: 0 });
      gsap.set(q("[data-glass]"), { autoAlpha: 0 });
      gsap.set("[data-truck]", { x: -260, y: 40, autoAlpha: 0 });
      gsap.set("[data-excavator]", { x: 300, y: 60, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: EASE.out, duration: 0.8 },
        scrollTrigger: pinned
          ? // exactly two extra screens: the section spans 3 whole viewports
            { trigger: root, start: "top top", end: "+=200%", pin: true, scrub: 0.6 }
          : { trigger: root, start: "top 70%", end: "bottom 40%", scrub: 0.6 },
        onUpdate: () => {
          const p = tl.progress();
          setPhase(p > 0.86 ? 3 : p > 0.55 ? 2 : p > 0.18 ? 1 : 0);
        },
      });

      tl.to("[data-truck]", { x: 0, y: 0, autoAlpha: 1, duration: 1 }, 0);
      tl.to("[data-excavator]", { x: 0, y: 0, autoAlpha: 1, duration: 1 }, 0.15);
      tl.to(q("[data-worker]"), { autoAlpha: 1, stagger: 0.12, duration: 0.4 }, 0.9);
      tl.to(q("[data-scaffold]"), { autoAlpha: 1, duration: 0.6 }, 1.1);

      const order = ["slab", "a1", "b", "a2", "c", "deck", "pool"];
      order.forEach((k, i) => {
        tl.to(q(`[data-b="${k}"]`), { autoAlpha: 1, z: 0, duration: 0.9 }, 1.2 + i * 0.75);
      });

      tl.to("[data-boom]", {
        rotate: 46,
        duration: 0.5,
        repeat: 7,
        yoyo: true,
        ease: "sine.inOut",
      }, 1.2);

      tl.to(q("[data-tree]"), { scaleY: 1, autoAlpha: 1, stagger: 0.18, duration: 0.9 }, 6.4);
      tl.to(q("[data-scaffold]"), { autoAlpha: 0, duration: 0.7 }, 7.2);
      tl.to(q("[data-worker]"), { autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 7.6);
      tl.to("[data-excavator]", { x: 320, y: 70, autoAlpha: 0, duration: 1 }, 7.8);
      tl.to("[data-truck]", { x: -280, y: 50, autoAlpha: 0, duration: 1 }, 7.9);
      tl.to(q("[data-glass]"), { autoAlpha: 1, duration: 0.8 }, 8.4);
      tl.to(q("[data-resident]"), { autoAlpha: 1, stagger: 0.15, duration: 0.5 }, 8.8);

      requestAnimationFrame(fit);
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const glass = (w: number, h: number) => ({
    background: `linear-gradient(180deg, ${C.goldBright} / 0.5), ${C.gold} / 0.22))`,
    boxShadow: `0 0 18px ${C.goldBright} / 0.35)`,
    width: w,
    height: h,
  });

  const activeReason = Math.min(phase, Math.max(0, reasons.length - 1));

  const stage = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(45% 40% at 50% 58%, ${C.purple} / 0.5), transparent 75%)` }}
      />
      <div
        ref={scaleRef}
        style={{ transformOrigin: "center center" }}
        role="img"
        aria-label="Animated scene: a residential mansion is built, trees grow, the construction crew leaves and a family arrives"
      >
        <World size={460}>
          <div
            className="absolute"
            style={{
              left: 20, top: 288, width: 150, height: 46,
              background: `${C.tan} / 0.1)`,
              border: `1px solid ${C.tan} / 0.16)`,
            }}
          />
          <SoftShadow x={140} y={150} w={210} d={160} opacity={0.45} />

          <Volume x={132} y={144} w={220} d={170} h={4}
            topStyle={{ background: `${C.gold} / 0.16)`, border: `1px solid ${C.gold} / 0.4)` }}
            frontStyle={{ background: `${C.gold} / 0.2)` }} sideStyle={{ background: `${C.gold} / 0.14)` }} />
          <div data-b="slab" className="absolute" style={{ left: 0, top: 0, width: 0, height: 0 }} />

          <div data-b="a1" className="absolute" style={{ left: 150, top: 150, width: 150, height: 110, transformStyle: "preserve-3d" }}>
            <Volume x={0} y={0} w={150} d={110} h={26}
              frontStyle={{
                background: `linear-gradient(180deg, ${C.gold} / 0.34), ${C.purple} / 0.3)), repeating-linear-gradient(90deg, transparent 0 18px, ${C.ink} / 0.5) 18px 21px)`,
              }}
              sideStyle={{
                background: `linear-gradient(180deg, ${C.goldBright} / 0.22), ${C.green} / 0.4)), repeating-linear-gradient(90deg, transparent 0 16px, ${C.ink} / 0.45) 16px 19px)`,
              }}
            />
            <div data-glass className="absolute" style={{ top: 110 - 22, left: 12, transform: "rotateX(-90deg) translateZ(1px)", transformOrigin: "bottom", ...glass(126, 18) }} />
          </div>

          <div data-b="b" className="absolute" style={{ left: 96, top: 186, width: 56, height: 76, transformStyle: "preserve-3d" }}>
            <Volume x={0} y={0} w={56} d={76} h={22}
              topStyle={{ background: `linear-gradient(135deg, rgb(30 24 40 / 0.97), rgb(45 34 60 / 0.95))` }} />
            <div data-glass className="absolute" style={{ top: 76 - 18, left: 18, transform: "rotateX(-90deg) translateZ(1px)", transformOrigin: "bottom", ...glass(22, 15) }} />
          </div>

          <div data-b="a2" className="absolute" style={{ left: 150, top: 150, width: 150, height: 110, transformStyle: "preserve-3d", transform: "translateZ(26px)" }}>
            <Volume x={0} y={0} w={150} d={110} h={26}
              frontStyle={{
                background: `linear-gradient(180deg, ${C.goldBright} / 0.28), ${C.purple} / 0.26)), repeating-linear-gradient(90deg, transparent 0 22px, ${C.ink} / 0.5) 22px 25px)`,
              }}
            />
            <div data-glass className="absolute" style={{ top: 110 - 22, left: 10, transform: "rotateX(-90deg) translateZ(1px)", transformOrigin: "bottom", ...glass(130, 18) }} />
          </div>

          <div data-b="c" className="absolute" style={{ left: 170, top: 162, width: 92, height: 70, transformStyle: "preserve-3d", transform: "translateZ(52px)" }}>
            <Volume x={0} y={0} w={92} d={70} h={20}
              topStyle={{ background: `linear-gradient(135deg, ${C.goldBright} / 0.9), ${C.gold} / 0.7))`, border: `1px solid ${C.goldBright} / 0.9)` }} />
          </div>

          <div data-b="deck" className="absolute" style={{ left: 306, top: 180, width: 96, height: 96 }}>
            <div className="absolute inset-0" style={{ background: `${C.tan} / 0.12)`, border: `1px solid ${C.tan} / 0.2)`, transform: "translateZ(3px)" }} />
          </div>
          <div data-b="pool" className="absolute" style={{ left: 318, top: 196, width: 72, height: 48 }}>
            <div className="absolute inset-0" style={{
              transform: "translateZ(4px)",
              background: "linear-gradient(135deg, rgb(90 160 170 / 0.75), rgb(40 90 110 / 0.8))",
              boxShadow: "inset 0 0 14px rgb(10 10 13 / 0.5), 0 0 22px rgb(90 160 170 / 0.3)",
              border: `1px solid ${C.tan} / 0.35)`,
            }} />
          </div>

          <Scaffold x={146} y={264} w={158} h={56} side="front" />
          <Scaffold x={300} y={150} w={114} h={56} side="side" />

          <Tree x={70} y={128} height={58} grow />
          <Tree x={330} y={116} height={48} grow />
          <Tree x={412} y={250} height={62} grow />
          <Tree x={372} y={330} height={50} grow />
          <Tree x={120} y={392} height={56} grow />
          <Tree x={44} y={210} height={44} grow />

          <Person x={140} y={300} worker kind="worker" />
          <Person x={230} y={286} worker kind="worker" />
          <Person x={318} y={168} worker kind="worker" />
          <Person x={196} y={140} worker kind="worker" />
          <Person x={128} y={276} kind="resident" />
          <Person x={142} y={286} kind="resident" />
          <Person x={344} y={258} kind="resident" />

          <Truck x={30} y={296} />
          <Excavator x={252} y={294} />
        </World>
      </div>
    </>
  );

  const rail = (
    <div className="lg:max-w-sm">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/45">
        Built on Cypriot roots
      </p>
      <div className="relative mt-4 min-h-[7.5rem]" aria-live="polite">
        {reasons.map((reason, i) => (
          <div
            key={i}
            className="absolute inset-x-0 top-0 transition-opacity duration-300"
            style={{ opacity: i === activeReason ? 1 : 0 }}
            aria-hidden={i !== activeReason}
          >
            <p className="font-display text-xl text-gold-bright">
              {String(i + 1).padStart(2, "0")} · {PHASES[Math.min(i, PHASES.length - 1)]}
            </p>
            <h3 className="font-display mt-1 text-2xl font-medium leading-snug md:text-3xl">
              {reason.title}
            </h3>
            {reason.text ? (
              <p className="mt-2 max-w-[38ch] text-sm text-plaster/65">{reason.text}</p>
            ) : null}
          </div>
        ))}
        {reasons.length === 0 ? (
          <h3 className="font-display text-2xl font-medium leading-snug text-plaster/70">
            {PHASES[phase]}
          </h3>
        ) : null}
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-3xl font-medium tabular-nums text-gold-bright">
          {String(phase + 1).padStart(2, "0")}
          <span className="text-plaster/40"> / 04</span>
        </span>
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/50">
          {PHASES[phase]}
        </span>
      </div>
      {caption ? (
        <p className="mt-3 text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-plaster/35">
          {caption}
        </p>
      ) : null}
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      <SceneFrame header={header} stage={stage} rail={rail} stageRef={stageRef} />
    </div>
  );
}
