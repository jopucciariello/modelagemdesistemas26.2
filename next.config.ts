import type { NextConfig } from "next";

// Security headers (docs/review/seguranca.md, S1).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // RF01: bike pictures up to 1 MB go through a server action.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // ADR-010, #67: the Expo web build (public/app, made in the Dockerfile) is served under /app until the
  // domain switch. Files in public/ win; any other /app/... path falls back to the single-page entry.
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: "/app/:path*", destination: "/app/index.html" }] };
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
