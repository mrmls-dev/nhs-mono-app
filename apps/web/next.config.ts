import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@workspace/ui"],
    serverExternalPackages: ["mapbox-gl"],
};

export default nextConfig;
