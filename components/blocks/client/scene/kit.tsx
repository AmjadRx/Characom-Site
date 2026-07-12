"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Shared primitives for the isometric CSS-3D construction scenes.
 * World space: a plane tilted rotateX(58deg) rotateZ(-42deg). Local coords on
 * the plane: x right, y down (world depth), +Z up out of the plane.
 * Every primitive is transform/opacity friendly for GSAP scrubbing.
 */

export const ISO_TILT = "rotateX(58deg) rotateZ(-42deg)";
/** inverse of the world tilt, used to make flat sprites face the camera */
export const BILLBOARD = "rotateZ(42deg) rotateX(-58deg)";

export const C = {
  gold: "rgb(196 160 82",
  goldBright: "rgb(227 197 124",
  ink: "rgb(10 10 13",
  tan: "rgb(237 230 217",
  purple: "rgb(70 38 92",
  green: "rgb(23 53 42",
};

export function World({
  size = 460,
  children,
  worldRef,
}: {
  size?: number;
  children: ReactNode;
  worldRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={worldRef}
      className="relative"
      style={{
        transformStyle: "preserve-3d",
        transform: ISO_TILT,
        width: size,
        height: size,
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(closest-side, ${C.tan} / 0.13), ${C.tan} / 0.045) 70%, transparent), repeating-linear-gradient(0deg, transparent 0 45px, ${C.tan} / 0.07) 45px 46px), repeating-linear-gradient(90deg, transparent 0 45px, ${C.tan} / 0.07) 45px 46px)`,
          border: `1px solid ${C.tan} / 0.12)`,
          boxShadow: `0 0 120px ${C.purple} / 0.45)`,
        }}
      />
      {children}
    </div>
  );
}

/** Soft elliptical contact shadow under a volume. */
export function SoftShadow({
  x,
  y,
  w,
  d,
  opacity = 0.5,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute"
      style={{
        left: x - w * 0.12,
        top: y - d * 0.12,
        width: w * 1.24,
        height: d * 1.24,
        background: `radial-gradient(closest-side, ${C.ink} / ${opacity}), transparent 72%)`,
        transform: "translateZ(0.5px)",
      }}
    />
  );
}

export interface VolumeProps {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  z?: number;
  topStyle?: CSSProperties;
  frontStyle?: CSSProperties;
  sideStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  dataAttr?: string;
}

/** A 3D box: top face + the two camera-facing walls. */
export function Volume({
  x,
  y,
  w,
  d,
  h,
  z = 0,
  topStyle,
  frontStyle,
  sideStyle,
  className,
  style,
  dataAttr,
}: VolumeProps) {
  const attrs = dataAttr ? { [dataAttr]: "" } : {};
  return (
    <div
      {...attrs}
      className={`absolute ${className ?? ""}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: d,
        transformStyle: "preserve-3d",
        transform: `translateZ(${z}px)`,
        ...style,
      }}
    >
      {/* top */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${C.ink} / 0.96), rgb(35 27 48 / 0.95))`,
          border: `1px solid ${C.gold} / 0.5)`,
          transform: `translateZ(${h}px)`,
          ...topStyle,
        }}
      />
      {/* front wall (bottom edge of the footprint) */}
      <div
        className="absolute left-0"
        style={{
          width: w,
          height: h,
          top: d - h,
          transform: "rotateX(-90deg)",
          transformOrigin: "bottom",
          background: `linear-gradient(180deg, ${C.gold} / 0.32), ${C.purple} / 0.30))`,
          borderInline: `1px solid ${C.gold} / 0.45)`,
          ...frontStyle,
        }}
      />
      {/* side wall (right edge) */}
      <div
        className="absolute top-0"
        style={{
          width: d,
          height: h,
          left: w,
          transform: "rotateX(-90deg) rotateY(90deg)",
          transformOrigin: "left bottom",
          background: `linear-gradient(180deg, ${C.goldBright} / 0.2), ${C.green} / 0.42))`,
          ...sideStyle,
        }}
      />
    </div>
  );
}

/** A camera-facing sprite standing on the plane at (x, y). */
export function Sprite({
  x,
  y,
  children,
  className,
  style,
  dataAttr,
}: {
  x: number;
  y: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  dataAttr?: string;
}) {
  const attrs = dataAttr ? { [dataAttr]: "" } : {};
  return (
    <div
      {...attrs}
      className={`absolute ${className ?? ""}`}
      style={{
        left: x,
        top: y,
        width: 0,
        height: 0,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div
        className="absolute"
        style={{
          transform: `${BILLBOARD}`,
          transformOrigin: "bottom center",
          bottom: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Stylised cypress tree (billboarded), grows via [data-grow] scaleY. */
export function Tree({
  x,
  y,
  height = 54,
  grow = false,
}: {
  x: number;
  y: number;
  height?: number;
  grow?: boolean;
}) {
  return (
    <Sprite x={x} y={y} dataAttr={grow ? "data-tree" : undefined}>
      <div
        className="relative"
        style={{
          width: height * 0.42,
          height,
          marginLeft: -(height * 0.21),
          transformOrigin: "bottom center",
        }}
      >
        {/* trunk */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 3,
            height: height * 0.22,
            marginLeft: -1.5,
            background: `${C.gold} / 0.55)`,
          }}
        />
        {/* foliage: layered cypress cone */}
        <div
          className="absolute left-1/2 bottom-[18%]"
          style={{
            width: height * 0.42,
            height: height * 0.86,
            marginLeft: -(height * 0.21),
            clipPath: "polygon(50% 0%, 88% 78%, 72% 76%, 92% 100%, 8% 100%, 28% 76%, 12% 78%)",
            background: `linear-gradient(180deg, rgb(46 94 70 / 0.95), ${C.green} / 0.95))`,
            boxShadow: `inset -6px 0 12px ${C.ink} / 0.4)`,
          }}
        />
      </div>
    </Sprite>
  );
}

/** Small billboarded person; workers get a gold hard hat. */
export function Person({
  x,
  y,
  worker = false,
  kind,
}: {
  x: number;
  y: number;
  worker?: boolean;
  kind: "worker" | "resident";
}) {
  return (
    <Sprite x={x} y={y} dataAttr={kind === "worker" ? "data-worker" : "data-resident"}>
      <div className="relative" style={{ width: 10, height: 24, marginLeft: -5 }}>
        {/* body */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 8,
            height: 15,
            marginLeft: -4,
            borderRadius: "4px 4px 2px 2px",
            background: worker
              ? `linear-gradient(180deg, ${C.goldBright} / 0.95), rgb(150 110 40 / 0.95))`
              : `linear-gradient(180deg, rgb(120 100 140 / 0.95), rgb(60 48 78 / 0.95))`,
          }}
        />
        {/* head */}
        <div
          className="absolute left-1/2"
          style={{
            width: 7,
            height: 7,
            bottom: 15,
            marginLeft: -3.5,
            borderRadius: "50%",
            background: `rgb(216 180 150 / 0.95)`,
          }}
        />
        {/* hard hat */}
        {worker ? (
          <div
            className="absolute left-1/2"
            style={{
              width: 8,
              height: 4,
              bottom: 20,
              marginLeft: -4,
              borderRadius: "4px 4px 0 0",
              background: `${C.goldBright} / 1)`,
            }}
          />
        ) : null}
      </div>
    </Sprite>
  );
}

/** Flat-bed truck driving on the plane (kept flat, reads well in iso). */
export function Truck({ x, y }: { x: number; y: number }) {
  return (
    <div
      data-truck
      className="absolute"
      style={{
        left: x,
        top: y,
        width: 64,
        height: 26,
        transformStyle: "preserve-3d",
      }}
    >
      <Volume
        x={0}
        y={0}
        w={40}
        d={22}
        h={10}
        topStyle={{ background: `${C.gold} / 0.5)`, border: `1px solid ${C.gold} / 0.8)` }}
        frontStyle={{ background: `${C.gold} / 0.35)` }}
        sideStyle={{ background: `${C.gold} / 0.28)` }}
      />
      <Volume
        x={42}
        y={2}
        w={16}
        d={18}
        h={14}
        topStyle={{ background: `${C.goldBright} / 0.75)`, border: `1px solid ${C.goldBright} / 0.9)` }}
        frontStyle={{ background: `${C.goldBright} / 0.5)` }}
        sideStyle={{ background: `${C.goldBright} / 0.4)` }}
      />
    </div>
  );
}

/** Excavator: tracked base, cab and a boom that pivots via [data-boom]. */
export function Excavator({ x, y }: { x: number; y: number }) {
  return (
    <div
      data-excavator
      className="absolute"
      style={{
        left: x,
        top: y,
        width: 60,
        height: 40,
        transformStyle: "preserve-3d",
      }}
    >
      <Volume
        x={0}
        y={6}
        w={34}
        d={26}
        h={8}
        topStyle={{ background: `${C.ink} / 0.9)`, border: `1px solid ${C.gold} / 0.6)` }}
        frontStyle={{ background: `${C.ink} / 0.85)` }}
        sideStyle={{ background: `${C.ink} / 0.8)` }}
      />
      <Volume
        x={4}
        y={10}
        w={20}
        d={18}
        h={16}
        z={8}
        topStyle={{ background: `${C.goldBright} / 0.8)` }}
        frontStyle={{ background: `${C.goldBright} / 0.55)` }}
        sideStyle={{ background: `${C.goldBright} / 0.45)` }}
      />
      {/* boom: flat arm pivoting in plan */}
      <div
        data-boom
        className="absolute"
        style={{
          left: 24,
          top: 16,
          width: 34,
          height: 5,
          transformOrigin: "left center",
          transform: "translateZ(18px) rotate(12deg)",
          background: `linear-gradient(90deg, ${C.goldBright} / 0.95), ${C.gold} / 0.7))`,
          borderRadius: 3,
        }}
      />
    </div>
  );
}

/** Scaffolding lattice hugging a wall; fades late in the build. */
export function Scaffold({
  x,
  y,
  w,
  h,
  side = "front",
  depthOffset = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  side?: "front" | "side";
  depthOffset?: number;
}) {
  const lattice = `repeating-linear-gradient(0deg, ${C.goldBright} / 0.5) 0 1.5px, transparent 1.5px 12px), repeating-linear-gradient(90deg, ${C.goldBright} / 0.5) 0 1.5px, transparent 1.5px 12px)`;
  return (
    <div
      data-scaffold
      className="absolute"
      style={
        side === "front"
          ? {
              left: x,
              top: y - h,
              width: w,
              height: h,
              transform: "rotateX(-90deg)",
              transformOrigin: "bottom",
              background: lattice,
            }
          : {
              left: x,
              top: y,
              width: w,
              height: h,
              transform: `rotateX(-90deg) rotateY(90deg) translateZ(${depthOffset}px)`,
              transformOrigin: "left bottom",
              background: lattice,
            }
      }
    />
  );
}
