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
  icons: {
    icon: [
      { url: "/image/logo-32.png", sizes: "32x32", type: "image/png" },
      { url: "/image/logo-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/image/logo-48.png",
    apple: [{ url: "/image/logo-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1A26",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="flex min-h-dvh flex-col bg-bg-main font-sans text-teks antialiased">
        {children}
        <footer className="shrink-0 border-t border-border px-sedang py-sedang text-center text-xs text-teks-muted-2">
          <span className="font-display text-sm text-aksen-lembut">Ohmysea</span> By Sasha
        </footer>
      </body>
    </html>
  );
}
