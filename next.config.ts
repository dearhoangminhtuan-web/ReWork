import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // PGlite ships a wasm Postgres; keep it out of the bundler.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    serverActions: { bodySizeLimit: "8mb" }, // job-offer photos
  },
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
