import { Cormorant_Garamond, Jost } from "next/font/google";

/**
 * Luxury pairing (à la Emaar's Optima-led identity / DAMAC's serif displays):
 * a high-contrast garalde serif for display type, a refined geometric sans
 * for UI and body. Loaded via next/font — self-hosted, zero layout shift.
 */

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});
