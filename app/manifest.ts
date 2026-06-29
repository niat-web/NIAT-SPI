import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NIAT SPI — Skill Performance Index",
    short_name: "NIAT SPI",
    description: "Attendance, eligibility and Skill Performance Index for NIAT learners.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fa",
    theme_color: "#F25C05",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
