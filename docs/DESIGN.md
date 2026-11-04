# DESIGN — ohmysea

| Field | Isi |
|---|---|
| Versi | 0.1 |
| Tanggal | 2026-11-04 |

## 1. Referensi

- Mockup: `public/image/{8140DE68-4C19-4FDB-9137-35138A4FC293}.png` (956x793) — mockup UI dark-mode, sidebar + main panel
- Figma / mockup lain: belum ada
- Situs yang gayanya disukai: gaya dark-mode SaaS chat (mockup di atas)
- Gambar acuan: `public/image/` (folder referensi; gambar di dalamnya bukan aset produksi)

Catatan: mockup memakai wordmark "Blossom AI Chatbot" / "blossomai" — itu milik
template, **bukan** nama project. Semua penamaan diganti jadi **ohmysea**.

## 2. Arah gaya

Gelap, lembut, hangat. Satu warna aksen pink yang dipakai hemat untuk aksi utama
dan penanda merek; sisanya abu kebiruan gelap. Sudut besar, border tipis nyaris
tak terlihat, banyak ruang kosong. Tidak ramai, tidak teknis-kaku. Terbaca di HP
di ruang gelap, dan tetap jelas di layar terang.

## 3. Token desain

Dipakai berulang; jadi satu sumber di `app/globals.css` sebagai CSS variable.
Jangan tulis ulang nilai hex di komponen.

| Jenis | Nama | Nilai |
|---|---|---|
| Warna | bg-topbar | `#12121C` |
| Warna | bg-sidebar | `#141420` |
| Warna | bg-main | `#1A1A26` |
| Warna | surface (kartu) | `#1E1E2A` |
| Warna | border | `#2C2C3C` |
| Warna | border-kuat | `#33334A` |
| Warna | aksen (pink utama) | `#EC4899` |
| Warna | aksen-terang | `#F472B6` |
| Warna | aksen-lembut | `#F9A8D4` |
| Warna | teks | `#FFFFFF` |
| Warna | teks-muted | `#9CA3AF` |
| Warna | teks-muted-2 | `#8B8B9E` |
| Warna | status-online | `#22C55E` |
| Warna | danger | `#F87171` |
| Warna | aksi-kirim | `#EC4899` (menggantikan biru default `#3B82F6` di mockup — keluar palet) |
| Jarak | kecil / sedang / besar | 8px / 16px / 24px |
| Huruf | display (dekoratif) | Instrument Serif, 400 |
| Huruf | UI (semua teks antarmuka) | DM Sans, 400–700 |
| Radius | kecil / sedang / besar / penuh | 8px / 12px / 16px / 999px |
| Ukuran huruf | judul hero / judul kartu / isi / label kecil | 32–40px / 15px / 14px / 11px (uppercase, letter-spacing 0.08em) |
| Berat huruf | judul / isi | 700–800 / 400–500 |
| Radius kartu chat | — | 16px |
| Lebar sidebar | — | 300px (desktop), jadi drawer di < 768px |
| Lebar maks area pesan | — | 760px, tengah |
| Glow merek | — | `0 0 24px rgba(236,72,153,.35)` pada logo & tombol utama |

Tipografi — dua huruf, pembagian tugas ketat:

- **Instrument Serif** (400) — hanya untuk elemen dekoratif dan berkarakter: wordmark/logo, judul hero, headline besar, kata yang ditonjolkan (mis. kata aksen di tengah headline), kutipan/teks editorial. Kesan yang dituju: elegan, unik, sedikit luxury. Jangan dipakai untuk teks panjang atau kontrol UI.
- **DM Sans** (400–700) — seluruh teks antarmuka: isi percakapan, sidebar & navigasi, tombol & label, placeholder input, deskripsi/paragraf, pengaturan, notifikasi, dan informasi kecil. Kesan: modern, bersih, ramah, mudah dibaca.

Implementasi: dimuat lewat `next/font/google` di `app/layout.tsx` sebagai CSS variable `--font-instrument-serif` dan `--font-dm-sans`, lalu dipetakan ke token `--font-display` dan `--font-sans` di `app/globals.css`. Jangan menulis nama font langsung di komponen — pakai `font-display` / `font-sans`.

## 4. Layar / komponen

| Layar / komponen | Isi | Status |
|---|---|---|
| Shell aplikasi | Top bar (logo ohmysea + tombol mode + status), sidebar, area utama | belum |
| Sidebar | Tombol "+ Percakapan baru", daftar percakapan (judul + ikon), pemilih mode (Chat / Curhat / Gambar), tautan Galeri | belum |
| Header kanal | Avatar/ikon, nama mode, status "Siap membantu", pemilih model | belum |
| Empty state | Headline besar + 4 kartu saran | belum |
| Daftar pesan | Gelembung user (pink) & asisten (surface), penanda sumber dokumen, waktu | belum |
| Composer | Textarea auto-tinggi, hint "Enter kirim · Shift+Enter baris baru", tombol kirim bulat pink | belum |
| Kartu sumber RAG | Chip kecil: nama dokumen + skor | belum |
| Form gambar | Prompt, pilihan style, model, aspect ratio, jumlah, unggah referensi (image-to-image) | belum |
| Hasil gambar | Preview besar, tombol unduh, metadata (prompt, style, ratio, model) | belum |
| Galeri | Grid gambar responsif + prompt tiap gambar | belum |
| Layar kunci | Input kode akses | belum |

## 5. Checklist visual (manual)

- [ ] Kontras teks terhadap latar ≥ 4.5:1 (teks muted di `#1A1A26` perlu dicek)
- [ ] Rapi di lebar 360 px (HP) sampai 1440 px (desktop)
- [ ] Sidebar jadi drawer di layar < 768 px dan bisa ditutup
- [ ] Semua tombol/tautan bisa dipakai dengan keyboard saja
- [ ] Fokus terlihat jelas (outline pink) di semua kontrol
- [ ] Tidak ada teks/potongan yang terpotong atau tumpang tindih
- [ ] Warna aksen hanya dipakai untuk aksi utama & merek — bukan di mana-mana
- [ ] Tidak ada nilai warna mentah di komponen (semua dari token)
- [ ] Tombol kirim berwarna pink, bukan biru
- [ ] Input tetap terlihat saat keyboard HP muncul
- [ ] Gelembung pesan panjang membungkus rapi (tidak melebar keluar layar)

## 6. Aksesibilitas

- [ ] Alt/teks pengganti di setiap gambar bermakna (gambar hasil: prompt sebagai alt)
- [ ] Urutan fokus masuk akal: sidebar → pesan → composer
- [ ] Status loading punya teks ("Menghasilkan gambar..."), bukan hanya spinner
- [ ] Error dibacakan sebagai teks, tidak hanya warna merah
- [ ] Mode curhat punya penanda visual berbeda (label, bukan hanya warna)
