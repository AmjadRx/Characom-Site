/**
 * Layout shell barrel (CONTRACTS.md — "Layout").
 * NavLink and FooterClient are internal helpers and intentionally not
 * exported. CookieBanner lives in this directory but is owned by the
 * pages agent and is imported directly, not through this barrel.
 */

export { default as SiteHeader } from "./SiteHeader";
export type { SiteHeaderProps } from "./SiteHeader";

export { default as FullscreenMenu } from "./FullscreenMenu";
export type { FullscreenMenuProps } from "./FullscreenMenu";

export { default as SiteFooter } from "./SiteFooter";
export type { SiteFooterProps } from "./SiteFooter";

export { default as Preloader } from "./Preloader";
export type { PreloaderProps } from "./Preloader";
