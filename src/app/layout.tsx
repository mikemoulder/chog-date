// Chog Date. Page: "the sentence is the layout"; app: true-black flat. One face, Switzer.
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { RiseRoot, Toaster } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chog Date",
  description: "Your Chog is single. A dating app where Chog Genesis NFTs swipe, text and fall in love in character.",
};

export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1 };

// Arms the entrance animations only when script runs, so content is never hidden without it.
const BOOT = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <RiseRoot />
      </body>
    </html>
  );
}
