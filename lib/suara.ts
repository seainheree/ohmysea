/**
 * Kirby bersuara: pembungkus tipis di atas Web Speech API bawaan browser.
 * Tanpa dependency dan tanpa file audio — kualitas suara mengikuti OS/pengguna.
 */

/** Ubah balasan markdown jadi teks yang enak didengar (tanpa penanda). */
export function teksUntukSuara(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // blok kode tidak dibacakan
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*([-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/gm, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

export function dukungSuara(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Suara Indonesia kalau ada, kalau tidak pakai suara pertama yang tersedia. */
function pilihSuara(): SpeechSynthesisVoice | null {
  const daftar = window.speechSynthesis.getVoices();
  if (daftar.length === 0) return null;
  return (
    daftar.find((v) => v.lang?.toLowerCase().startsWith("id")) ??
    daftar.find((v) => v.default) ??
    daftar[0] ??
    null
  );
}

/** Bacakan teks. `selesai` dipanggil saat selesai, dihentikan, atau gagal. */
export function bicarakan(teks: string, opsi: { selesai?: () => void } = {}): boolean {
  if (!dukungSuara() || !teks.trim()) return false;
  const suara = new SpeechSynthesisUtterance(teks);
  const pilihan = pilihSuara();
  if (pilihan) suara.voice = pilihan;
  suara.lang = pilihan?.lang ?? "id-ID";
  suara.rate = 1.02;
  suara.pitch = 1.12; // sedikit lebih tinggi supaya terdengar ceria seperti Kirby
  suara.onend = () => opsi.selesai?.();
  suara.onerror = () => opsi.selesai?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(suara);
  return true;
}

export function hentikanSuara(): void {
  if (dukungSuara()) window.speechSynthesis.cancel();
}
