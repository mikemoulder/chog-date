import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // public/chogs/<id>.webp wins when present; anything missing is generated on demand.
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: "/chogs/:id", destination: "/api/img/:id" }] };
  },
  serverExternalPackages: ["@electric-sql/pglite", "sharp"],
  // Read from disk at runtime, so the tracer can't see them: ship them with every function.
  outputFileTracingIncludes: { "/**": ["./drizzle/**/*", "./data/personas.json"] },
};

export default nextConfig;
