import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { ThemeProvider } from "@ctps/ui/theme";
import { themeInitScript } from "@ctps/ui/theme-core";

import "./globals.css";
import { publicIndexingEnabled, site } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "CTPS | Property Care",
  description:
    "Residential and commercial property-care services across Vancouver and surrounding communities.",
  robots: { index: publicIndexingEnabled, follow: publicIndexingEnabled },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="ctps-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
