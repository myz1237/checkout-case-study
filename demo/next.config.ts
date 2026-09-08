import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root holds the Part 1 write-up as well; keep Turbopack scoped to this app.
  turbopack: { root: __dirname },
  agentRules: false,
};

export default nextConfig;
