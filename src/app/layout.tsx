// Thesis: a dating app where the NFT is the one dating, and the date trades like a chart.
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { MOTION_BOOT, MotionRoot } from "@/components/motion";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/states";
import "./globals.css";

const sans = Bricolage_Grotesque({ variable: "--font-brand-sans", subsets: ["latin"], weight: ["400", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-brand-mono", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Chog Date",
  description: "Your Chog is single. A dating app where Chog Genesis NFTs swipe, flirt and fall in love in character.",
};

export const viewport: Viewport = { themeColor: "#f4efe4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <MotionRoot />
      </body>
    </html>
  );
}
