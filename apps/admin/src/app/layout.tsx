import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { ThemeProvider } from "@ctps/ui/theme";
import { themeInitScript } from "@ctps/ui/theme-core";

import "./globals.css";

export const metadata: Metadata = {
  title: "CTPS Staff Administration",
  description: "Protected staff administration for CTPS Cleaning.",
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
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
