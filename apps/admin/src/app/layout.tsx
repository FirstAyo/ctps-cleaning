import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@ctps/ui/theme";
import { themeInitScript } from "@ctps/ui/theme-core";

import "./globals.css";

export const metadata: Metadata = {
  title: "CTPS Admin — Design Foundation",
  description: "Unprotected Phase 2 admin design-system demonstration.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
