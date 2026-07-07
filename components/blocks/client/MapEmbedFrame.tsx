"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lazily mounts the map iframe once it approaches the viewport, then fades
 * it in on load. A grayscale/invert/hue-rotate filter turns any standard
 * map embed into the site's ink-and-gold look without API styling.
 */
export default function MapEmbedFrame({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] w-full overflow-hidden bg-ink md:h-[520px]"
    >
      {!loaded && (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="kicker">Map loading</span>
        </div>
      )}
      {visible && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full border-0 transition-opacity duration-700"
          style={{
            opacity: loaded ? 1 : 0,
            filter:
              "grayscale(1) invert(0.92) hue-rotate(180deg) contrast(0.92) brightness(0.92)",
          }}
        />
      )}
    </div>
  );
}
