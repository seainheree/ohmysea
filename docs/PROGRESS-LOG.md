# PROGRESS-LOG — ohmysea

Ditulis di **akhir** setiap sesi kerja. Salin blok di bawah untuk tiap sesi baru,
letakkan entri terbaru paling atas.

```
### YYYY-MM-DD — <judul sesi>

- **Sesi**: <sesi baru / lanjutan>
- **Tujuan**: <...>
- **Dikerjakan**: <task ID + perubahan>
- **Keputusan**: <+ tautan ADR kalau ada>
- **Verifikasi**: <command + hasil asli>
- **Blocker**: <atau "tidak ada">
- **Next**: <satu langkah konkret>
```

---

### 2026-11-04 — Bangun aplikasi: M0–M2 jalan, deploy Vercel

- **Sesi**: lanjutan (setelah dokumen disetujui pemilik)
- **Tujuan**: dari dokumen kosong → aplikasi jalan, terverifikasi dengan command
- **Dikerjakan**:
  - T-001..T-004: scaffold Next.js 16.4.5 (pnpm 12.16.1, TypeScript 7.0.2, Tailwind 4.3.4), skema Drizzle 5 tabel + pgvector, gerbang kode akses + cookie httpOnly, shell UI (sidebar, mode switch, composer, daftar pesan) dengan token desain
  - T-101..T-106: `/api/chat` streaming (Groq), simpan pesan, CRUD percakapan, mode curhat, ingest (berkas + URL Firecrawl), retrieval pgvector, UI chat tersambung
  - T-201..T-204: `/api/images` (text-to-image + image-to-image), Supabase Storage bucket `images`, pilihan style/model/ratio, galeri
  - Tipografi: DM Sans (UI) + Instrument Serif (hero/wordmark) sesuai arahan pemilik → token `--font-sans` / `--font-display`
  - `scripts/smoke.sh` dibuat; `vitest` 17 test lulus; `tsc --noEmit` bersih
- **Keputusan**: model Groq ditukar — `llama-3.3-70b-versatile` tidak ada di akun ini; dipakai `openai/gpt-oss-120b` (chat) + `qwen/qwen3.8-27b` (curhat). TOP_K 6, ambang 0.30. Akses Supabase via PAT (`sbp_`) di `.supabase-token` (gitignored) + password DB baru di-set lewat Management API. ADR-001 diperbarui.
- **Verifikasi** (output asli):
  - `pnpm db:migrate` → "pgvector aktif, versi 0.8.2" + tabel chunks/conversations/documents/images/messages
  - HNSW: `CREATE INDEX chunks_embedding_hnsw ON public.chunks USING hnsw (embedding vector_cosine_ops)`
  - `bash scripts/smoke.sh` → **SEMUA UJI LULUS** (gerbang akses, chat+memori SMOKE77, RAG, gambar + URL 200)
  - `pnpm test` → 17 test lulus; `pnpm build` exit 0
  - ingest: PRD.md 16 potongan, TECH-SPEC.md 21, URL Groq 10; ingest ulang → 409 duplikat
  - FR-4: tanya "berapa dimensi vektor embedding" → "1024 dimensi (lihat TECH-SPEC.md)"; di luar dokumen → "Tidak ada di dokumen"
  - FR-5: curhat menjawab empatik tanpa diagnosis
  - FR-8: image-to-image 201, 1344×768, 5,8 s, `source_image` terisi
  - Temuan: `flux-1-schnell` menolak `width`/`height` (dimensi dikunci 1024×1024, metadata DB ikut disesuaikan)
- **Blocker**: koneksi repo GitHub ke Vercel gagal (akun Vercel `itzfebryhcx-7686` tidak punya akses tulis ke `seainheree/ohmysea`) — tidak menghalangi deploy lewat CLI
- **Next**: T-303 lanjut (env produksi + deploy), lalu T-304 uji ulang FR-1..FR-11 di produksi

### 2026-11-04 — Deploy produksi Vercel

- **Sesi**: lanjutan
- **Tujuan**: aplikasi bisa dipakai dari HP (T-303)
- **Dikerjakan**: project Vercel `itz12/ohmysea` dibuat, 12 environment variable produksi diisi, deploy `vercel --prod`, SSO/Vercel Authentication produksi dimatikan agar bisa diakses publik (gerbang `APP_ACCESS_CODE` tetap aktif), `scripts/rag-replace.mts` ditambah karena dokumen TECH-SPEC berubah setelah ingest pertama
- **Verifikasi** (produksi, output asli):
  - `GET /api/health` → `{"ok":true,"env":{"ok":true,"hilang":[]},"db":{"ok":true},"model":{...}}` (HTTP 200)
  - `GET /api/conversations` tanpa cookie → 401; `POST /api/unlock` kode benar → 200; `GET /` → 200
  - chat produksi (5,8 s) → "Dimensi vektor embedding: **1024** (Cloudflare Workers AI `@cf/baai/bge-m3`)"
  - image-to-image produksi (10,6 s) → 201, 1344×768, `source_image` terisi, URL Supabase Storage aktif
- **Blocker**: auto-deploy dari GitHub belum bisa (akun Vercel `itzfebryhcx-7686` tidak punya akses tulis ke repo `seainheree/ohmysea`) → deploy manual lewat CLI
- **Next**: T-304 checklist manual (360 px, keyboard, 5 pertanyaan uji RAG) + centang `docs/DESIGN.md` §5–6

### 2026-11-04 — Verifikasi lewat browser + perbaikan yang ditemukan

- **Sesi**: lanjutan
- **Tujuan**: ubah checklist manual (360 px, keyboard, RAG) jadi bukti nyata, lalu perbaiki temuan
- **Dikerjakan**:
  - `lib/rag/chunk.ts`: tabel markdown dipecah per maks 8 baris, baris judul + garis pemisah diulang di setiap potongan (dulu satu fakta tabel tenggelam di blok besar)
  - `lib/rag/retrieve.ts`: kandidat 4×k lalu disaring, top-k 6 → **8**, maks **3** potongan per dokumen
  - `scripts/rag-diagnose.mts` + `scripts/rag-replace.mts` (alat diagnosa & ganti snapshot dokumen)
  - UI: sidebar `inert` + `aria-hidden` saat drawer tertutup (temuan Tab), hero & kartu rata kiri 16 px (dulu selisih 12 px), hint "Shift + Enter" hanya ≥ sm, tombol kirim punya state nonaktif yang jelas, kartu pakai `border-kuat`
  - Logo & favicon dari `public/image/favico.png` (turunan 32/48/180/256 px lewat System.Drawing), footer "Ohmysea By Sasha" di semua halaman
  - Basis pengetahuan ditambah 4 ADR + DESIGN.md + README.md (total 11 dokumen); ADR-002 diselaraskan (dulu masih menulis top-k 4 / 0.35 → jawaban sempat salah)
- **Verifikasi** (produksi https://ohmysea.vercel.app, output asli):
  - Browser 360 px: `overflowHorizontal: false`, hero & kartu `left=16` (`selisih 0`), footer "Ohmysea By Sasha" terlihat, favicon `/image/logo-32/48/180.png` terpasang, hint keyboard `display:none`, tombol kirim nonaktif `bg=rgb(44,44,60) warna=rgb(156,163,175)`, drawer `left=-300 inert=true aria-hidden=true`
  - Urutan Tab (drawer tertutup): `Tulis pesan… → BODY → Buka menu → BUTTON → BUTTON` — kontrol drawer tidak lagi masuk urutan fokus
  - Browser 1440 px: tanpa overflow, sidebar terlihat (`inert=false`), kartu 2 kolom (`356px 356px`), hint keyboard tampil
  - Kontras: teks muted 6.78:1, teks utama 17.22:1, label kecil 5.15:1 (semua ≥ 4.5)
  - RAG 7 pertanyaan: Q1 1024 ✓ · Q2 top-k 8 & ambang 0.30 ✓ (3× ulangan konsisten) · Q3 chunk 1000/overlap 150 ✓ · Q4 alasan TokenHarbor ✓ · Q5 flux-2-klein-4b + image-to-image ✓ · Q6 curhat empatik tanpa diagnosis ✓ · Q7 di luar dokumen dijawab jujur ✓
- **Blocker**: tidak ada
- **Next**: v1 selesai; kandidat lanjutan = CI GitHub Actions, sambungkan repo ke Vercel, perapian `window.prompt/confirm` jadi komponen, batas laju berbasis Redis

### 2026-11-04 — M4: Memori AI, hapus riwayat, UI/UX responsif

- **Sesi**: lanjutan (permintaan pemilik: perbaiki UI/UX responsive & profesional, tambah hapus riwayat, tambah fitur Pengaturan berisi memori AI)
- **Dikerjakan**:
  - Tabel `memories` + migrasi `0001` + API `GET/POST /api/memories`, `PATCH/DELETE /api/memories/[id]` (duplikat ditolak 409, nonaktif tanpa dihapus, maks 500 karakter/memori dan 60 memori aktif)
  - `lib/memory.ts`: memori aktif disuntikkan ke prompt sistem di **kedua mode** (chat & curhat) — "Yang kamu ingat tentang pengguna… jangan mengarang di luar daftar ini"
  - `DELETE /api/conversations?mode=` → hapus riwayat semua atau per mode (pesan ikut via cascade)
  - Halaman `/pengaturan`: Memori AI (tambah/ubah/hapus/aktif-nonaktif + penghitung), Riwayat percakapan (hapus semua/per mode), Status layanan dari `/api/health`, bagian Tentang
  - UI/UX: ikon SVG (bukan emoji), `ConfirmDialog` menggantikan `window.confirm`/`window.prompt`, sidebar dengan nav Chat/Gambar/Pengaturan + pencarian riwayat + rename inline + hapus satuan/semua, header & komposer sticky, area aman (safe-area), target sentuh ≥ 44 px, input 16 px di < 640 px (cegah zoom iOS), scrollbar ramping, stempel waktu pesan, badge jumlah memori
- **Verifikasi** (output asli):
  - Lokal: `pnpm lint` bersih · `pnpm test` **24 lulus** · `pnpm build` exit 0
  - Lokal (API): memori 201, duplikat 409, chat menjawab "Kode rahasia kamu = 4821. Namamu Sasha, panggil Sha." (mode chat) dan mode curhat juga ingat; memori dinonaktifkan → "Tidak ada di dokumen" (tidak lagi dipakai); `DELETE /api/conversations` → 38 dihapus, 0 tersisa
  - Lokal (browser 360 px): tanpa overflow · textarea 262×47 font 16 px · tombol kirim 44×44 · header `sticky` · drawer 310 px berisi menu Chat/Gambar/Pengaturan + pencarian + logo
  - Lokal (browser): tambah memori lewat form → muncul di daftar, konfirmasi tampil, penghitung "1 aktif / 1 total"; 768 px sidebar tetap & `inert=false`; 1440 px tanpa overflow, 2 gelembung pesan, stempel waktu ada, header memuat judul percakapan
  - Produksi (https://ohmysea.vercel.app): health 200; `/pengaturan` 200 dan memuat "Memori AI"; FR-12 → 201, duplikat 409, jawaban "Hijau laut (teal).", setelah dinonaktifkan tidak lagi tahu; FR-13 → `DELETE ?mode=curhat` menghapus 2 percakapan, 3 percakapan chat tetap utuh
- **Catatan penting (jujur)**: pengujian FR-13 di lokal menghapus **semua** percakapan di database yang dipakai bersama produksi (38 percakapan, semuanya data uji dari sesi ini). Verifikasi di produksi sesudahnya sengaja dibatasi ke mode curhat saja.
- **Blocker**: tidak ada
- **Next**: kandidat lanjutan = CI GitHub Actions, sambungkan repo ke Vercel, batas laju berbasis Redis, retensi gambar (D3), ringkasan percakapan panjang (D4)

### 2026-11-04 — Dokumentasi awal: PRD, TECH-SPEC, ADR, DESIGN, TASKS

- **Sesi**: baru
- **Tujuan**: menyiapkan wadah dokumen sebelum satu baris kode pun ditulis (Tahap 1–4 kit)
- **Dikerjakan**:
  - Isi `template/` disalin ke root (`AGENTS.md`, `.gitignore`, `docs/`); `PROMPT-PEMBUKA.md` dan `docs/adr/ADR-000-contoh-keputusan.md` dihapus sesuai §7b CARA-PAKAI
  - `docs/PRD.md` v0.1 ditulis (3 fitur: chat dengan memori, curhat, generate image + image-to-image; RAG sederhana)
  - `docs/TECH-SPEC.md` v0.1 ditulis: Next.js 16.4.5 + Drizzle 0.45.4 + Supabase Postgres/pgvector + Groq + Cloudflare Workers AI + Firecrawl + Vercel
  - `docs/DESIGN.md` v0.1 ditulis dari mockup `public/image/{8140DE68-...}.png` (dark mode, aksen pink `#EC4899`)
  - 4 ADR dibuat: ADR-001 (Groq, bukan TokenHarbor), ADR-002 (embedding bge-m3 + pgvector), ADR-003 (flux-2-klein-4b + Supabase Storage), ADR-004 (kode akses tunggal)
  - `docs/TASKS.md` ditulis: M0–M3, 17 task, tiap task punya command verifikasi
  - `.env` dibuat dari nilai asli; `.env.example` ditulis ulang jadi placeholder saja (TokenHarbor di-drop)
- **Keputusan**: ADR-001..ADR-004 (semua Diterima). Q1, Q2, Q3, Q4, Q6, Q7 di PRD §10 terjawab; Q5 masih terbuka
- **Verifikasi** (dijalankan, hasil asli):
  - `@cf/baai/bge-m3` → `success: True dims: 1024` (embedding RAG jalan)
  - `@cf/black-forest-labs/flux-2-klein-4b` text-to-image → HTTP 200, gambar JPEG base64
  - `width=1344 height=768` → HTTP 200, keluaran 1344x768 (aspect ratio dihormati)
  - `input_image_0=@gambar.png` + prompt edit → HTTP 200 (image-to-image jalan)
  - uji diskriminator nama field: `input_image_0` salah isi → error "unable to decode image file"; `input_image` / `image` / `input_images` → diabaikan tanpa error (field yang benar: `input_image_0`)
  - `@cf/black-forest-labs/flux-1-schnell` → HTTP 200 (JSON), pernah 400 "NSFW content" untuk prompt wajar
  - `curl .../user/tokens/verify` → `{"status":"active"}` (kunci Cloudflare valid)
- **Blocker**: tidak ada. Catatan risiko: F3 di `docs/TASKS.md` — kunci yang pernah tertulis di file contoh wajib dirotasi
- **Next**: T-001 — scaffold Next.js 16.4.5 + TypeScript + Tailwind + pnpm, dengan `lib/env.ts` yang gagal cepat kalau env kurang

### 2026-11-04 — Bersih-bersih repo + isi `.env`

- **Sesi**: lanjutan
- **Tujuan**: hilangkan file duplikat, pindahkan nilai asli ke `.env`, siapkan kunci yang dipakai kode
- **Dikerjakan**:
  - Crosscheck `template/` vs root (11 file) → semua sudah terwakili di root; `PROMPT-PEMBUKA.md` dan `ADR-000-contoh` sudah dihapus sesuai §7b kit
  - `template/` dan `README copy.md` dibuang; backup di scratch `ohmysea-backup/` (12 file)
  - `.env`: `APP_ACCESS_CODE` diisi (acak); `DATABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` masih placeholder — menunggu nilai dari dashboard Supabase
  - `.env.example` ditulis ulang jadi placeholder murni (file contoh lama yang memuat kunci asli sudah dihapus)
  - `.mcp.json` dibuat dari catatan MCP Supabase pemilik
- **Keputusan**: pemilik memutuskan **tidak** merotasi kunci (F3) — kunci yang ada tetap dipakai. Risiko diterima.
- **Verifikasi**: `find . -not -path './.git/*' -type f` → 19 file, tanpa duplikat; `git check-ignore -v .env` → terabaikan
- **Blocker**: password database + service role key Supabase belum ada di mesin ini (tidak ada di file mana pun; catatan Obsidian `TOOLS/API KEY.md` memuat kunci project lain `xxwyhcdlifthahkvatka`, bukan project ini)
- **Next**: T-001 — scaffold Next.js
