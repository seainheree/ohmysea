# TASKS — ohmysea

Status: `todo` / `doing` / `blocked` / `review` / `done`

## Milestone

| Milestone | Isi | Task | Status |
|---|---|---|---|
| M0 | Fondasi: scaffold, DB, skema, gerbang akses, shell UI | T-001..T-004 | done |
| M1 | Chat + memori + RAG sederhana + mode curhat | T-101..T-106 | done |
| M2 | Generate image (text-to-image, image-to-image), galeri | T-201..T-204 | done |
| M3 | Kualitas, responsif, deploy Vercel, uji semua kriteria FR | T-301..T-304 | done |

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

## Temuan di luar cakupan

| # | Temuan | Ditemukan saat | Prioritas | Jadi task? |
|---|---|---|---|---|
| F1 | ~~`README copy.md` di root adalah duplikat README kit~~ — sudah dibuang (backup: scratch `ohmysea-backup/`) | setup repo | rendah | selesai |
| F2 | ~~`template/` masih menyimpan salinan kit (docs placeholder)~~ — sudah dibuang setelah crosscheck (11 file template terwakili di root; backup: scratch `ohmysea-backup/template`) | setup repo | rendah | selesai |
| F3 | Kunci Cloudflare/Groq/Firecrawl pernah ditulis di file contoh → dulu disarankan rotasi. **Pemilik memutuskan tidak merotasi.** Risiko diterima: file contoh lama sudah dihapus dan tidak pernah ter-commit/ter-push (untracked sejak awal) | setup repo | tinggi | ditutup oleh keputusan pemilik |
| F4 | Provider gambar pernah menolak prompt wajar dengan error NSFW (false positive) | uji provider | sedang | ya — ditangani di T-301 |
| F5 | `flux-1-schnell` tidak mendukung image-to-image meski ada di katalog "Text-to-Image" | uji provider | rendah | ya — divalidasi di T-203 |

Jangan perbaiki temuan di luar cakupan saat sesi aktif. Catat saja di sini.

## Definisi selesai

Lihat `AGENTS.md` → "Definisi selesai". Tidak ditulis ulang di sini supaya tidak
ada dua versi yang bisa berbeda.
