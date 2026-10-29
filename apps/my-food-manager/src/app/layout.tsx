import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SyncStarter } from "@/components/layout/SyncStarter";

export const metadata: Metadata = {
  title: "My Food Manager",
  description: "Tus recetas, tu despensa y tu lista de la compra.",
  appleWebApp: { capable: true, title: "My Food Manager", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15130F" },
    { media: "(prefers-color-scheme: light)", color: "#FBF7F1" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">
        <SyncStarter />
        {children}
      </body>
    </html>
  );
}
