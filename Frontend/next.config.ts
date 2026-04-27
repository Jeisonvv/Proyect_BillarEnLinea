import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

function getApiRemotePattern() {
  try {
    const url = new URL(apiBaseUrl);

    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/**",
    };
  } catch {
    return {
      protocol: "http" as const,
      hostname: "localhost",
      port: "3001",
      pathname: "/**",
    };
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [getApiRemotePattern()],
  },
};

export default nextConfig;
