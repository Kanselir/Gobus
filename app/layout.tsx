import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suroboyo Bus Navigator – Gobis Surabaya Route Finder",
  description:
    "Temukan rute Suroboyo Bus terpendek dengan algoritma Dijkstra. Navigasi cerdas bus kota Surabaya.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
