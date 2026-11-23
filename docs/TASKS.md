# TASKS — ohmysea

Status: `todo` / `doing` / `blocked` / `review` / `done`

## Milestone

| Milestone | Isi | Task | Status |
|---|---|---|---|
| M0 | Fondasi: scaffold, DB, skema, gerbang akses, shell UI | T-001..T-004 | done |
| M1 | Chat + memori + RAG sederhana + mode curhat | T-101..T-106 | done |
| M2 | Generate image (text-to-image, image-to-image), galeri | T-201..T-204 | done |
| M3 | Kualitas, responsif, deploy Vercel, uji semua kriteria FR | T-301..T-304 | done |
| M4 | Memori AI (Pengaturan), hapus riwayat, perapian UI/UX responsif | T-401..T-404 | done |
| M5 | Tema gelap/terang, sidebar bisa ditutup, footer rapi, identitas Kirby, memori otomatis | T-501..T-506 | done |
| M6 | Perbaikan indikator ganda, latar transparan gambar, jawaban tanpa penolakan kaku, gerak UI (Framer Motion + Lenis) | T-601..T-604 | done |
| M7 | Lampiran sekali pakai, markdown rapi di balasan, regenerate, saran lanjutan + sakelar navbar | T-701..T-705 | done |
| M8 | Konteks lampiran: chip di bubble pesan, retrieval lampiran tanpa ambang, konteks hanya dari berkas terunggah | T-801..T-804 | done |
| M9 | Berkas per sesi chat, memori paten vs otomatis (tabel terpisah), sembunyikan chip konteks global, rapikan layar awal | T-901..T-904 | done |
| M10 | Gerak UI lanjutan: GSAP + ScrollTrigger, sinkron Lenis↔ScrollTrigger, poles UX chat, animasi AI & aliran jawaban halus, perbaikan chat macet memuat | T-1001..T-1004 | done |
| M11 | Ruang main: opsi game di chat — Tic Tac Toe, Empat Berderet, Kartu Ingatan | T-1101..T-1103 | done |
| M12 | Ruang main dipoles: kontras keping, animasi maksimal, reaksi/ekspresi Kirby, lagu on/off | T-1201..T-1204 | done |
| M13 | Cari riwayat chat sampai isi pesan + Kirby bersuara (TTS) | T-1301..T-1303 | done |
| M14 | Ekspresi Kirby dari lembar sprite untuk setiap momen | T-1401 | done |

Gerbang: milestone selesai hanya kalau **semua** task `done` dan `pnpm build` exit 0.
Jangan lompat milestone.

## Status per task (diperbarui 2026-11-04)

`done` sudah diverifikasi dengan command. `review` = kode selesai, verifikasinya masih manual (mata/keyboard) dan belum dicentang.

| Task | Status | Bukti verifikasi |
|---|---|---|
| T-001 | done | `pnpm build` exit 0; `lib/env.ts` menolak env kurang |
| T-002 | done | `pnpm db:migrate` → pgvector 0.8.2, 5 tabel, kolom `vector(1024)`, indeks HNSW `vector_cosine_ops` |
| T-003 | done | `scripts/smoke.sh` bagian gerbang akses semua OK (401 tanpa cookie, 200 dengan) |
| T-004 | done | Uji browser 360 px: tanpa overflow horizontal (scrollWidth 360 = innerWidth), sidebar drawer (left −300, klik ☰ → 0), teks hero & kartu rata kiri 16 px |
| T-101 | done | smoke: `POST /api/chat` balas non-kosong |
| T-102 | done | smoke + `PATCH`/`DELETE` diuji; judul otomatis dari 6 kata pertama |
| T-103 | done | mode curhat diuji: empati dulu, tanpa diagnosis |
| T-104 | done | 11 dokumen ter-ingest (PRD, TECH-SPEC, DESIGN, README, 4 ADR, Groq Models); ingest ulang → 409 |
| T-105 | done | top-k 8 / ambang 0.30 / maks 3 per dokumen; jawaban menyebut sumber yang benar |
| T-106 | done | Uji browser: chat balas streaming, sidebar memuat riwayat, urutan Tab masuk akal |
| T-201 | done | smoke: `POST /api/images` → 201 + URL Supabase Storage bisa diakses (HTTP 200) |
| T-202 | done | image-to-image dengan mockup 956×793 → 201, `source_image` terisi, 1344×768 |
| T-203 | done | `pnpm test` (pemetaan ratio & style) + uji nyata klein & schnell |
| T-204 | done | galeri + `alt` + unduh; uji browser 360 px & 1440 px (grid 1 → 2/3 kolom) |
| T-301 | done | kegagalan provider (schnell menolak width/height) → HTTP 502 + pesan Bahasa Indonesia, baris `error` dicatat |
| T-302 | done | Uji browser: urutan Tab (drawer tertutup tidak lagi bisa difokus — `inert`), kontras 6.78:1 / 17.22:1 / 5.15:1, hint keyboard disembunyikan < sm, batas laju aktif |
| T-303 | done | Deploy produksi **Ready**: https://ohmysea.vercel.app ; health produksi 200; chat/gambar/image-to-image jalan |
| T-304 | done | Uji produksi: 7 pertanyaan RAG (hasil di PROGRESS-LOG) + uji browser 360 px & 1440 px semua sesuai harapan |
| T-401 | done | Memori AI: POST 201, duplikat 409, jawaban memakai memori di chat & curhat, nonaktif → tidak dipakai; `lib/memory.test.ts` lulus; `/pengaturan` produksi 200 |
| T-402 | done | `DELETE /api/conversations` (semua) di lokal & `?mode=curhat` di produksi → jumlah benar, pesan ikut terhapus, dialog konfirmasi (bukan `window.confirm`) |
| T-403 | done | Browser 360/768/1440 px: tanpa overflow, tombol ≥ 44 px, input 16 px, header & komposer sticky, ikon SVG, drawer 310 px + pencarian |
| T-404 | done | Semua di atas dijalankan di produksi setelah deploy `62c0800`; `pnpm lint`/`test` (24 lulus)/`build` hijau |
| T-501 | done | Tema: produksi `data-tema` gelap→terang, `body` `rgb(247,247,251)`, footer putih, pilihan tersimpan; `prefers-color-scheme` jadi bawaan |
| T-502 | done | Produksi: tombol panel → `aside display: none`, area chat melebar; footer `bottom <= innerHeight` di 360/768/1440 px |
| T-503 | done | Produksi: label "Kirby · 8,0 detik · 16.50", 3 titik + "Kirby sedang menjawab...", chip dokumen 0 |
| T-504 | done | Produksi (`onFinish`): 2 memori tersimpan otomatis + catatan di UI; pesan sesaat & data sensitif tidak tersimpan; `autoMemori:false` dihormati |
| T-505 | done | Sapaan "Hi Sasha, Kirby di sini poyoo~" saat memori panggilan ada; tanpa memori → "Hi, Kirby di sini poyoo~" |
| T-506 | done | Sesi 24 jam + kode baru: `Set-Cookie … Max-Age=86400`; kode baru di `.env` → produksi 200 dan HMAC cookie sama dengan HMAC lokal; kode salah & cookie asal-asalan → 401 |
| T-601 | done | Timeline browser: titik menunggu 3 → 0 saat balasan masuk, dan tetap 0 setelah 6 detik (tidak berulang); `sibuk` dilepas sebelum pemeriksaan memori |
| T-602 | done | Latar transparan: API menerima `transparan=1`; uji alfa pada gambar asli 1024×1024 → 851.640 dari 1.048.576 piksel transparan (81,2%); tombol "Unduh PNG transparan" melaporkan "PNG transparan diunduh." |
| T-603 | done | Prompt baru: jawaban di luar dokumen tetap dijawab dari pengetahuan umum + catatan singkat; frasa "tidak ada di dokumen yang kamu tambahkan" dilarang eksplisit |
| T-604 | done | Framer Motion: pesan/kartu/dialog beranimasi (9 elemen `style` inline, 8 kartu galeri); token `lib/motion.ts`; dialog buka→Batal hilang total (overlay 0); Lenis aktif (`main` class `lenis`) dan berhenti otomatis saat `prefers-reduced-motion` |
| T-701 | done | Lampiran sekali pakai: setelah jawaban tersimpan, `hapusLampiranPercakapan()` membuang dokumen percakapan; unggah ulang teks sama → `ditimpa:false` (dokumen lama benar-benar hilang) |
| T-702 | done | Balasan dirender markdown di UI: `strong` 7, `li` 11, sisa `**` di DOM 0 pada uji browser; `lib/saran.test.ts` menguji parser |
| T-703 | done | Baris "Konteks" + chip nama dokumen di bawah balasan (bertahan setelah lampiran dihapus, diambil dari `messages.sources`) |
| T-704 | done | Regenerate ikon saja di balasan terakhir: `regenerate:true` → roles `user,assistant`, jumlah assistant 1 (tidak dobel) |
| T-801 | done | Chip "Konteks" tampil di bubble pesan pengguna saat membawa berkas (dari `messages.sources`; tampil juga saat streaming) |
| T-802 | done | `/api/chat` mencatat dokumen lampiran ke `sources` pesan user; retrieval lampiran tanpa ambang skor (`pilihPotongan()` + 5 test baru) |
| T-803 | done | `aktifIdRef` menggantikan `aktif?.id` di jalur kirim/ulang — lampiran tak lagi kehilangan percakapan saat state belum ter-render |
| T-804 | done | Saat ada lampiran, retrieval hanya memakai dokumen percakapan (`hanyaLampiran`) — dokumen global (ADR/PRD/DESIGN) tidak ikut jadi konteks |
| T-901 | done | Berkas unggahan tersimpan selama satu sesi percakapan (bukan sekali pakai); `GET /api/conversations/[id]` mengembalikan `berkas`, komposer menampilkan "Berkas sesi" |
| T-902 | done | Tabel baru `permanent_memories` (memori paten) terpisah dari `memories` (otomatis); migrasi `0003_high_iron_fist.sql`; panel Pengaturan dua bagian; prompt memakai keduanya |
| T-903 | done | Chip "Konteks" di balasan hanya berisi berkas unggahan; dokumen global tetap dipakai menjawab tapi tidak ditampilkan |
| T-904 | done | Empat kartu saran di layar awal chat dihapus; hanya sapaan Kirby yang tersisa |
| T-705 | done | Saran lanjutan `/api/saran` (model `GROQ_MODEL_MEMORI`) + sakelar navbar tersimpan di `localStorage`; uji nyata: 3 chip muncul ("Apa tujuan utama ohmysea?", …) |

---

## M4 — Memori AI, hapus riwayat, perapian UI/UX

### T-401 — Memori AI (fitur Pengaturan)

- **Status**: doing
- **Dependency**: T-002, T-101
- **Cakupan**: `lib/memory.ts`, `lib/db/schema.ts` (tabel `memories`), `app/api/memories/*`, `components/settings/MemoryPanel.tsx`, `app/api/chat/route.ts`
- **Kriteria penerimaan** (FR-12): memori aktif disuntikkan ke prompt sistem di kedua mode; duplikat ditolak 409; memori nonaktif tidak dipakai; maks 500 karakter/memori & 60 memori aktif
- **Verifikasi**: uji API lokal + `lib/memory.test.ts` (hasil di PROGRESS-LOG)

### T-402 — Hapus riwayat percakapan

- **Status**: doing
- **Dependency**: T-102
- **Cakupan**: `app/api/conversations/route.ts` (DELETE), `components/chat/Sidebar.tsx` (hapus satuan & semua), `app/pengaturan/page.tsx`
- **Kriteria penerimaan** (FR-13): hapus semua / per mode; pesan ikut terhapus; dialog konfirmasi (bukan `window.confirm`)
- **Verifikasi**: uji API + `bash scripts/smoke.sh`

### T-403 — Perapian UI/UX responsif

- **Status**: doing
- **Cakupan**: `components/ui/Icon.tsx`, `components/ui/ConfirmDialog.tsx`, `components/chat/*`, `app/globals.css`, `app/page.tsx`
- **Kriteria penerimaan**: ikon SVG (bukan emoji); semua kontrol ≥ 44 px di HP; header & komposer sticky dengan area aman; input 16 px di HP (cegah zoom iOS); tidak ada overflow 320–1440 px
- **Verifikasi**: uji browser 360/768/1440 px + screenshot

### T-404 — Verifikasi akhir M4 di produksi

- **Status**: todo
- **Dependency**: T-401, T-402, T-403
- **Kriteria penerimaan**: FR-12 & FR-13 terverifikasi di produksi; uji browser ulang; `pnpm build` & `pnpm test` hijau
- **Verifikasi**: hasil di PROGRESS-LOG

---

## M5 — Tema, sidebar bisa ditutup, footer, identitas Kirby, memori otomatis

### T-501 — Tema terang & gelap

- **Status**: doing
- **Cakupan**: `app/globals.css` (token tema terang), `app/layout.tsx` (skrip anti-kedip), `components/ui/ThemeToggle.tsx`, `app/pengaturan/page.tsx`
- **Kriteria** (FR-14): sakelar mengubah `data-tema` + warna; pilihan diingat (`localStorage`); bawaan ikut `prefers-color-scheme`; tidak ada kedipan warna saat muat pertama
- **Verifikasi**: uji browser (warna terhitung di 1440 px & 360 px)

### T-502 — Sidebar bisa ditutup + footer rapi

- **Status**: doing
- **Cakupan**: `app/page.tsx` (tombol panel, `sidebarRingkas`), `components/chat/Sidebar.tsx`, `app/layout.tsx` (grid `1fr auto`)
- **Kriteria** (FR-15): sidebar bisa disembunyikan di ≥ 768 px dan diingat; footer selalu terlihat penuh, tidak tertimpa sidebar/komposer di 360/768/1440 px
- **Verifikasi**: uji browser (rect footer + `display` sidebar)

### T-503 — Identitas Kirby + durasi jawaban

- **Status**: doing
- **Cakupan**: `components/chat/MessageList.tsx`, `lib/api.ts` (durasi), `lib/ai/prompts.ts` (nama persona), `public/image/kirby-{64,96}.png`
- **Kriteria** (FR-16): avatar + label "Kirby · X,X detik · jam"; teks "Kirby sedang menjawab..."; chip dokumen dihapus dari tampilan
- **Verifikasi**: uji browser (jumlah avatar, ada/tidak chip, format label)

### T-504 — Memori otomatis dengan penyaring

- **Status**: doing
- **Cakupan**: `lib/memory.ts` (`ekstrakKandidatMemori`, `layakDisimpan`, `saringKandidat`, `simpanMemoriOtomatis`), `app/api/chat/route.ts` (`onFinish`), `components/settings/MemoryAutoToggle.tsx`, `lib/env.ts` (`GROQ_MODEL_MEMORI`)
- **Kriteria** (FR-12): fakta tahan lama tersimpan otomatis; keluhan sesaat & data sensitif ditolak; maks 2 per pertukaran, total maks 90 baris; `autoMemori:false` tidak menyimpan
- **Verifikasi**: `lib/memory.test.ts` + uji API di lokal & produksi

### T-505 — Sapaan awal memakai panggilan dari memori

- **Status**: doing
- **Cakupan**: `lib/panggilan.ts`, `components/chat/MessageList.tsx` (EmptyState)
- **Kriteria**: sapaan "Hi {panggilan}, Kirby di sini poyoo~"; tanpa memori panggilan → tampa nama; memori nonaktif diabaikan
- **Verifikasi**: `lib/panggilan.test.ts` + uji browser

### T-506 — Sesi 24 jam + ganti kode akses di produksi

- **Status**: done
- **Cakupan**: `lib/session.ts` (`MAX_AGE_SECONDS` = 24 jam), env Vercel `APP_ACCESS_CODE` (Production), ADR-004 + TECH-SPEC
- **Kriteria**: cookie sesi `Max-Age=86400`; nilai cookie = HMAC kode baru sehingga sesi lama otomatis tidak sah; kode lama tidak berlaku lagi di produksi
- **Verifikasi**: `curl -i -X POST /api/unlock` (cek `Set-Cookie`) + `GET /api/conversations` dengan cookie lama → 401

---

## M6 — Indikator ganda, latar transparan, jawaban tidak kaku, gerak UI

### T-601 — Perbaikan indikator "sedang menjawab" berulang

- **Status**: done
- **Cakupan**: `app/page.tsx` (`setSibuk(false)` sebelum pemeriksaan memori), `components/chat/MessageList.tsx`
- **Penyebab**: `sibuk` masih `true` selama jeda 2,5 detik pengecekan memori padahal `streaming` sudah dikosongkan → `menunggu` jadi `true` lagi sehingga indikator muncul ulang setelah balasan tampil
- **Kriteria**: indikator hanya tampil sekali saat menunggu; hilang saat balasan masuk dan tidak muncul lagi
- **Verifikasi**: timeline browser (0,7 detik: 3 titik → 3,6 detik: 0 titik, tetap 0 sampai 15 detik)

### T-602 — Latar transparan pada fitur gambar

- **Status**: done
- **Cakupan**: `lib/ai/styles.ts` (`PETUNJUK_TRANSPARAN`), `lib/ai/image.ts`, `app/api/images/route.ts`, `app/api/images/file/route.ts`, `components/image/UnduhTransparan.tsx`, `app/gambar/page.tsx`
- **Keputusan**: model Workers AI selalu membalas JPEG (tanpa alfa) — dicek langsung, `flux-2-klein-4b` mengembalikan JPEG 1024×1024 dan tidak ada model `remove-background` di akun. Jadi latar dibuat putih rata lewat prompt, lalu dibuang di browser (flood-fill dari tepi + penghalusan tepi) dan diunduh sebagai PNG.
- **Kriteria**: checkbox tersedia; hasil unduhan PNG punya piksel transparan nyata
- **Verifikasi**: uji alfa di browser → 81,2% piksel transparan

### T-603 — Hapus jawaban penolakan kaku

- **Status**: done
- **Cakupan**: `lib/ai/prompts.ts` (`SYSTEM_CHAT`), `docs/PRD.md` FR-4
- **Kriteria**: pertanyaan di luar dokumen tetap dijawab + catatan "bukan dari dokumen"; frasa "tidak ada di dokumen yang kamu tambahkan" dilarang di prompt
- **Verifikasi**: uji percakapan (jawaban tidak lagi menolak) + tinjauan prompt

### T-604 — Gerak UI: Framer Motion + Lenis

- **Status**: done
- **Cakupan**: `lib/motion.ts` (token durasi 150–400 ms + kurva standar), `components/chat/MessageList.tsx`, `components/ui/ConfirmDialog.tsx`, `components/chat/useLenis.ts`, `app/page.tsx`, `app/gambar/page.tsx`
- **Catatan penting**: animasi *exit* lewat `AnimatePresence` pada elemen `fixed`/bubble menyisakan node tak terlihat di DOM (indikator tetap ada, overlay dialog menutupi layar). Karena itu animasi hanya dipakai untuk masuk (enter); elemen keluar di-unmount langsung.
- **Kriteria**: pesan & kartu beranimasi dengan token yang sama; dialog tertutup bersih; Lenis aktif pada wadah gulir chat; `prefers-reduced-motion` mematikan animasi/lenis
- **Verifikasi**: hitungan elemen beranimasi, dialog buka→Batal (overlay 0), `main` punya class `lenis`

---

## M0 — Fondasi

### T-001 — Scaffold Next.js + TypeScript + Tailwind + pnpm

- **Status**: todo
- **Dependency**: —
- **Estimasi**: M
- **Cakupan**: `package.json`, `app/`, `tsconfig.json`, `next.config.ts`, `app/globals.css`, `lib/env.ts`
- **Kriteria penerimaan**:
  - `pnpm install` lalu `pnpm build` exit 0
  - `lib/env.ts` memvalidasi env dengan zod dan **gagal cepat** kalau ada variabel wajib yang kosong
  - Versi di `package.json` sama dengan tabel di `AGENTS.md` §Stack
- **Verifikasi**: `pnpm build` (tunjukkan output aslinya)

### T-002 — Skema Drizzle + pgvector + migrasi ke Supabase

- **Status**: todo
- **Dependency**: T-001
- **Estimasi**: L
- **Cakupan**: `lib/db/schema.ts`, `lib/db/client.ts`, `drizzle/`, `drizzle.config.ts`
- **Kriteria penerimaan**:
  - Tabel `conversations`, `messages`, `documents`, `chunks`, `images` ada di Supabase dan cocok dengan `docs/TECH-SPEC.md` §4
  - Ekstensi `vector` aktif; kolom `chunks.embedding` bertipe `vector(1024)`; indeks HNSW ada
  - `pnpm db:migrate` exit 0; satu baris uji insert + select berhasil lalu dihapus
- **Verifikasi**: `pnpm db:migrate` lalu
  `psql "$DIRECT_URL" -c "\d+ chunks"` (potongan skema menunjukkan `vector(1024)`)

### T-003 — Gerbang akses (kode tunggal) + cookie sesi

- **Status**: todo
- **Dependency**: T-001
- **Estimasi**: M
- **Cakupan**: `app/api/unlock/route.ts`, `app/api/health/route.ts`, `lib/session.ts`, `app/lock/page.tsx`
- **Kriteria penerimaan** (ADR-004):
  - `POST /api/unlock` dengan kode benar → 200 + cookie httpOnly; kode salah → 401
  - `GET /api/conversations` tanpa cookie → 401
  - `GET /api/health` → 200 tanpa cookie, body memuat status DB
- **Verifikasi**: `bash scripts/smoke.sh` bagian "gerbang akses" (tunjukkan output)

### T-004 — Shell UI sesuai DESIGN.md

- **Status**: todo
- **Dependency**: T-001
- **Estimasi**: L
- **Cakupan**: `app/layout.tsx`, `app/page.tsx`, `components/chat/*`, `components/ui/*`, token di `app/globals.css`
- **Kriteria penerimaan**:
  - Halaman memuat: top bar, sidebar (tombol "+ Percobaan baru", daftar percakapan, pemilih mode), area pesan, composer, tautan Galeri
  - Semua warna/jarak diambil dari token; `grep -rE "#[0-9a-fA-F]{6}" components app | grep -v globals.css` tidak menemukan hex mentah
  - Di lebar 360 px sidebar jadi drawer dan bisa ditutup
- **Verifikasi**: `pnpm build` && `grep -rE "#[0-9a-fA-F]{6}" components app --include=*.tsx`

---

## M1 — Chat, memori, curhat, RAG

### T-101 — Endpoint chat streaming + simpan pesan

- **Status**: todo
- **Dependency**: T-002, T-003
- **Estimasi**: L
- **Cakupan**: `app/api/chat/route.ts`, `lib/ai/groq.ts`, `lib/ai/prompts.ts`
- **Kriteria penerimaan**:
  - `POST /api/chat` mengembalikan respons streaming dan menyimpan 2 baris di `messages`
  - Provider gagal → HTTP ≥ 400 + pesan Indonesia yang jelas (bukan layar kosong)
  - Prompt sistem chat hidup di `lib/ai/prompts.ts`
- **Verifikasi**: FR-1 dan FR-2 di `docs/PRD.md` §6 via `bash scripts/smoke.sh`

### T-102 — Kelola percakapan (daftar, ganti judul, hapus)

- **Status**: todo
- **Dependency**: T-101
- **Estimasi**: M
- **Cakupan**: `app/api/conversations/route.ts`, `app/api/conversations/[id]/route.ts`, `components/chat/Sidebar.tsx`
- **Kriteria penerimaan**:
  - `PATCH` mengubah judul; `DELETE` menghapus percakapan **beserta** pesannya (cascade terbukti)
  - Judul otomatis dari 6 kata pertama pesan pertama kalau belum diberi nama
- **Verifikasi**: FR-10 di `docs/PRD.md` §6 via `bash scripts/smoke.sh`

### T-103 — Mode curhat (system prompt terpisah + penanda visual)

- **Status**: todo
- **Dependency**: T-101
- **Estimasi**: S
- **Cakupan**: `lib/ai/prompts.ts`, `app/api/chat/route.ts`, `components/chat/ModeSwitch.tsx`
- **Kriteria penerimaan**:
  - `conversations.mode` = `curhat`; percakapan curhat tidak muncul di daftar mode chat (terpisah filter)
  - Prompt sistem curhat: empati dulu, tanpa diagnosis, tautan bantuan bila ada indikasi krisis
  - Uji banding manual (prompt sama di 2 mode) dicatat di PROGRESS-LOG
- **Verifikasi**: FR-5 di `docs/PRD.md` §6 + catatan manual

### T-104 — Ingest dokumen (file & URL) → chunk → embedding

- **Status**: todo
- **Dependency**: T-002
- **Estimasi**: L
- **Cakupan**: `lib/rag/chunk.ts`, `lib/rag/embed.ts`, `app/api/rag/ingest/route.ts`, `scripts/rag-ingest.ts`
- **Kriteria penerimaan**:
  - Chunk 1000 karakter, overlap 150, `ordinal` berurutan; test unit batas & overlap
  - `checksum` mencegah ingest dokumen yang sama dua kali (ingest ulang → ditolak dengan pesan jelas)
  - URL diambil lewat Firecrawl dan disimpan sebagai markdown
  - `pnpm rag:ingest <file|url>` exit 0, mencetak jumlah chunk
- **Verifikasi**: FR-3 di `docs/PRD.md` §6 + `pnpm test`

### T-105 — Retrieval + injeksi konteks + tampilkan sumber

- **Status**: todo
- **Dependency**: T-104
- **Estimasi**: L
- **Cakupan**: `lib/rag/retrieve.ts`, `app/api/chat/route.ts`, `components/chat/MessageList.tsx`
- **Kriteria penerimaan**:
  - Top-k 4, ambang kosinus ≥ 0.35; skor di bawah ambang tidak dipakai
  - Chip sumber (judul dokumen + skor) tampil di bawah balasan yang memakai konteks
  - Konteks tidak memuat jawaban → balasan jujur "tidak ada di dokumen", bukan karangan
- **Verifikasi**: FR-4 di `docs/PRD.md` §6 via `pnpm rag:query` + 5 pertanyaan uji (dicatat di PROGRESS-LOG)

### T-106 — Halaman chat end-to-end (UI ↔ API)

- **Status**: todo
- **Dependency**: T-101, T-104, T-105
- **Estimasi**: L
- **Cakupan**: `app/page.tsx`, `components/chat/*`
- **Kriteria penerimaan**:
  - Kirim pesan dari UI → balasan streaming muncul bertahap → pesan tetap ada setelah halaman di-refresh
  - Ganti percakapan dari sidebar memuat riwayatnya
- **Verifikasi**: FR-2 (memori) + FR-11 di `docs/PRD.md` §6 + `pnpm build`

---

## M2 — Generate image

### T-201 — Generate image (text-to-image) + simpan ke Storage + metadata

- **Status**: todo
- **Dependency**: T-002, T-003
- **Estimasi**: L
- **Cakupan**: `lib/ai/image.ts`, `lib/storage/upload.ts`, `app/api/images/route.ts`
- **Kriteria penerimaan** (ADR-003):
  - Panggilan ke Cloudflare memakai `FormData` multipart, field `prompt` (+ `width`/`height`)
  - Bucket `images` dibuat; file tersimpan; baris `images` memuat prompt, style, model, aspect_ratio, url
  - Error provider (termasuk NSFW false-positive) → pesan jelas + baris `error` dicatat, UI tidak kosong
- **Verifikasi**: FR-6 dan FR-7 di `docs/PRD.md` §6 via `bash scripts/smoke.sh`

### T-202 — Image-to-image (gambar referensi)

- **Status**: todo
- **Dependency**: T-201
- **Estimasi**: M
- **Cakupan**: `app/api/images/route.ts`, `components/image/ImageForm.tsx`
- **Kriteria penerimaan**:
  - Gambar referensi dikirim sebagai field `input_image_0` (nama field lain diabaikan tanpa error — jangan salah tulis)
  - Kolom `source_image` terisi; antar muka membatasi 1 gambar referensi, maks 4 MB, tipe png/jpeg/webp
- **Verifikasi**: FR-8 di `docs/PRD.md` §6

### T-203 — Pilihan style, model, aspect ratio

- **Status**: todo
- **Dependency**: T-201
- **Estimasi**: M
- **Cakupan**: `lib/ai/styles.ts`, `components/image/ImageForm.tsx`
- **Kriteria penerimaan**:
  - Ratio tersedia: 1:1 (1024x1024), 16:9 (1344x768), 9:16 (768x1344), 4:3 (1152x896), 3:4 (896x1152)
  - Style: anime, foto, 3d, sketsa, watercolor, cyberpunk — masing-masing memetakan ke potongan prompt
  - Model bisa dipilih: `flux-2-klein-4b` (default), `flux-2-klein-9b`, `flux-1-schnell`; memilih `flux-1-schnell` + gambar referensi ditolak dengan pesan jelas (tidak mendukung)
- **Verifikasi**: `pnpm test` (pemetaan ratio→dimensi & style→prompt) + uji manual 5 gaya

### T-204 — Galeri gambar

- **Status**: todo
- **Dependency**: T-201
- **Estimasi**: M
- **Cakupan**: `app/gallery/page.tsx`, `components/image/ImageGrid.tsx`, `app/api/images/route.ts`
- **Kriteria penerimaan**:
  - Grid responsif (1 kolom di 360 px, 3–4 kolom di desktop); prompt tiap gambar tampil
  - Gambar punya `alt` berisi prompt; tombol unduh bekerja
- **Verifikasi**: FR-9 di `docs/PRD.md` §6 + checklist visual DESIGN.md §5

---

## M3 — Kualitas & rilis

### T-301 — Penanganan error & status loading di semua rute

- **Status**: todo
- **Dependency**: T-106, T-204
- **Estimasi**: M
- **Cakupan**: semua `app/api/*`, `components/**`
- **Kriteria penerimaan**:
  - Setiap kegagalan provider menghasilkan pesan Indonesia yang menyebut langkah berikutnya
  - Status loading tekstual untuk chat & gambar
- **Verifikasi**: `bash scripts/smoke.sh` dengan `CLOUDFLARE_API_TOKEN` sengaja dikosongkan → semua rute balas pesan error, bukan 500 telanjang

### T-302 — Responsif, aksesibilitas, batas laju

- **Status**: todo
- **Dependency**: T-106, T-204
- **Estimasi**: M
- **Cakupan**: `components/**`, `app/**`, `lib/rate-limit.ts`
- **Kriteria penerimaan**:
  - Checklist DESIGN.md §5 & §6 semua tercentang (diuji di 360 px & 1440 px, keyboard-only)
  - Batas laju: 30 permintaan/menit per cookie untuk `/api/chat` dan `/api/images`; kelebihan → 429 pesan jelas
- **Verifikasi**: catatan manual (screenshot) + `curl` loop 35x → dua respons terakhir 429

### T-303 — Deploy Vercel + environment variables

- **Status**: todo
- **Dependency**: semua task M1, M2
- **Estimasi**: M
- **Cakupan**: Vercel project, env produksi, `docs/TECH-SPEC.md` §10
- **Kriteria penerimaan**:
  - Deploy produksi berhasil dari branch `main`; `GET /api/health` produksi → 200
  - Tidak ada kunci yang ter-commit (`git log -p -- .env` kosong; `.env` tak pernah terlacak)
  - Migrasi DB dijalankan ke project Supabase yang benar
- **Verifikasi**: URL produksi + output `curl https://<domain>/api/health`

### T-304 — Uji semua kriteria FR + tutup v1

- **Status**: todo
- **Dependency**: T-301, T-302, T-303
- **Estimasi**: M
- **Cakupan**: `scripts/smoke.sh`, `docs/PROGRESS-LOG.md`, status di file ini
- **Kriteria penerimaan**:
  - FR-1..FR-11 di `docs/PRD.md` §6 dijalankan satu per satu; hasil asli dicatat di PROGRESS-LOG
  - Pertanyaan terbuka must di PRD §10 statusnya berubah atau dihapus
  - Semua task di file ini berstatus `done`
- **Verifikasi**: `bash scripts/smoke.sh` (semua exit 0) + entri PROGRESS-LOG

---

## Template task (salin ini untuk task baru)

```
### T-0NN — <judul>

- **Status**: todo
- **Dependency**: <task ID atau —>
- **Estimasi**: S / M / L
- **Cakupan**: <...>
- **Kriteria penerimaan**:
  - <...>
- **Verifikasi**: `<command>`
```

---

## M7 — Lampiran sekali pakai, markdown rapi, regenerate, saran lanjutan

### T-701 — Lampiran hanya sekali pakai
- **Cakupan**: `lib/rag/ingest.ts` (`hapusLampiranPercakapan`), `app/api/chat/route.ts` (`onFinish`), `app/page.tsx` (chip lampiran dilepas setelah balasan)
- **Bukti**: unggah `uji.txt` → tanya → unggah ulang teks yang sama → `ditimpa:false` (dokumen lama sudah tidak ada). Nama berkas tetap terlihat di chip "Konteks" karena diambil dari `messages.sources`.

### T-702 — Markdown dirender di balasan
- **Cakupan**: `lib/markdown.ts` (parser sendiri, tanpa HTML mentah), `components/chat/Markdown.tsx`, `components/chat/MessageList.tsx`
- **Bukti**: `pnpm test` 57 lulus (termasuk uji tautan `javascript:` ditolak); uji browser: `strong` 7, `li` 11, sisa `**` di DOM 0.

### T-703 — Chip konteks di balasan
- Baris "Konteks" berisi nama dokumen yang dipakai menjawab (dedupe, dipotong 220 px).

### T-704 — Regenerate
- Tombol ikon (`ulang`) di balasan terakhir. Server membuang balasan terakhir lalu menjawab ulang tanpa menyimpan pesan pengguna dua kali. `autoMemori` dimatikan saat regenerate supaya memori tidak dobel.

### T-705 — Saran lanjutan + sakelar navbar
- `POST /api/saran` memakai model `GROQ_MODEL_MEMORI` (`gpt-oss-20b`): `maxOutputTokens` 700 + `reasoningEffort: low`, karena jatah kecil membuat balasan kosong (`finish_reason=length`) akibat token reasoning.
- Sakelar ikon bintang di navbar; pilihan disimpan di `localStorage` (`ohmysea-saran`).

---

## M8 — Konteks lampiran yang terbaca & tampil

Latar: chip konteks hanya muncul bila skor retrieval ≥ 0.30, jadi pertanyaan pendek
membuat lampiran tampak "tidak terbaca" walau model memakainya. Pesan pengguna juga
tak pernah menampilkan berkas yang dibawanya.

### T-801 — Chip berkas di bubble pesan pengguna
- **Cakupan**: `components/chat/MessageList.tsx`, `app/page.tsx`
- **Bukti**: pesan pengguna menampilkan baris "Konteks" berisi nama berkas, termasuk
  saat streaming (chip dari lampiran aktif), lalu diganti data `messages.sources`.

### T-802 — Lampiran selalu jadi konteks
- **Cakupan**: `lib/rag/retrieve.ts`, `app/api/chat/route.ts`
- **Bukti**: `pilihPotongan()` memakai dokumen lampiran tanpa ambang skor, dicatat ke
  `sources` pesan pengguna. 5 test baru (`lib/rag/retrieve.test.ts`).

### T-803 — Hilangkan lomba conversationId
- **Bukti**: `aktifIdRef` di `app/page.tsx` dipakai jalur kirim/ulang, bukan `aktif?.id`.

### T-804 — Konteks hanya dari berkas terunggah
- **Cakupan**: `lib/rag/retrieve.ts` (`hanyaLampiran`), `app/api/chat/route.ts`
- **Bukti**: saat percakapan punya lampiran, query global (`conversation_id is null`)
  tidak dijalankan — chip konteks hanya berisi berkas yang diunggah.

---

## M9 — Berkas per sesi, memori paten, chip konteks bersih

### T-901 — Berkas menempel ke sesi percakapan
- **Cakupan**: `app/api/chat/route.ts`, `app/api/conversations/[id]/route.ts`, `app/page.tsx`, `components/chat/Composer.tsx`, `lib/rag/ingest.ts`
- **Bukti**: `hapusLampiranPercakapan()` dihapus; berkas tetap ada selama percakapan dan dipakai turn berikutnya; daftar "Berkas sesi" tampil di komposer.

### T-902 — Memori paten terpisah dari memori otomatis
- **Cakupan**: `lib/db/schema.ts` (`permanent_memories`), `drizzle/0003_high_iron_fist.sql`, `lib/memory.ts`, `app/api/memories/*`, `components/settings/MemoryPanel.tsx`, `lib/api.ts`
- **Bukti**: migrasi menambah tabel `permanent_memories`; panel dua bagian; memori paten tidak pernah diubah proses otomatis; prompt memakai keduanya (paten dulu).

### T-903 — Chip konteks hanya untuk berkas unggahan
- **Bukti**: `sources` balasan difilter ke `documentId` lampiran; dokumen global tetap dipakai menjawab.

### T-904 — Layar awal tanpa kartu saran
- **Bukti**: `EmptyState` tinggal sapaan + satu baris penjelasan.

---

## M10 — Gerak UI lanjutan: GSAP + ScrollTrigger

Latar: pemilik minta animasi kelas situs profesional (GSAP + ScrollTrigger),
tanpa membuang framer-motion. Ditambahkan 2026-11-23.

### T-1001 — Hero GSAP + reveal galeri + sinkron Lenis

- **Status**: done
- **Dependency**: T-604
- **Cakupan**: `package.json` (`gsap` 3.15.1, `@gsap/react` 2.1.2), `lib/motion.ts` (`GSAP_EASE`), `components/chat/useLenis.ts`, `components/chat/MessageList.tsx` (`EmptyState`), `app/gambar/page.tsx`, `app/page.tsx` (kirim `wadahGulir`)
- **Kriteria penerimaan**:
  - Sapaan hero chat masuk berurutan (avatar → judul → subjudul) + parallax halus saat chat digulir.
  - Kartu galeri ter-reveal sekali saat masuk viewport (ScrollTrigger pada wadah gulir halaman).
  - Lenis menjalankan rAF lewat `gsap.ticker` dan meneruskan gulir ke `ScrollTrigger.update` (bukan rAF ganda).
  - `prefers-reduced-motion` **diabaikan**: animasi & Lenis selalu aktif (keputusan pemilik, 2026-11-23).
  - Durasi/ease dari `lib/motion.ts` (tidak ada angka durasi baru di komponen).
- **Verifikasi**: `pnpm build` EXIT=0; `pnpm test` 62 lulus; `pnpm lint` EXIT=0. Bukti visual ScrollTrigger (gulir nyata) belum diuji otomatis — perlu mata di browser.

### T-1002 — Poles UX chat (smart scroll, salin, drag-drop, waktu relatif)

- **Status**: done
- **Dependency**: T-1001
- **Cakupan**: `components/chat/MessageList.tsx`, `components/chat/Composer.tsx`, `components/chat/Sidebar.tsx`, `components/ui/Icon.tsx`, `lib/waktu.ts` (+ test)
- **Kriteria penerimaan**:
  - Balasan streaming tidak menarik paksa layar bila pengguna sedang membaca ke atas; tombol "Pesan terbaru" muncul dan mengembalikan ke dasar.
  - Balasan asisten bisa disalin dengan umpan balik centang.
  - Berkas bisa dilepas ke komposer; penghitung karakter tampil >3000 dan kirim terkunci >4000.
  - Daftar percakapan menampilkan waktu relatif; aksi baris muncul saat hover/fokus di desktop.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` 9 file / 65 lulus.

### T-1003 — Animasi AI & aliran jawaban halus

- **Status**: done
- **Dependency**: T-1002
- **Cakupan**: `app/page.tsx` (buffer frame), `components/chat/MessageList.tsx`, `app/globals.css`
- **Kriteria penerimaan**:
  - Potongan stream dicat sekali per frame (tidak ada render per token).
  - Status menunggu: titik naik-turun berskala + teks berkilau; kursor menulis pudar lembut.
  - Balasan asisten `15px / line-height 28px`, `text-pretty`.
  - Avatar Kirby tanpa bingkai lingkaran.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` 9 file / 65 lulus.

### T-1004 — Chat tidak lagi macet "Memuat..." saat kembali dari Pengaturan

- **Status**: done
- **Dependency**: T-1003
- **Cakupan**: `app/page.tsx`
- **Kriteria penerimaan**:
  - Layar chat hanya menunggu `muatDaftar`; lencana memori tidak menahan tampilan.
  - Panggilan daftar dibatasi 8 dtk; lewat batas menampilkan pesan + tombol **Coba lagi**.
  - Unmount membatalkan set-state (`batal`), jadi tidak ada pembaruan setelah navigasi.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` 10 file / 69 lulus.

---

## M11 - Ruang main: opsi game di chat

Latar: pemilik minta opsi game di chat, bisa dimainkan langsung dengan UI
interaktif. Ditambahkan 2026-11-23. Tanpa API/DB/dependency baru — semua di klien.

### T-1101 — Logika murni tiga game

- **Status**: done
- **Dependency**: —
- **Cakupan**: `lib/game.ts`, `lib/game.test.ts`
- **Kriteria penerimaan**:
  - Tic Tac Toe: deteksi tiga sejajar, minimax penuh untuk level sulit.
  - Empat Berderet: gravitasi keping, deteksi empat sejajar 4 arah, heuristik menang/blokir.
  - Kartu Ingatan: dek 16 kartu (8 wajah ekspresi Kirby × 2) teracak.
- **Verifikasi**: `pnpm test` 11 file / 80 lulus (termasuk 120 permainan TTT level sulit tanpa kalah).

### T-1102 — UI papan interaktif

- **Status**: done
- **Dependency**: T-1101
- **Cakupan**: `components/game/bersama.tsx`, `components/game/PapanTicTacToe.tsx`, `components/game/PapanEmpatBerderet.tsx`, `components/game/PapanIngatan.tsx`, `components/ui/Icon.tsx` (`game`, `kisi`)
- **Kriteria penerimaan**:
  - Tiap papan punya papan skor, status giliran/hasil, dan tombol "Mulai ulang".
  - Giliran Kirby punya jeda singkat supaya terasa hidup; papan terkunci saat giliran Kirby.
  - Sel/kartu yang menang disorot; markah/keping beranimasi masuk memakai token `lib/motion.ts`.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0.

### T-1103 — Panel ruang main di chat

- **Status**: done
- **Dependency**: T-1102
- **Cakupan**: `components/game/GamePanel.tsx`, `app/page.tsx`
- **Kriteria penerimaan**:
  - Tombol ikon game di header chat membuka panel `role="dialog"` `aria-modal`.
  - Panel berisi pemilih 3 game + papan aktif; tutup lewat tombol, klik latar, atau `Esc`.
  - Tema terang/gelap ikut token `app/globals.css` (tanpa hex baru).
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` 80 lulus.

---

## M12 - Ruang main dipoles

Latar: pemilik menilai keping Empat Berderet kurang kontras, minta UI/animasi
dimaksimalkan di tiga game, Kirby bereaksi seperti bot catur, dan lagu mode game
dengan tombol nyala/mati. Ditambahkan 2026-11-23. Tetap tanpa API/DB/dependency.

### T-1201 — Kontras & animasi papan

- **Status**: done
- **Dependency**: T-1103
- **Cakupan**: `components/game/PapanEmpatBerderet.tsx`, `PapanTicTacToe.tsx`, `PapanIngatan.tsx`, `components/game/bersama.tsx`, `app/globals.css`
- **Kriteria penerimaan**:
  - Keping Empat Berderet jelas di tema gelap & terang: kamu `bg-aksen`, Kirby `bg-teks`, keduanya ber-ring, lubang `bg-bg-main`; kolom tersorot menampilkan bayangan keping di baris tempat keping akan mendarat.
  - Keping jatuh dengan pegas; kartu ingatan berputar 3D dan bergetar saat pasangan salah; garis kemenangan TTT tergambar beranimasi.
  - Sel/kartu memberi umpan balik hover dan terkunci saat giliran Kirby.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0.

### T-1202 — Reaksi & ekspresi Kirby

- **Status**: done
- **Dependency**: T-1201
- **Cakupan**: `components/game/reaksi.ts`, `components/game/bersama.tsx` (`AvatarKirby`, `BarKirby`), ketiga papan, `app/globals.css`
- **Kriteria penerimaan**:
  - Bilah Kirby (avatar + ucapan) berganti hanya pada momen berarti: menghitung, memblokir langkah, lawan terancam, menang, kalah, seri, kartu ketemu/beres, ganti game.
  - Ekspresi `tenang/pikir/senang/kaget/sedih/malu/fokus/tertawa/bingung/sapaan` dari satu lembar sprite (potongan `background-position`), ucapan Bahasa Indonesia singkat.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0.

### T-1203 — Lagu mode game + tombol nyala/mati

- **Status**: done
- **Dependency**: T-1103
- **Cakupan**: `lib/game/lagu.ts`, `components/game/GamePanel.tsx`, `components/ui/Icon.tsx` (`suara`, `bisu`)
- **Kriteria penerimaan**:
  - Chiptune prosedural (Web Audio, penjadwal lookahead) — tanpa file audio/dependency.
  - Tombol nyala/mati di header panel; pilihan disimpan di `localStorage`; audio berhenti saat panel ditutup.
  - `mulai()` dicoba ulang saat interaksi pertama supaya lolos kebijakan autoplay browser.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` 84 lulus (termasuk A4 = 440 Hz + validasi nada lagu).

### T-1204 — Uji logika baru

- **Status**: done
- **Dependency**: T-1201, T-1203
- **Cakupan**: `lib/game.ts` (`langkahMenangTTT`, `bisaMenangCO` diekspor), `lib/game.test.ts`
- **Kriteria penerimaan**: `langkahMenangTTT` mengembalikan sel penentu kemenangan; semua nada lagu divalidasi.
- **Verifikasi**: `pnpm test` **11 file / 84 lulus** EXIT=0.

---

## M13 - Cari riwayat + Kirby bersuara

Latar: pemilik memilih dua pengembangan dari daftar usulan — pencarian riwayat
sampai isi pesan (B1) dan Kirby bersuara/TTS (B3). Ditambahkan 2026-11-23.
Tanpa dependency baru, tanpa perubahan skema DB.

### T-1301 — Cari riwayat sampai isi pesan

- **Status**: done
- **Dependency**: M10
- **Cakupan**: `app/api/conversations/route.ts`, `lib/api.ts`, `components/chat/Sidebar.tsx`, `app/page.tsx`
- **Kriteria penerimaan**:
  - `GET /api/conversations?cari=<kata>` mencocokkan judul **dan** isi pesan (ILIKE), hasil menyertakan `cuplikan` dari pesan pertama yang cocok.
  - Kata kunci kosong mengembalikan daftar penuh seperti sebelumnya; maksimal 50 hasil, urut `updatedAt` terbaru.
  - Sidebar: kotak cari dengan jeda 280 ms, jumlah hasil, baris hasil menampilkan cuplikan; tombol bersihkan memuat daftar penuh lagi.
  - `%`, `_`, `\` dinetralkan supaya tidak menjadi wildcard.
- **Verifikasi**: `curl` dengan cookie sesi → `cari=kamu` mengembalikan 3 baris berisi `cuplikan`; `cari=%` hanya memuat baris tanpa `cuplikan` (bukan seluruh isi DB). `pnpm lint` EXIT=0.

### T-1302 — Kirby bersuara (TTS)

- **Status**: done
- **Dependency**: M10
- **Cakupan**: `lib/suara.ts`, `components/chat/MessageList.tsx`, `lib/suara.test.ts`
- **Kriteria penerimaan**:
  - Tombol speaker di setiap balasan asisten; klik membacakan teks, klik lagi menghentikan.
  - Markdown dibersihkan sebelum dibaca: blok kode dan gambar dilewati, penanda tebal/miring/tautan/daftar dibuang, emoji tidak ikut dibaca.
  - Voice dipilih dengan skor (Natural/Neural/Online, utamakan `id-ID`); daftar voice ditunggu (`voiceschanged`) supaya klik pertama tidak jatuh ke voice default.
  - Teks dipecah per kalimat; klausa Inggris memakai voice Inggris, klausa Indonesia memakai voice Indonesia. Pitch 1.65 + rate 1.03 (pendekatan kartun).
  - Jeda mengikuti tanda baca: akhir kalimat 220 ms, klausa (`;:`/`—`) 140 ms, koma 80 ms. Potongan karena panjang tanpa tanda baca diberi jeda 0.
  - Kalimat panjang dipotong di batas aman: tidak setelah preposisi/konjungsi/artikel (`di`, `ke`, `untuk`, `yang`, `the`, `of`, dst.) dan tidak sebelum kata sambung.
  - Suara berhenti saat komponen dilepas (pindah halaman/mode).
  - Tanpa dependency, tanpa file audio; browser tanpa `speechSynthesis` tidak error (tombol tidak melakukan apa pun).
- **Verifikasi**: `pnpm test` — `lib/suara.test.ts` 14 uji lulus (markdown, emoji, skor voice id/en, deteksi bahasa, pemecahan klausa, jeda per tanda baca, batas frasa aman).

### T-1303 — Uji & verifikasi

- **Status**: done
- **Dependency**: T-1301, T-1302
- **Cakupan**: `lib/suara.test.ts`
- **Kriteria penerimaan**: pembersihan markdown, skor voice id/en, deteksi bahasa, jeda per tanda baca, dan batas frasa aman diuji.
- **Verifikasi**: `pnpm test` **12 file / 98 lulus** EXIT=0; `pnpm build` EXIT=0.

---

## M14 - Ekspresi Kirby dari lembar sprite

Latar: pemilik menambahkan lembar sprite Kirby (1200×896, grid 4×3) dan minta
ekspresinya dipakai untuk setiap tampilan Kirby yang sesuai. Ditambahkan
2026-11-23. Tanpa dependency, tanpa perubahan skema.

### T-1401 — Komponen sprite + pemetaan ekspresi

- **Status**: done
- **Dependency**: M12, M13
- **Cakupan**: `components/ui/Kirby.tsx` (baru), `components/chat/MessageList.tsx`, `components/game/bersama.tsx`, `components/game/GamePanel.tsx`, ketiga papan, `components/game/reaksi.ts`
- **Kriteria penerimaan**:
  - Satu komponen `Kirby` memotong lembar sprite `public/image/expressions/Gemini_Generated_Image_1hptz91hptz91hpt.png` lewat `background-position`; 12 ekspresi tersedia (`tenang/senang/pikir/nyaman/kaget/bingung/malu/sedih/tertawa/fokus/lesu/sapaan`).
  - Chat: sapaan awal `sapaan`, saat menunggu/menulis `pikir`, balasan bernada main `senang`, balasan biasa `tenang`.
  - Ruang main: `AvatarKirby` memetakan ekspresi game ke sprite + animasi CSS yang sudah ada; menang `tertawa`, seri `bingung`, memblokir `malu`, mengancam `fokus`, sambut game `sapaan`.
  - Tidak ada lagi penggunaan `kirby-96.png` di komponen.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` 98 lulus.

### T-1402 — Wajah kartu flipcard pakai ekspresi Kirby

- **Status**: done
- **Dependency**: T-1401
- **Cakupan**: `lib/game.ts`, `lib/game.test.ts`, `components/game/PapanIngatan.tsx`
- **Kriteria penerimaan**:
  - Delapan wajah kartu adalah ekspresi Kirby (`WAJAH_INGATAN`: `senang/kaget/pikir/malu/tertawa/sedih/bingung/fokus`), bukan nama ikon.
  - Kartu yang terbuka merender potongan sprite Kirby (`<Kirby ekspresi={...} />`), bukan `<Icon>`.
  - Wajah wajib unik supaya tidak ada dua pasangan yang tampak sama — diuji.
  - Jumlah pasangan tetap 8 (16 kartu), `dekIngatan` tidak berubah.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` **12 file / 99 lulus** EXIT=0.

---

## Temuan di luar cakupan

| # | Temuan | Ditemukan saat | Prioritas | Jadi task? |
|---|---|---|---|---|
| F1 | ~~`README copy.md` di root adalah duplikat README kit~~ — sudah dibuang (backup: scratch `ohmysea-backup/`) | setup repo | rendah | selesai |
| F2 | ~~`template/` masih menyimpan salinan kit (docs placeholder)~~ — sudah dibuang setelah crosscheck (11 file template terwakili di root; backup: scratch `ohmysea-backup/template`) | setup repo | rendah | selesai |
| F3 | Kunci Cloudflare/Groq/Firecrawl pernah ditulis di file contoh → dulu disarankan rotasi. **Pemilik memutuskan tidak merotasi.** Risiko diterima: file contoh lama sudah dihapus dan tidak pernah ter-commit/ter-push (untracked sejak awal) | setup repo | tinggi | ditutup oleh keputusan pemilik |
| F4 | Provider gambar pernah menolak prompt wajar dengan error NSFW (false positive) | uji provider | sedang | ya — ditangani di T-301 |
| F5 | `flux-1-schnell` tidak mendukung image-to-image meski ada di katalog "Text-to-Image" | uji provider | rendah | ya — divalidasi di T-203 |
| F6 | `simpanMemoriOtomatis()` memakai `gpt-oss-20b` dengan jatah token kecil; pola yang sama seperti `/api/saran` berisiko balasan kosong karena token reasoning dihabiskan lebih dulu. Kalau memori otomatis terasa tidak jalan, ini penyebab pertamanya | T-705 | sedang | belum — perlu uji terpisah |
| F7 | `components/chat/Composer.tsx` memakai kelas `border-bahaya` / `text-bahaya`, padahal token yang ada `--color-danger` (`border-danger` / `text-danger`). Kelas itu tidak menghasilkan gaya apa pun, jadi status lampiran gagal tidak berwarna merah | T-1101 (lihat Composer) | rendah | belum — perbaikan satu kata |

Jangan perbaiki temuan di luar cakupan saat sesi aktif. Catat saja di sini.

## Definisi selesai

Lihat `AGENTS.md` → "Definisi selesai". Tidak ditulis ulang di sini supaya tidak
ada dua versi yang bisa berbeda.
