import type { NextConfig } from "next";

/**
 * Baseline security headers. Vercel adds HSTS itself. A full Content-Security-Policy is not set:
 * Next.js inline bootstrap scripts and Motion's inline styles would need nonces first.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
  // The store reads the SQL schema at runtime; make sure it ships in every server bundle.
  outputFileTracingIncludes: { "/*": ["db/schema.sql"] },
  headers() {
    return Promise.resolve([{ source: "/:path*", headers: securityHeaders }]);
  },
};

export default nextConfig;
