import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // The placeholder sections open offline even if never visited.
  additionalPrecacheEntries: ["/plan", "/ingredients", "/profile"].map((url) => ({
    url,
    revision: crypto.randomUUID(),
  })),
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
