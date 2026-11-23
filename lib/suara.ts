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
export type BagianBicara = BagianSuara & { jeda: number };

/**
 * Kata yang tidak boleh menggantung di akhir potongan: preposisi, konjungsi,
 * artikel, kata bantu. Memotong setelah kata ini menghasilkan jeda yang
 * terdengar salah ("aku pergi ke | pasar").
 */
const PENGHUBUNG = new Set([
  "di", "ke", "dari", "untuk", "dengan", "yang", "dan", "atau", "tapi",
  "tetapi", "karena", "kalau", "jika", "pada", "dalam", "oleh", "sebagai",
  "serta", "supaya", "biar", "agar", "tanpa", "seperti", "antara", "tentang",
  "the", "a", "an", "to", "of", "in", "on", "at", "for", "with", "and", "or",
  "but", "from", "by", "as", "that", "this", "these", "those", "is", "are",
  "was", "were", "be", "been", "being", "my", "your", "his", "her", "their",
  "our", "its", "not", "no", "so", "than", "then", "very", "can", "will",
]);

/** Jeda setelah potongan, mengikuti tanda baca terakhirnya (milidetik). */
function jedaAkhir(teks: string): number {
  const inti = teks.replace(/["'”’)\]]+$/u, "").trimEnd();
  const akhir = inti.slice(-1);
  if (".!?".includes(akhir) || akhir === "\u2026") return 220; // akhir kalimat
  if (";:\u2014".includes(akhir)) return 140; // jeda klausa
  if (akhir === ",") return 80; // jeda napas pendek
  return 0; // potongan karena panjang, bukan tanda baca: jangan berhenti
}

/**
 * Titik potong aman untuk kalimat kepanjangan: utamakan tanda baca, lalu
 * spasi terakhir yang tidak membuat preposisi/konjungsi menggantung.
 */
function titikPotongAman(teks: string, maks: number): number {
  const min = Math.max(20, Math.floor(maks * 0.45));
  let terbaik = -1;
  let skorTerbaik = -1;
  for (let p = teks.indexOf(" "); p > 0 && p <= maks; p = teks.indexOf(" ", p + 1)) {
    if (p < min) continue;
    const kiri = teks.slice(0, p).trimEnd();
    const kanan = teks.slice(p + 1).trimStart();
    if (!kiri || !kanan) continue;
    const kataKiri = (kiri.match(/[\p{L}\p{N}']+$/u)?.[0] ?? "").toLowerCase();
    const kataKanan = (kanan.match(/^[\p{L}\p{N}']+/u)?.[0] ?? "").toLowerCase();
    if (!kataKiri || !kataKanan) continue;
    if (PENGHUBUNG.has(kataKiri) || PENGHUBUNG.has(kataKanan)) continue;
    // Tanda baca klausa selalu menang; selain itu pilih potongan terpanjang.
    const tanda = /[,;:\u2014]$/u.test(kiri) ? 1000 : 0;
    const skor = tanda + p;
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = p;
    }
  }
  if (terbaik > 0) return terbaik;
  // Tidak ada batas aman (mis. teks tanpa spasi): pakai spasi terakhir.
  const spasi = teks.lastIndexOf(" ", maks);
  return spasi > 0 ? spasi : maks;
}

/** Potong paksa hanya kalau kalimat masih lebih panjang dari `maks`. */
function potongAman(teks: string, maks: number): string[] {
  const hasil: string[] = [];
  let sisa = teks.trim();
  while (sisa.length > maks) {
    const p = titikPotongAman(sisa, maks);
    hasil.push(sisa.slice(0, p).trim());
    sisa = sisa.slice(p).trim();
  }
  if (sisa) hasil.push(sisa);
  return hasil;
}

/**
 * Pecah teks jadi bagian siap baca: bahasa + jeda setelahnya.
 *
 * Aturan jeda:
 * - akhir kalimat (`.!?…`) → 220 ms, klausa (`;:—`) → 140 ms, koma → 80 ms;
 * - potongan yang dipaksa karena panjang (tanpa tanda baca) → 0 ms, supaya
 *   tidak ada jeda di tengah frasa preposisional.
 *
 * Kalimat pendek tetap satu potongan walau ada koma: TTS memberi jeda koma
 * secara alami di dalam satu utterance, lebih halus daripada memotong.
 *
 * ponytail: deteksi bahasa per klausa; istilah Inggris tanpa koma di tengah
 * kalimat Indonesia tetap dibaca voice Indonesia. Naikkan granularitas kalau
 * campuran seperti itu sering.
 */
export function potongBicara(teks: string, maks = 220): BagianBicara[] {
  const hasil: BagianBicara[] = [];

  const dorong = (potongan: string, bahasa: Bahasa) => {
    for (const bagian of potongAman(potongan, maks)) {
      hasil.push({ teks: bagian, bahasa, jeda: jedaAkhir(bagian) });
    }
  };

  for (const kalimat of teks.split(/(?<=[.!?\u2026])\s+/)) {
    let gabung = "";
    let bahasa: Bahasa = "id";
    let ada = false;

    const dorongGabung = () => {
      if (ada && gabung) dorong(gabung, bahasa);
      gabung = "";
      ada = false;
    };

    for (const klausa of kalimat.split(/(?<=[,;:\u2014])\s+/)) {
      const bagian = klausa.trim();
      if (!bagian) continue;
      const b = deteksiBahasa(bagian);
      if (!ada) {
        gabung = bagian;
        bahasa = b;
        ada = true;
      } else if (b === bahasa && gabung.length + 1 + bagian.length <= maks) {
        gabung = `${gabung} ${bagian}`;
      } else {
        dorongGabung();
        gabung = bagian;
        bahasa = b;
        ada = true;
      }
    }
    dorongGabung();
  }
  return hasil;
}

/** Bagian teks + bahasa saja (tanpa jeda) — dipakai pengujian/voice. */
export function potongBahasa(teks: string): BagianSuara[] {
  return potongBicara(teks).map(({ teks: isi, bahasa }) => ({ teks: isi, bahasa }));
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
  const bagian = potongBicara(teks);
  if (bagian.length === 0) return false;

  const suaraPer: Record<Bahasa, SpeechSynthesisVoice | null> = {
    id: pilihSuara(daftar, "id"),
    en: pilihSuara(daftar, "en"),
  };

  // Utterance diantre satu per satu supaya jeda mengikuti tanda baca (bukan
  // jeda bawaan browser yang sama untuk semua batas).
  function putar(i: number) {
    if (gen !== generasi || i >= bagian.length) return;
    const b = bagian[i];
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

    let beres = false;
    const lanjut = () => {
      if (beres) return;
      beres = true;
      if (gen !== generasi) return;
      if (i === bagian.length - 1) {
        opsi.selesai?.();
        return;
      }
      if (b.jeda > 0) window.setTimeout(() => putar(i + 1), b.jeda);
      else putar(i + 1);
    };
    u.onend = lanjut;
    u.onerror = lanjut;
    window.speechSynthesis.speak(u);
  }

  putar(0);
  return true;
}

export function hentikanSuara(): void {
  if (!dukungSuara()) return;
  generasi++;
  window.speechSynthesis.cancel();
}