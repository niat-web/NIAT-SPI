import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://niat-spi.vercel.app";
const DESCRIPTION =
  "Attendance, eligibility and the Skill Performance Index (SPI) for NIAT learners — a 0–10 skill score tracking learning, assessments and skill-readiness.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "NIAT SPI — Skill Performance Index",
    template: "%s · NIAT SPI",
  },
  description: DESCRIPTION,
  applicationName: "NIAT SPI",
  keywords: ["NIAT", "SPI", "Skill Performance Index", "attendance", "eligibility", "NxtWave", "student dashboard"],
  authors: [{ name: "NIAT" }],
  creator: "NIAT",
  openGraph: {
    type: "website",
    siteName: "NIAT SPI",
    title: "NIAT SPI — Skill Performance Index",
    description: DESCRIPTION,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "NIAT SPI — Skill Performance Index",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F25C05",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
