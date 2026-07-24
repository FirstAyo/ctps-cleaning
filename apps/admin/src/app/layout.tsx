import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@ctps/ui/theme";
import { themeInitScript } from "@ctps/ui/theme-core";

import "./globals.css";

export const metadata: Metadata = {
  title: "CTPS Staff Administration",
  description: "Protected staff administration for CTPS Cleaning.",
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
