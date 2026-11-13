import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SyncProvider } from "@/lib/sync/provider";
import { AppGate } from "./_screens/AppGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "My Coach",
  applicationName: "My Coach",
  appleWebApp: { capable: true, title: "My Coach", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15130F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <SyncProvider>
          <AppGate>{children}</AppGate>
        </SyncProvider>
      </body>
    </html>
  );
}
