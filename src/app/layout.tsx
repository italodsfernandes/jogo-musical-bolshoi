import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/app-providers";
import { BRAND_NAME, SITE_NAME } from "@/lib/site";

import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: `${SITE_NAME} | ${BRAND_NAME}`,
  description:
    "Quiz musical lúdico do Piano Day com ranking, card compartilhável e acesso por matrícula.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${displayFont.variable} ${uiFont.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
