<!-- PRD = KENAPA dan APA. Jangan bahas teknologi di sini (itu TECH-SPEC).
     v0.1 DRAFT — belum disetujui pemilik. Perlu tinjauan sebelum Tahap 2. -->

# PRD — ohmysea

| Field | Isi |
|---|---|
| Versi | 0.1 |
| Tanggal | 2026-11-04 |
| Pemilik | seainheree (lohadasea@gmail.com) |
| Status | Draft |

## 1. Ringkasan

ohmysea adalah chatbot web pribadi dengan RAG sederhana. Ada tiga mode: **chat**
(ngobrol biasa dengan memori percakapan), **curhat** (mode bercerita yang
ditanggapi empatik), dan **generate image** (bikin gambar dari prompt dengan
pilihan style, model, aspect ratio, termasuk image-to-image dari gambar
referensi). Jawaban chat/curhat boleh memakai konteks dari kumpulan dokumen
sendiri (RAG). Hasil akhir: satu aplikasi web yang dipakai sendiri, jalan di
kuota gratis.

## 2. Masalah

Belum ada tempat ngobrol milik sendiri yang: (a) ingat percakapan sebelumnya,
(b) punya mode khusus curhat yang tidak menjawab seperti asisten kantor, dan
(c) bisa bikin gambar dari percakapan yang sama — tanpa pindah aplikasi, tanpa
langganan berbayar.

Siapa yang merasakan:

- **Pemilik project (pengguna utama v1)** — butuh asisten pribadi yang ingat konteks, bukan chat yang mulai dari nol tiap dibuka.
- **Pengguna yang ingin curhat** — butuh tempat bercerita yang ditanggapi hangat, bukan dihakimi atau diceramahi.
- **Pengguna yang butuh gambar cepat** — butuh membuat/mengubah gambar dari satu prompt tanpa membuka tool desain terpisah.

## 3. Tujuan

| # | Tujuan | Metrik | Target |
|---|---|---|---|
| G1 | Chat punya memori percakapan | Uji 2 langkah: pesan "namaku Budi", lalu "namaku siapa?" | Balasan kedua memuat "Budi"; 2 pesan tersimpan di DB |
| G2 | Jawaban bisa mengacu dokumen sendiri (RAG) | Tanya fakta yang hanya ada di dokumen sumber | Jawaban memuat fakta itu; `rag:query` mencetak ≥ 4 chunk + skor |
| G3 | Curhat terasa berbeda dari chat biasa | Uji banding manual: prompt sama di mode chat vs curhat | Curhat menanggapi emosi lebih dulu, tidak memberi diagnosis medis |
| G4 | Image generation jalan end-to-end | Uji: prompt + style + ratio → file gambar tersimpan & tampil | 1 permintaan = 1 gambar < 30 detik (model default) |
| G5 | Biaya operasional | Tagihan layanan bulan pertama | Rp 0 (semua di free tier) |
| G6 | Bisa dipakai dari HP | Cek manual di lebar 360 px | Tidak ada elemen terpotong atau tumpang tindih |

## 4. Non-Goals

Sengaja **tidak** dikerjakan di v1:

- Login/akun pengguna publik & multi-user (v1 dipakai sendiri)
- Langganan/pembayaran/harga
- Aplikasi mobile native (Android/iOS)
- RAG tingkat lanjut: reranking, hybrid search, knowledge graph, multi-hop
- Fine-tuning / training model sendiri
- Share percakapan ke publik (tombol "Share chat" di mockup tidak dikerjakan)
- Multi-bahasa UI (v1: Bahasa Indonesia)

Alasan: semua di atas menambah biaya perawatan, biaya layanan, atau kebutuhan
moderasi yang belum perlu untuk pemakaian pribadi. Yang penting dulu: tiga fitur
inti utuh, murah, tidak rapuh.

## 5. User story

| ID | Story | Prioritas |
|---|---|---|
| US-01 | Sebagai pemilik, saya ingin mengirim pesan dan dapat balasan yang ingat percakapan sebelumnya, agar tidak mengulang konteks | Must |
| US-02 | Sebagai pemilik, saya ingin menambahkan dokumen ke basis pengetahuan, agar jawaban memakai isi dokumen saya | Must |
| US-03 | Sebagai pemilik, saya ingin mode curhat yang menanggapi emosi dengan lembut, agar bisa bercerita tanpa merasa dihakimi | Must |
| US-04 | Sebagai pemilik, saya ingin membuat gambar dari prompt dengan pilihan style/model/ratio, agar hasilnya sesuai kebutuhan | Must |
| US-05 | Sebagai pemilik, saya ingin memberi gambar referensi ke generator (image-to-image), agar hasil mengikuti gaya gambar itu | Should |
| US-06 | Sebagai pemilik, saya ingin melihat kembali gambar yang pernah dibuat, agar tidak perlu generate ulang | Should |
| US-07 | Sebagai pemilik, saya ingin mengganti judul atau menghapus percakapan, agar daftar chat tetap rapi | Should |
| US-08 | Sebagai pemilik, saya ingin menyimpan fakta tentang diriku sebagai memori AI, agar tidak mengulang konteks di setiap percakapan | Must |
| US-09 | Sebagai pemilik, saya ingin menghapus riwayat percakapan (satuan atau semua), agar data lama bisa dibersihkan | Must |

## 6. Kebutuhan fungsional

| ID | Kebutuhan | Story | Kriteria penerimaan |
|---|---|---|---|
| FR-1 | Kirim pesan mode chat, tersimpan sebagai percakapan | US-01 | `curl -s -X POST localhost:3000/api/chat -H 'content-type: application/json' -d '{"conversationId":"<id>","message":"hai"}'` → 200, body memuat `reply`; lalu `curl -s localhost:3000/api/conversations/<id>` memuat 2 pesan (user + assistant) |
| FR-2 | Balasan chat memakai N pesan terakhir sebagai konteks | US-01 | Pesan 1 "namaku Budi" → pesan 2 "namaku siapa?" → balasan memuat "Budi" |
| FR-3 | Ingest dokumen ke basis pengetahuan | US-02 | `pnpm rag:ingest <file\|url>` exit 0; jumlah chunk dokumen bertambah di tabel; output mencetak jumlah chunk |
| FR-4 | Retrieval top-k saat menjawab | US-02 | `pnpm rag:query "<kata kunci>"` mencetak k ≥ 4 chunk + skor; tanya fakta yang hanya ada di dokumen → jawaban menyebut fakta itu + nama dokumen; tanya di luar dokumen → **tetap dijawab** dari pengetahuan umum dengan catatan singkat bahwa itu bukan dari dokumen, dan tidak pernah memakai kalimat "tidak ada di dokumen yang kamu tambahkan" |
| FR-5 | Mode curhat terpisah dari chat | US-03 | Percakapan curhat tersimpan dengan penanda mode; prompt sama di mode curhat memuat refleksi/validasi perasaan dan **tidak** memuat kalimat diagnosis ("kamu menderita ...") |
| FR-6 | Generate image dari prompt | US-04 | `curl -s -X POST localhost:3000/api/images -H 'content-type: application/json' -d '{"prompt":"...","style":"...","model":"...","aspectRatio":"1:1","count":1}'` → 200, body memuat URL gambar yang bisa dibuka; file benar-benar ada di storage |
| FR-7 | Metadata gambar tersimpan | US-04 | Baris DB gambar memuat kolom prompt, style, model, aspectRatio, url, createdAt — semua tidak null |
| FR-8 | Image-to-image dari gambar referensi | US-05 | Upload 1 gambar referensi + prompt → 200; gambar hasil tersimpan; kolom referensi terisi di DB |
| FR-9 | Galeri gambar | US-06 | Halaman galeri menampilkan semua gambar yang pernah dibuat beserta prompt-nya; grid tidak pecah di 360 px |
| FR-10 | Kelola percakapan | US-07 | `curl -s -X PATCH localhost:3000/api/conversations/<id> -d '{"title":"x"}'` → 200 + judul berubah di DB; `DELETE` → 200 + baris dan pesannya hilang |
| FR-11 | Halaman chat satu layar | US-01..04 | `pnpm build` exit 0; halaman memuat sidebar percakapan, area pesan, input, dan pemilih mode (chat/curhat/gambar) |
| FR-12 | Memori AI (Pengaturan) + simpan otomatis | US-08, US-10 | `POST /api/memories` → 201; memori aktif muncul di `GET /api/memories`; tanya hal yang hanya ada di memori di percakapan **baru** → balasan memuat fakta itu; memori dinonaktifkan → tidak lagi dipakai. Otomatis: kirim pesan berisi fakta tahan lama ("panggil aku Sha", "aku suka kopi hitam") → ±15 detik kemudian `GET /api/memories` memuat fakta itu; pesan keluhan sesaat dan data sensitif (kata sandi/PIN) **tidak** tersimpan; `autoMemori:false` → tidak ada baris baru |
| FR-13 | Hapus riwayat percakapan | US-09 | `DELETE /api/conversations` → 200 + jumlah; sesudah itu `GET /api/conversations` kosong; `DELETE /api/conversations?mode=curhat` hanya menghapus mode itu; hapus satu percakapan juga menghapus pesannya |
| FR-14 | Tema terang & gelap | US-11 | Sakelar di header & Pengaturan; `document.documentElement.dataset.tema` berubah; `getComputedStyle(document.body).backgroundColor` berubah; setelah reload pilihan tetap; tanpa pilihan → ikut `prefers-color-scheme` |
| FR-15 | Sidebar bisa ditutup & footer rapi | US-11 | Klik tombol panel di ≥ 768 px → `getComputedStyle(aside).display === "none"` dan area chat melebar; setelah reload tetap tertutup; footer terlihat penuh (`rect.bottom <= innerHeight`) di 360/768/1440 px dan tidak tertimpa kolom chat |
| FR-16 | Identitas & kecepatan balasan Kirby | US-12 | Balasan asisten menampilkan avatar `kirby.png` + label "Kirby · X,X detik · jam:menit"; saat menunggu tampil teks "Kirby sedang menjawab..."; chip nama dokumen tidak lagi tampil di balasan (nama dokumen tetap disebut di dalam teks jawaban) |
| FR-17 | Latar transparan pada gambar | US-13 | Centang "Latar transparan" → prompt memuat petunjuk latar putih rata; tombol "Unduh PNG transparan" menghasilkan PNG dengan kanal alfa (uji: >50% piksel transparan pada subjek berlatar putih) |
| FR-18 | Gerak UI standar (Framer Motion + Lenis) | US-14 | Semua animasi memakai token `lib/motion.ts` (150–400 ms, satu kurva); pesan masuk beranimasi; indikator menunggu hilang tepat saat balasan tampil dan **tidak** muncul lagi; dialog konfirmasi tertutup bersih (tidak menyisakan overlay); gulir chat memakai Lenis (`main` memiliki class `lenis`) dan dimatikan otomatis saat `prefers-reduced-motion` |

Aturan: setiap kriteria penerimaan **harus bisa dijalankan sebagai command** atau
diperiksa dengan mata tanpa menebak. Kriteria yang berupa penilaian rasa (G3,
FR-5) memakai uji banding manual; hasilnya ditulis di `docs/PROGRESS-LOG.md`.

## 7. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Performa | Balasan chat mulai muncul < 3 detik (streaming); 1 gambar < 30 detik model default |
| Ukuran | Bundle halaman awal wajar; tidak memuat library berat tanpa alasan |
| Biaya | Rp 0/bulan di v1 — semua layanan dalam kuota gratis |
| Seluler | Rapi 360 px–1440 px; input tetap terlihat saat keyboard HP muncul |
| Aksesibilitas | Kontras teks ≥ 4.5:1; semua aksi bisa dijangkau keyboard; gambar punya alt |
| Keamanan | Kunci API hanya di server, tidak pernah dikirim ke browser; tidak ada nilai rahasia di repo; v1 dibatasi dari akses publik |
| Keandalan | Kalau provider AI gagal, UI menampilkan error jelas — bukan layar kosong |
| Privasi | Isi curhat tersimpan di DB sendiri; tidak dikirim ke layanan di luar yang dipakai untuk menjawab |

## 8. Alur utama

**Alur: chat biasa**
1. Pengguna buka halaman utama → pilih mode **chat** (atau percakapan lama dari sidebar)
2. Ketik pesan → dikirim ke API
3. Sistem ambil N pesan terakhir + potongan dokumen relevan dari RAG
4. Balasan tampil bertahap (streaming) dan tersimpan di DB
5. Selesai: percakapan bisa dilanjut besok dengan konteks yang sama

**Alur: curhat**
1. Pilih mode **curhat**
2. Tulis apa yang dirasakan → dikirim dengan system prompt curhat (tanpa retrieval dokumen)
3. Balasan menanggapi perasaan lebih dulu, menawarkan sudut pandang, tidak mendiagnosis
4. Selesai: tersimpan sebagai percakapan mode curhat

**Alur: generate image**
1. Pilih mode **gambar** → isi prompt → pilih style, model, aspect ratio, jumlah
2. (Opsional) unggah 1 gambar referensi untuk image-to-image
3. Sistem kirim permintaan ke provider image, simpan hasil + metadata
4. Selesai: gambar tampil di halaman dan masuk galeri

**Alur: isi basis pengetahuan (RAG)**
1. Pengguna siapkan dokumen (file atau URL)
2. Jalankan ingest → dokumen dipecah jadi chunk → jadi vektor → disimpan
3. Selesai: `rag:query` mengembalikan chunk relevan; chat mulai memakai konteks itu

## 9. Risiko

| Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|
| Kualitas RAG jelek (chunk/embedding salah pilih) | Jawaban mengarang atau melenceng | Sedang | Uji FR-4 dengan 5 pertanyaan yang jawabannya hanya ada di dokumen; catat hasil di PROGRESS-LOG |
| Kuota gratis habis / rate limit | Fitur berhenti di tengah pemakaian | Sedang | Batasi panjang konteks yang dikirim, model kecil untuk tugas ringan, error jelas di UI |
| Biaya image generation membengkak | Tagihan tak terduga | Sedang | Batasi jumlah gambar per permintaan, pantau pemakaian |
| Kunci API bocor di file yang ikut commit | Penyalahgunaan kuota atas nama pemilik | **Tinggi** | Nilai asli hanya di `.env` (gitignored); file contoh berisi placeholder; nilai yang sudah terlanjur ditulis di file contoh dirotasi |
| Penjagaan isi kurang (gambar/curhat) | Hasil tidak pantas; salah tangani kondisi krisis | Sedang | Filter keamanan provider aktif; mode curhat dilarang mendiagnosis; tampilkan tautan bantuan bila ada indikasi krisis |
| Provider tidak mendukung image-to-image untuk model tertentu | US-05 gagal | Sedang | Verifikasi dukungan model sebelum dipakai; kalau tidak didukung, jatuh ke text-to-image dan beri tahu pengguna |

## 10. Pertanyaan terbuka

| # | Pertanyaan | Untuk siapa | Batas waktu | Status |
|---|---|---|---|---|
| Q1 | Provider embedding untuk RAG: Cloudflare Workers AI, atau gateway lain? (Groq tidak menyediakan endpoint embedding) | Pemilik | sebelum T-1.3 | terbuka |
| Q2 | Penyimpanan vektor: pgvector di Postgres yang sudah ada, atau vector store terpisah? | Pemilik | sebelum T-1.3 | terbuka |
| Q3 | Model image default, dan apakah model itu mendukung image-to-image? | Pemilik | sebelum T-2.1 | terbuka |
| Q4 | Gambar hasil disimpan di mana (object storage, atau kolom DB)? | Pemilik | sebelum T-2.1 | terbuka |
| Q5 | Dokumen pertama yang di-ingest: file lokal atau hasil crawl URL? | Pemilik | sebelum T-1.3 | terbuka |
| Q6 | Akses v1: benar-benar privat (1 pengguna, tanpa login) atau pakai kunci akses sederhana? | Pemilik | sebelum T-3.1 | terbuka |
| Q7 | Provider/model LLM untuk chat & curhat: satu model untuk semua, atau beda per mode? | Pemilik | sebelum T-1.1 | terbuka |

Pertanyaan yang **memblokir** task harus ditandai di sini supaya task terkait diberi
status `blocked`, bukan dipaksakan.

## 11. Riwayat perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1 | 2026-11-04 | Draft awal dari penjelasan pemilik project |
