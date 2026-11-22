/**
 * Waktu relatif singkat untuk daftar percakapan.
 * "baru saja" · "5 mnt" · "3 jm" · "2 hr" · lalu "12 Nov".
 */
export function waktuRelatif(iso: string, sekarang: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";

  const detik = Math.round((sekarang.getTime() - t) / 1000);
  if (detik < 60) return "baru saja";

  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} mnt`;

  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jm`;

  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hr`;

  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}