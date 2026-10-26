import type { MetadataRoute } from "next";

// PWA manifest (PRD §7.6: mobile-first PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReWork",
    short_name: "ReWork",
    description: "Real take-home pay, 24/7 help in your language, and jobs near you.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ecdd",
    theme_color: "#142f3a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
