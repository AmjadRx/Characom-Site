import type { Metadata } from "next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Characom Group — Building Cyprus",
    template: "%s · Characom Group",
  },
  description:
    "Characom Group delivers government infrastructure, real estate development and residential construction across Cyprus.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
