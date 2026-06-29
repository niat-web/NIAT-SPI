import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://niat-spi.vercel.app";

// Only the public landing page is indexable. Dashboards and per-student SPI
// reports are private and intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
  ];
}
