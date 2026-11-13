import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The build type-checks app code only; tests are type-checked by `npm run typecheck`.
  typescript: { tsconfigPath: "tsconfig.build.json" },
};

export default nextConfig;
