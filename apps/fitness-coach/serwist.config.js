// Service worker build (ADR 004): `serwist build` runs after `next build` (Turbopack) and
// precaches .next/static, public/ and the prerendered pages (/, /routines, /exercises).
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});
