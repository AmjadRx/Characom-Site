"use client";

import type { ReactNode } from "react";

export interface SceneHeader {
  kicker: string;
  heading: string;
  text: string;
}

/**
 * The single-viewport frame shared by both timelapse scenes: title block on
 * top, stage and reasons rail below. The whole frame is what gets pinned,
 * so the heading never scrolls away while the scene plays.
 */
export default function SceneFrame({
  header,
  stage,
  rail,
  stageRef,
}: {
  header: SceneHeader;
  stage: ReactNode;
  rail: ReactNode;
  stageRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="container-site flex min-h-[100svh] flex-col pt-[calc(var(--nav-h)+1.25rem)] pb-6 lg:h-[100svh]">
      {/* title block, always in frame */}
      <div className="shrink-0">
        {header.kicker ? (
          <p className="mb-3">
            <span className="kicker kicker--accent">{header.kicker}</span>
          </p>
        ) : null}
        {header.heading ? (
          <h2 className="font-display max-w-3xl text-[clamp(1.75rem,1rem+2.6vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.005em]">
            {header.heading}
          </h2>
        ) : null}
        {header.text ? (
          <p className="mt-3 max-w-[62ch] text-sm text-plaster/65 md:text-base">
            {header.text}
          </p>
        ) : null}
      </div>

      {/* stage + rail share the remaining height */}
      <div className="grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div
          ref={stageRef}
          className="relative flex h-full min-h-[320px] items-center justify-center"
        >
          {stage}
        </div>
        <div className="relative pb-2 lg:pb-0">{rail}</div>
      </div>
    </div>
  );
}
