import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const defaultImageHosts = ["https://res.cloudinary.com"];
const extraImageHosts = process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS ?? "";
const extraDevOrigins = process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS ?? "";
const defaultDevOrigins = ["scalding-imprecise-emcee.ngrok-free.dev", "192.168.10.10"];

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

function createRemotePattern(rawUrl: string): RemotePattern | null {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return null;
  }

  const normalizedUrl = trimmedUrl.includes("://")
    ? trimmedUrl
    : `${trimmedUrl.startsWith("localhost") || trimmedUrl.startsWith("127.0.0.1") ? "http" : "https"}://${trimmedUrl}`;

  try {
    const url = new URL(normalizedUrl);

    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

function getApiRemotePattern() {
  return createRemotePattern(apiBaseUrl) ?? {
    protocol: "http" as const,
    hostname: "localhost",
    port: "3001",
    pathname: "/**",
  };
}

function getExtraRemotePatterns() {
  const seen = new Set<string>();

  return [...defaultImageHosts, ...extraImageHosts.split(",")]
    .map((host) => createRemotePattern(host))
    .filter((pattern): pattern is RemotePattern => pattern !== null)
    .filter((pattern) => {
      const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port}${pattern.pathname}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function getAllowedDevOrigins() {
  return [...defaultDevOrigins, ...extraDevOrigins.split(",")]
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin, index, array) => array.indexOf(origin) === index);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  images: {
    remotePatterns: [getApiRemotePattern(), ...getExtraRemotePatterns()],
  },
};

export default nextConfig;
