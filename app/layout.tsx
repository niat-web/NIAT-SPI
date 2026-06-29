import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIAT SPI — Skill Performance Index",
  description: "Attendance, eligibility and Skill Performance Index for NIAT learners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
