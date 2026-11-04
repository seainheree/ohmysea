/**
 * Standar gerak UI ohmysea — satu sumber untuk semua animasi.
 * Aturan: 150–400 ms, kurva standar sama di semua tempat, hormati
 * `prefers-reduced-motion` (lihat app/globals.css).
 */
export type Kurva = [number, number, number, number];

/** Kurva standar (keluar cepat, masuk lembut). */
export const KURVA_STANDAR: Kurva = [0.22, 1, 0.36, 1];

export const DURASI = {
  kilat: 0.15,
  cepat: 0.22,
  sedang: 0.3,
  lambat: 0.4,
} as const;

export const TRANSISI = {
  kilat: { duration: DURASI.kilat, ease: KURVA_STANDAR },
  cepat: { duration: DURASI.cepat, ease: KURVA_STANDAR },
  sedang: { duration: DURASI.sedang, ease: KURVA_STANDAR },
  lambat: { duration: DURASI.lambat, ease: KURVA_STANDAR },
  pegas: { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.7 },
} as const;
