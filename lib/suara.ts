/**
 * Kirby bersuara: pembungkus tipis di atas Web Speech API bawaan browser.
 * Tanpa dependency dan tanpa file audio — kualitas suara mengikuti OS/pengguna.
 *
 * Supaya tidak terdengar seperti robot:
 * - voice dipilih dengan skor (utamakan yang "Natural"/"Neural"/"Online" & id-ID),
 *   bukan voice pertama yang kebetulan terdaftar;
 * - daftar voice ditunggu dulu (`voiceschanged`) karena Chrome mengisinya async,
 *   dan klik pertama sering jatuh ke voice default yang paling kaku;
 * - teks dipecah per kalimat supaya intonasi tidak datar di paragraf panjang;
 * - emoji/kaomoji dibuang sebelum dibaca.
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
    .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, " ") // emoji
    .replace(/\s+/g, " ")
    .trim();
}

export function dukungSuara(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Skor voice: makin tinggi makin enak didengar. Diekspor supaya bisa diuji. */
export function skorSuara(
  v: { lang?: string; name?: string; localService?: boolean },
  bahasa: Bahasa = "id",
): number {
  let skor = 0;
  if (v.lang?.toLowerCase().startsWith(bahasa)) skor += 100;
  if (/natural|neural/i.test(v.name ?? "")) skor += 40;
  if (/online/i.test(v.name ?? "")) skor += 20;
  if (/google/i.test(v.name ?? "")) skor += 15;
  if (/gadis|damayanti|andika|ardi/i.test(v.name ?? "")) skor += 10;
  if (v.localService) skor += 2; // lokal lebih responsif, tapi kalah dari yang natural
  return skor;
}

/** Voice terbaik untuk bahasa tertentu (kalau tidak ada, pakai yang terbaik apa pun). */
function pilihSuara(daftar: SpeechSynthesisVoice[], bahasa: Bahasa): SpeechSynthesisVoice | null {
  let terbaik: SpeechSynthesisVoice | null = null;
  let skorTerbaik = -1;
  for (const v of daftar) {
    const s = skorSuara(v, bahasa);
    if (s > skorTerbaik) {
      terbaik = v;
      skorTerbaik = s;
    }
  }
  return terbaik;
}

/**
 * Pecah teks jadi potongan kalimat (maks `maks` karakter) supaya tiap potongan
 * punya intonasi sendiri. Kalimat pendek tetap terpisah; kalimat kepanjangan
 * dipecah lagi di koma/spasi.
 */
export function potongKalimat(teks: string, maks = 180): string[] {
  const hasil: string[] = [];
  for (const kalimat of teks.split(/(?<=[.!?…])\s+/)) {
    let sisa = kalimat.trim();
    if (!sisa) continue;
    while (sisa.length > maks) {
      const koma = sisa.lastIndexOf(", ", maks);
      const potong = koma > 40 ? koma + 1 : sisa.lastIndexOf(" ", maks);
      if (potong <= 0) {
        // Tidak ada spasi/koma: potong paksa supaya potongan tetap pendek.
        hasil.push(sisa.slice(0, maks).trim());
        sisa = sisa.slice(maks).trim();
        continue;
      }
      hasil.push(sisa.slice(0, potong).trim());
      sisa = sisa.slice(potong).trim();
    }
    if (sisa) hasil.push(sisa);
  }
  return hasil;
}

export type Bahasa = "id" | "en";

const KATA_ID = new Set([
  "aku", "kamu", "saya", "kita", "kami", "anda", "dia", "mereka", "gue", "lo",
  "yang", "dan", "atau", "tapi", "tetapi", "namun", "karena", "kalau", "jika",
  "dengan", "untuk", "dari", "di", "ke", "pada", "dalam", "ini", "itu", "ada",
  "tidak", "bukan", "belum", "sudah", "akan", "bisa", "boleh", "harus", "mau",
  "ingin", "juga", "saja", "lagi", "masih", "banget", "sekali", "apa", "siapa",
  "kapan", "kenapa", "bagaimana", "gimana", "berapa", "mana", "halo", "hai",
  "terima", "kasih", "makasih", "ya", "sih", "dong", "nih", "kok", "lah", "pun",
  "biar", "supaya", "seperti", "kayak", "gitu", "gini", "jadi", "walaupun",
  "meskipun", "sangat", "paling", "lebih", "kurang", "banyak", "sedikit",
  "semua", "setiap", "sama", "tanpa", "sekitar", "antara", "oleh", "sebagai",
  "telah", "pernah", "sedang", "pakai", "coba", "suka", "makan", "main",
]);

const KATA_EN = new Set([
  "the", "is", "are", "was", "were", "be", "been", "being", "am", "a", "an",
  "and", "or", "but", "if", "then", "than", "so", "because", "of", "to", "in",
  "on", "at", "by", "for", "with", "from", "as", "it", "its", "this", "that",
  "these", "those", "i", "you", "he", "she", "we", "they", "me", "him", "her",
  "us", "them", "my", "your", "his", "our", "their", "not", "no", "yes", "do",
  "does", "did", "have", "has", "had", "will", "would", "can", "could",
  "should", "may", "might", "must", "let", "there", "here", "what", "who",
  "when", "why", "how", "which", "just", "very", "really", "about", "over",
  "into", "up", "down", "out", "off", "again", "also", "too",
]);

/**
 * Tebak bahasa satu kalimat/klausa dari kata fungsi, bukan kamus besar.
 * Default Indonesia; bahasa Inggris hanya menang kalau ada ≥2 kata fungsi
 * Inggris dan lebih banyak daripada kata fungsi Indonesia. Istilah teknis
 * ("deploy", "error") sengaja tidak dihitung supaya tidak memicu ganti voice.
 */
export function deteksiBahasa(teks: string): Bahasa {
  let id = 0;
  let en = 0;
  for (const kata of teks.toLowerCase().match(/[a-z']+/g) ?? []) {
    if (KATA_ID.has(kata)) id++;
    if (KATA_EN.has(kata)) en++;
  }
  return en >= 2 && en > id ? "en" : "id";
}

export type BagianSuara = { teks: string; bahasa: Bahasa };

/**
 * Pecah teks jadi bagian per bahasa. Kalimat dipecah lagi di koma/titik-koma
 * supaya sisipan bahasa lain ikut dapat voice-nya.
 *
 * ponytail: per klausa, bukan per deret kata — istilah Inggris tanpa koma di
 * tengah kalimat Indonesia tetap dibaca voice Indonesia. Naikkan granularitas
 * kalau campuran seperti itu sering.
 */
export function potongBahasa(teks: string): BagianSuara[] {
  const hasil: BagianSuara[] = [];
  for (const kalimat of potongKalimat(teks)) {
    let kini: BagianSuara | null = null;
    for (const klausa of kalimat.split(/(?<=[,;:])\s+/)) {
      const bahasa = deteksiBahasa(klausa);
      if (kini && kini.bahasa === bahasa) {
        kini.teks = `${kini.teks} ${klausa}`;
      } else {
        if (kini) hasil.push(kini);
        kini = { teks: klausa, bahasa };
      }
    }
    if (kini) hasil.push(kini);
  }
  return hasil;
}

/** Tunggu daftar voice terisi (Chrome mengisinya setelah halaman siap). */
function tungguSuara(): Promise<SpeechSynthesisVoice[]> {
  const langsung = window.speechSynthesis.getVoices();
  if (langsung.length > 0) return Promise.resolve(langsung);

  return new Promise((selesai) => {
    const beres = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", beres);
      selesai(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", beres);
    window.setTimeout(beres, 1200); // jangan menggantung kalau browser tidak memicu event
  });
}

/** Naik setiap kali suara dihentikan, supaya permintaan lama tidak berbunyi. */
let generasi = 0;

/** Bacakan teks. `selesai` dipanggil saat selesai, dihentikan, atau gagal. */
export async function bicarakan(
  teks: string,
  opsi: { selesai?: () => void } = {},
): Promise<boolean> {
  if (!dukungSuara() || !teks.trim()) return false;
  const gen = ++generasi;
  window.speechSynthesis.cancel();

  const daftar = await tungguSuara();
  if (gen !== generasi) return true; // dibatalkan saat menunggu voice
  const bagian = potongBahasa(teks);
  if (bagian.length === 0) return false;

  const suaraPer: Record<Bahasa, SpeechSynthesisVoice | null> = {
    id: pilihSuara(daftar, "id"),
    en: pilihSuara(daftar, "en"),
  };

  bagian.forEach((b, i) => {
    const u = new SpeechSynthesisUtterance(b.teks);
    const pilihan = suaraPer[b.bahasa];
    // Hanya pakai voice yang bahasanya benar-benar cocok; kalau voice Inggris
    // tidak terpasang, tetap pakai voice Indonesia daripada suara acak.
    if (pilihan && pilihan.lang?.toLowerCase().startsWith(b.bahasa)) u.voice = pilihan;
    else if (suaraPer.id) u.voice = suaraPer.id;
    u.lang = u.voice?.lang ?? (b.bahasa === "en" ? "en-US" : "id-ID");
    // Pendekatan "kartun": pitch tinggi supaya terdengar seperti Kirby kecil.
    // Semakin tinggi, semakin mirip karakter tapi semakin terasa sintetis.
    u.rate = 1.03;
    u.pitch = 1.65;
    if (i === bagian.length - 1) {
      u.onend = () => opsi.selesai?.();
      u.onerror = () => opsi.selesai?.();
    }
    window.speechSynthesis.speak(u);
  });
  return true;
}

export function hentikanSuara(): void {
  if (!dukungSuara()) return;
  generasi++;
  window.speechSynthesis.cancel();
}