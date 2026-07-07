import Link from "next/link";
import type { BlockComponentProps } from "@/components/blocks/registry";
import type { LinkProps } from "@/lib/blocks/defs";
import { getSettings } from "@/lib/content";
import { cn } from "@/lib/utils";
import { KenBurns, MorphButton, Reveal, SplitTextReveal } from "@/components/motion";
import HeroContentClient from "./client/HeroContentClient";
import HeroParticlesClient from "./client/HeroParticlesClient";
import HeroVideoClient from "./client/HeroVideoClient";

/**
 * Cinematic 100vh hero (ARCHITECTURE.md §5.1.1). Background media is either
 * a gold particle canvas, a looping muted video, or a Ken Burns image; a
 * left-to-right ink scrim keeps the left half as negative space for the
 * kicker + display-1 split-text headline + CTAs. Content parallaxes up at
 * 0.85x and fades on scroll; pulsing SCROLL cue bottom-left.
 */

type HeroProps = {
  kicker: string;
  headline: string;
  subheadline: string;
  buttons: LinkProps[];
  media: {
    mode: "particles" | "video" | "image";
    videoSrc: string;
    posterSrc: string;
    image: { src: string; alt: string };
  };
  showScrollCue: boolean;
};

export default async function Hero({ props }: BlockComponentProps) {
  const p = props as unknown as HeroProps;
  const settings = await getSettings();

  const media = p.media ?? {
    mode: "particles" as const,
    videoSrc: "",
    posterSrc: "",
    image: { src: "", alt: "" },
  };

  let mode = media.mode;
  let videoSrc = media.videoSrc;
  let posterSrc = media.posterSrc;

  // Particles/video with empty props defer to the site-settings hero media
  // toggle (admin-controlled, CONTRACTS.md).
  if ((mode === "particles" || mode === "video") && !videoSrc) {
    if (settings.heroMedia.mode === "video" && settings.heroMedia.videoSrc) {
      mode = "video";
      videoSrc = settings.heroMedia.videoSrc;
      posterSrc = posterSrc || settings.heroMedia.posterSrc || "";
    } else if (mode === "video") {
      // Video requested but no source anywhere — degrade to particles.
      mode = "particles";
    }
  }
  if (mode === "image" && !media.image?.src) mode = "particles";

  const buttons = (p.buttons ?? []).filter((b) => b.label && b.href);

  return (
    <section
      data-nav-theme="dark"
      className="section-dark on-dark relative flex min-h-svh items-center overflow-hidden"
    >
      {/* Background media layer */}
      <div
        className="absolute inset-0"
        aria-hidden={mode === "image" ? undefined : true}
      >
        {mode === "particles" ? (
          <>
            <div className="gold-mesh absolute inset-0" />
            <HeroParticlesClient className="absolute inset-0 h-full w-full" />
          </>
        ) : null}
        {mode === "video" ? (
          <HeroVideoClient
            src={videoSrc}
            poster={posterSrc}
            className="absolute inset-0"
          />
        ) : null}
        {mode === "image" ? (
          <KenBurns
            src={media.image.src}
            alt={media.image.alt}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full"
          />
        ) : null}
        {/* Left-to-right ink gradient scrim — typography negative space */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(14,18,22,0.92) 0%, rgba(14,18,22,0.72) 38%, rgba(14,18,22,0.25) 68%, rgba(14,18,22,0.45) 100%)",
          }}
        />
      </div>

      {/* Foreground content — parallax + fade handled by the client wrapper */}
      <HeroContentClient
        showScrollCue={p.showScrollCue !== false}
        className="flex w-full items-center self-stretch"
      >
        <div className="container-site w-full">
          <div className="max-w-3xl py-[calc(var(--nav-h)+2rem)]">
            {p.kicker ? (
              <Reveal variant="fade" as="p" className="mb-6">
                <span className="kicker kicker--accent">{p.kicker}</span>
              </Reveal>
            ) : null}
            {p.headline ? (
              <SplitTextReveal
                text={p.headline}
                as="h1"
                className="text-display-1"
              />
            ) : null}
            {p.subheadline ? (
              <Reveal
                variant="fade"
                as="p"
                delay={0.3}
                className="mt-6 max-w-[46ch] text-lg text-plaster/75 md:text-xl"
              >
                {p.subheadline}
              </Reveal>
            ) : null}
            {buttons.length > 0 ? (
              <Reveal
                variant="fade"
                delay={0.45}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                {buttons.map((button, i) =>
                  button.variant === "text" ? (
                    <Link
                      key={i}
                      href={button.href}
                      className="link-underline font-medium text-gold-bright"
                    >
                      {button.label}
                    </Link>
                  ) : (
                    <MorphButton
                      key={i}
                      label={button.label}
                      href={button.href}
                      variant={button.variant === "ghost" ? "ghost" : "gold"}
                      dark
                    />
                  ),
                )}
              </Reveal>
            ) : null}
          </div>
        </div>
      </HeroContentClient>
    </section>
  );
}
