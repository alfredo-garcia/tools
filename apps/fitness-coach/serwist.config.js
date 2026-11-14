// Service worker build (ADR 004): `serwist build` runs after `next build` (Turbopack) and
// precaches .next/static (fonts included), public/ and the prerendered pages (/, /routines,
// /routines/detail, /exercises).
import { generateGlobPatterns, serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // The defaults leave out fonts; FR-15 needs them (Inter, served from .next/static/media).
  globPatterns: [...generateGlobPatterns(".next/"), ".next/static/media/*.woff2"],
});
