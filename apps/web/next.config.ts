import type { NextConfig } from "next";

// Platform asset CDN (Cloudflare R2) serving agent logos + community imagery.
// Optimized `next/image` requires the host to be whitelisted. Override with
// NEXT_PUBLIC_CDN_HOST per environment; defaults to the production CDN.
const cdnHost =
    process.env.NEXT_PUBLIC_CDN_HOST ?? "cdn.nationalhousesearch.com";

const nextConfig: NextConfig = {
    transpilePackages: ["@workspace/ui"],
    serverExternalPackages: ["mapbox-gl"],
    images: {
        remotePatterns: [{ protocol: "https", hostname: cdnHost }],
    },
};

export default nextConfig;
