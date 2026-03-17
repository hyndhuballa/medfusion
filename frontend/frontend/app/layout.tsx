import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedFusion Surveillance Hub",
  description: "Integrated Disease Intelligence Platform — Real-time epidemiological surveillance console",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
