// Author: emrk-dev
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // knowledge_base.json is large — bundle it only server-side
  serverExternalPackages: [],
};

export default nextConfig;
