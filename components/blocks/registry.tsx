import type { ComponentType } from "react";
import type { BlockType } from "@/lib/blocks/defs";
import type { Section, ThemeColor } from "@/lib/content/types";
import { parseBlockProps } from "@/lib/blocks/defs";

import Hero from "./Hero";
import PageHero from "./PageHero";
import ConstructionScene from "./ConstructionScene";
import StatsCounters from "./StatsCounters";
import RichTextBlock from "./RichTextBlock";
import ImageWithText from "./ImageWithText";
import SectorCards from "./SectorCards";
import FeaturedProjects from "./FeaturedProjects";
import CategoryPanels from "./CategoryPanels";
import ProjectGrid from "./ProjectGrid";
import Timeline from "./Timeline";
import TeamGrid from "./TeamGrid";
import LogoWall from "./LogoWall";
import Testimonials from "./Testimonials";
import NewsList from "./NewsList";
import Faq from "./Faq";
import CtaBand from "./CtaBand";
import ContactMethods from "./ContactMethods";
import ContactForm from "./ContactForm";
import MapEmbed from "./MapEmbed";
import FileDownload from "./FileDownload";
import CareersList from "./CareersList";
import Spacer from "./Spacer";
import RawEmbed from "./RawEmbed";

/**
 * Rendering context passed to every block.
 *  - categorySlug/theme: set on portfolio category routes for theming + grids
 *  - pathname: current route (inquiry source, active states)
 */
export interface BlockContext {
  pathname: string;
  categorySlug?: string;
  theme?: ThemeColor;
}

/** Every block component: async server component taking parsed props + ctx. */
export interface BlockComponentProps {
  props: Record<string, unknown>;
  ctx: BlockContext;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCK_COMPONENTS: Record<BlockType, ComponentType<any>> = {
  hero: Hero,
  pageHero: PageHero,
  constructionScene: ConstructionScene,
  statsCounters: StatsCounters,
  richText: RichTextBlock,
  imageWithText: ImageWithText,
  sectorCards: SectorCards,
  featuredProjects: FeaturedProjects,
  categoryPanels: CategoryPanels,
  projectGrid: ProjectGrid,
  timeline: Timeline,
  teamGrid: TeamGrid,
  logoWall: LogoWall,
  testimonials: Testimonials,
  newsList: NewsList,
  faq: Faq,
  ctaBand: CtaBand,
  contactMethods: ContactMethods,
  contactForm: ContactForm,
  mapEmbed: MapEmbed,
  fileDownload: FileDownload,
  careersList: CareersList,
  spacer: Spacer,
  rawEmbed: RawEmbed,
};

/**
 * Renders an ordered list of sections. Invalid/unknown blocks are skipped
 * (never crash a live page because of a bad CMS row).
 */
export function BlockRenderer({
  sections,
  ctx,
}: {
  sections: Section[];
  ctx: BlockContext;
}) {
  return (
    <>
      {sections
        .filter((s) => s.visible !== false)
        .map((section) => {
          const Component =
            BLOCK_COMPONENTS[section.type as BlockType] ?? null;
          if (!Component) return null;
          const props = parseBlockProps(section.type, section.props);
          if (!props) return null;
          return <Component key={section.id} props={props} ctx={ctx} />;
        })}
    </>
  );
}
