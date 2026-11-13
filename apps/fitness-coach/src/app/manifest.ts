import type { MetadataRoute } from "next";

/** PWA manifest (FR-14, AC-17). Colours are `color.bg` dark (ui_standards §2, UX Flow 2.8). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Coach",
    short_name: "My Coach",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#15130F",
    theme_color: "#15130F",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
