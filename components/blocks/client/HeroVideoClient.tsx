"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useReducedMotionPref } from "@/components/providers";

/**
 * Hero background video: looping, muted, playsInline, with poster.
 * Pauses when off-screen or when the tab is hidden (§6.3). Under reduced
 * motion the video is replaced by its poster image entirely (§6.4).
 */

export default function HeroVideoClient({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { reduced } = useReducedMotionPref();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !document.hidden) {
          video.play().catch(() => {
            /* autoplay can be blocked — poster remains */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(video);

    const onVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (!src && !poster) return null;

  if (reduced || !src) {
    return poster ? (
      <div className={cn("overflow-hidden", className)}>
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    ) : null;
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster || undefined}
        className="h-full w-full object-cover"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src={src} />
      </video>
    </div>
  );
}
