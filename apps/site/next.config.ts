import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@fabrials/ui", "@fabrials/ai-ui"],
  // Docs read these at build time and for any route rendered on demand.
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*", "./content/**/*", "../../DESIGN.md"],
  },
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      { source: "/examples", destination: "/playground", permanent: true },
      { source: "/docs", destination: "/docs/introduction", permanent: false },
    ];
  },
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
