import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SerwistProvider } from "@serwist/next/react";
import { SyncProvider } from "@/lib/sync/provider";
import { AppGate } from "./_screens/AppGate";
import { COLOR_BG_DARK, COLOR_BG_LIGHT } from "./brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "My Coach",
  applicationName: "My Coach",
  appleWebApp: { capable: true, title: "My Coach", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: COLOR_BG_DARK },
    { media: "(prefers-color-scheme: light)", color: COLOR_BG_LIGHT },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {/* FR-15: the app decides when to refresh (FR-6), so never reload when the network returns */}
        <SerwistProvider
          swUrl="/sw.js"
          disable={process.env.NODE_ENV === "development"}
          reloadOnOnline={false}
        >
          <SyncProvider>
            <AppGate>{children}</AppGate>
          </SyncProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
