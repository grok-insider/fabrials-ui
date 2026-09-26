import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@fabrials/ui", "@fabrials/ai-ui"],
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      { source: "/examples", destination: "/playground", permanent: true },
    ];
  },
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
