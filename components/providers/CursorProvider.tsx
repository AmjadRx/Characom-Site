"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/constants";
import { useReducedMotionPref } from "./ReducedMotionProvider";

/**
 * Custom cursor (ARCHITECTURE.md §3.4): a small gold dot plus a trailing
 * ring. Over elements marked `data-cursor="view"` the ring expands into a
 * gold disc with a label (from `data-cursor-label`, default "View").
 *
 * Desktop fine-pointer only; disabled on touch and under reduced motion.
 * Adds `has-custom-cursor` to <html> so globals.css can hide the native
 * cursor. The layer is aria-hidden and pointer-events-none — purely visual.
 */
export function CursorProvider({ children }: { children: React.ReactNode }) {
  const { reduced } = useReducedMotionPref();
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("View");

  const dotAnchorRef = useRef<HTMLDivElement>(null);
  const ringAnchorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const borderRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) {
      setActive(false);
      return;
    }
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const update = () => setActive(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduced]);

  useEffect(() => {
    if (!active) return;
    const dotAnchor = dotAnchorRef.current;
    const ringAnchor = ringAnchorRef.current;
    const dot = dotRef.current;
    const border = borderRef.current;
    const fill = fillRef.current;
    const labelEl = labelRef.current;
    if (!dotAnchor || !ringAnchor || !dot || !border || !fill || !labelEl) {
      return;
    }

    document.documentElement.classList.add("has-custom-cursor");

    let visible = false;
    // Dot tracks tightly; ring trails behind (fractions of DUR.fast).
    const dotX = gsap.quickTo(dotAnchor, "x", { duration: DUR.fast * 0.35, ease: EASE.out });
    const dotY = gsap.quickTo(dotAnchor, "y", { duration: DUR.fast * 0.35, ease: EASE.out });
    const ringX = gsap.quickTo(ringAnchor, "x", { duration: DUR.fast * 1.4, ease: EASE.out });
    const ringY = gsap.quickTo(ringAnchor, "y", { duration: DUR.fast * 1.4, ease: EASE.out });

    gsap.set([dotAnchor, ringAnchor], { opacity: 0 });
    gsap.set(fill, { scale: 0, opacity: 0 });
    gsap.set(labelEl, { opacity: 0 });

    const onMove = (event: MouseEvent) => {
      if (!visible) {
        visible = true;
        gsap.set([dotAnchor, ringAnchor], {
          x: event.clientX,
          y: event.clientY,
        });
        gsap.to([dotAnchor, ringAnchor], {
          opacity: 1,
          duration: DUR.fast * 0.66,
          ease: EASE.out,
          overwrite: "auto",
        });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    const expand = (nextLabel: string) => {
      setLabel(nextLabel);
      gsap.to(fill, { scale: 1, opacity: 0.95, duration: DUR.fast, ease: EASE.outHard, overwrite: "auto" });
      gsap.to(border, { scale: 1.15, opacity: 0, duration: DUR.fast, ease: EASE.out, overwrite: "auto" });
      gsap.to(labelEl, { opacity: 1, duration: DUR.fast, ease: EASE.out, overwrite: "auto" });
      gsap.to(dot, { scale: 0, duration: DUR.fast * 0.66, ease: EASE.out, overwrite: "auto" });
    };

    const collapse = () => {
      gsap.to(fill, { scale: 0, opacity: 0, duration: DUR.fast, ease: EASE.out, overwrite: "auto" });
      gsap.to(border, { scale: 1, opacity: 1, duration: DUR.fast, ease: EASE.out, overwrite: "auto" });
      gsap.to(labelEl, { opacity: 0, duration: DUR.fast * 0.5, ease: EASE.out, overwrite: "auto" });
      gsap.to(dot, { scale: 1, duration: DUR.fast * 0.66, ease: EASE.out, overwrite: "auto" });
    };

    const findTarget = (node: EventTarget | null): Element | null => {
      if (!(node instanceof Element)) return null;
      return node.closest('[data-cursor="view"]');
    };

    const onOver = (event: MouseEvent) => {
      const target = findTarget(event.target);
      if (target) {
        expand(target.getAttribute("data-cursor-label") || "View");
      }
    };

    const onOut = (event: MouseEvent) => {
      const target = findTarget(event.target);
      if (!target) {
        // Pointer left the viewport entirely → hide the cursor layer.
        if (event.relatedTarget === null) {
          visible = false;
          gsap.to([dotAnchor, ringAnchor], {
            opacity: 0,
            duration: DUR.fast * 0.66,
            ease: EASE.out,
            overwrite: "auto",
          });
        }
        return;
      }
      const related = event.relatedTarget;
      if (!(related instanceof Element) || !target.contains(related)) {
        collapse();
      }
      if (event.relatedTarget === null) {
        visible = false;
        gsap.to([dotAnchor, ringAnchor], {
          opacity: 0,
          duration: DUR.fast * 0.66,
          ease: EASE.out,
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      gsap.killTweensOf([dotAnchor, ringAnchor, dot, border, fill, labelEl]);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [active]);

  return (
    <>
      {children}
      {active && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
        >
          {/* Trailing ring (border → expanding gold disc with label) */}
          <div ref={ringAnchorRef} className="absolute left-0 top-0 h-0 w-0">
            <span
              ref={borderRef}
              className="absolute -ml-5 -mt-5 block h-10 w-10 rounded-full border border-gold/70"
            />
            <span
              ref={fillRef}
              className="absolute -ml-11 -mt-11 block h-22 w-22 rounded-full bg-gold"
            />
            <span
              ref={labelRef}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-ink"
            >
              {label}
            </span>
          </div>
          {/* Leading dot */}
          <div ref={dotAnchorRef} className="absolute left-0 top-0 h-0 w-0">
            <span
              ref={dotRef}
              className="absolute -ml-1 -mt-1 block h-2 w-2 rounded-full bg-gold"
            />
          </div>
        </div>
      )}
    </>
  );
}
