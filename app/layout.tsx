import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

// DM Sans = seluruh teks antarmuka. Instrument Serif = hanya elemen dekoratif
// (wordmark, hero, kata yang ditonjolkan). Lihat docs/DESIGN.md §3.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ohmysea",
  description: "Chatbot pribadi dengan RAG sederhana, mode curhat, dan generator gambar.",
};

export const viewport: Viewport = {
  themeColor: "#1A1A26",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-dvh bg-bg-main font-sans text-teks antialiased">{children}</body>
    </html>
  );
}
