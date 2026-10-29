import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Food Manager",
    short_name: "My Food Manager",
    description: "Tus recetas, tu despensa y tu lista de la compra.",
    start_url: "/",
    display: "standalone",
    background_color: "#15130F",
    theme_color: "#15130F",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
