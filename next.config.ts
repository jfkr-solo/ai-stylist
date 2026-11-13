import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage の公開URLを next/image で扱う場合に備えて許可
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
