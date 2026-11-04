# TECH-SPEC — ohmysea

| Field | Isi |
|---|---|
| Versi | 0.1 |
| Tanggal | 2026-11-04 |
| Mengacu pada | `docs/PRD.md` v0.1 |

## 1. Ringkasan arsitektur

Satu aplikasi Next.js (App Router) di Vercel. Browser bicara hanya ke route
handler milik sendiri; semua kunci API dipegang server. Chat/curhat diteruskan ke
Groq, embedding & generate gambar ke Cloudflare Workers AI, data & vektor ke
Postgres Supabase (pgvector), gambar ke Supabase Storage, pengambilan dokumen dari
URL lewat Firecrawl saat ingest.

```
Browser (HP/desktop)
   │  fetch / streaming
   ▼
Next.js di Vercel  ── app/ (UI) + app/api/* (route handler, Node runtime)
   │
   ├── lib/ai/groq ────────► Groq API        (chat + curhat, streaming)
   ├── lib/rag/* ──────────► Cloudflare Workers AI  (@cf/baai/bge-m3, 1024 dim)
   ├── lib/ai/image ───────► Cloudflare Workers AI  (flux-2-klein-4b)
   ├── lib/storage/* ──────► Supabase Storage (bucket images)
   ├── lib/db/* ───────────► Supabase Postgres + pgvector
   └── scripts/rag-ingest ─► Firecrawl (URL → markdown) ──► chunk ──► embed
```

## 2. Batasan & tanggung jawab

| Pertanyaan | Jawaban |
|---|---|
| Ada bagian server/backend? | Ya — route handler Next.js (Node runtime, bukan Edge, karena driver `postgres` butuh TCP) |
| Bagaimana data berubah? | Hanya lewat route handler di `app/api/*`. UI tidak pernah menulis DB langsung. Klien tidak memakai RLS/token Supabase untuk menulis |
| Validasi di mana? | Dua lapis: zod di route handler (bentuk input) + constraint DB (not null, unique, FK). Tidak ada validasi yang hanya di client |
| Rahasia/kredensial di mana? | Hanya di `.env` (lokal) dan Environment Variables Vercel (produksi). Dibaca lewat `process.env` di kode server. `.env` gitignored; `.env.example` placeholder |
| Batas v1 | Satu pengguna. Tanpa akun, tanpa multi-tenant, tanpa share publik |
| Yang tidak ada | Tanpa queue/worker terpisah, tanpa cron, tanpa cache berlapis, tanpa reranking RAG |

## 3. Stack & alasan

| Layer | Pilihan | Alasan singkat | ADR |
|---|---|---|---|
| Model chat | `openai/gpt-oss-120b` (Groq) | Kualitas penalaran terbaik di daftar model akun ini | ADR-001 |
| Model curhat | `qwen/qwen3.8-27b` (Groq) | Tanpa token penalaran yang panjang → balasan lebih cepat dan hangat; cocok untuk mode curhat | ADR-001 |
| Framework | Next.js 16.4.5 App Router + React 19.3.1 | Satu repo untuk UI + API, deploy Vercel tanpa konfigurasi tambahan | — |
| Bahasa | TypeScript 7.0.2 | Tipe kolom DB ikut terbawa ke UI | — |
| Styling | Tailwind CSS 4.3.4 | Token desain mudah dijaga, tidak ada CSS liar | — |
| Manajer paket | pnpm 12.16.1 | Cepat, hemat disk | — |
| ORM | drizzle-orm 0.45.4 + drizzle-kit 0.31.11 | Skema di kode, tipe kuat, mendukung kolom `vector` pgvector | — |
| DB | Supabase Postgres + pgvector | Sudah dimiliki; satu tempat untuk relasi dan vektor | ADR-002 |
| LLM chat/curhat | Groq `openai/gpt-oss-120b` (chat) & `qwen/qwen3.8-27b` (curhat) | Kunci sudah ada, latensi rendah, gratis di kuota. **Diuji: llama-3.3-70b-versatile tidak tersedia di akun ini (model_not_found); dua model ini 200 OK** | ADR-001 |
| Streaming | Vercel AI SDK (`ai` 7.0.162) + `@ai-sdk/groq` 4.0.76 | Streaming + pesan multi-turn tanpa protokol buatan sendiri | — |
| Embedding | Cloudflare Workers AI `@cf/baai/bge-m3` (1024 dim, multibahasa) | Groq tidak punya endpoint embedding; Cloudflare sudah punya kunci. **Sudah diuji: 200 OK, 1024 dimensi** | ADR-002 |
| Generate gambar | Cloudflare Workers AI `@cf/black-forest-labs/flux-2-klein-4b` | Satu model untuk text-to-image **dan** editing/image-to-image. **Sudah diuji: text-to-image 200 OK, `input_image_0` 200 OK, width/height dihormati (1344x768)** | ADR-003 |
| Storage gambar | Supabase Storage, bucket `images` | Sejalan dengan DB yang dipakai, URL langsung bisa dipakai `<img>` | ADR-003 |
| Scrape URL | Firecrawl | Sudah punya kunci; hasil markdown siap di-chunk | — |
| Uji | vitest (unit) + skrip curl (API) | Cukup untuk logika chunking/retrieval & kriteria FR | — |
| Migrasi & skrip CLI | tsx 4.23.15 | Menjalankan skrip TypeScript tanpa build | — |
| Deploy | Vercel | Sesuai permintaan pemilik | — |

Model cadangan yang tersedia di akun Cloudflare (dipakai kalau model default gagal):
`@cf/black-forest-labs/flux-1-schnell` (cepat, JSON, tanpa image-to-image),
`@cf/black-forest-labs/flux-2-klein-9b` (kualitas lebih tinggi, lebih lambat),
`@cf/qwen/qwen3-embedding-0.6b`, `@cf/baai/bge-small-en-v1.5` (384 dim).

## 4. Model data

Semua tabel di skema `public`. Kolom waktu `timestamptz`, default `now()`.

```
conversations
  id           uuid         (pk, default gen_random_uuid())
  title        text         (wajib, default 'Percakapan baru')
  mode         text         (wajib, enum: chat | curhat)
  created_at   timestamptz  (wajib)
  updated_at   timestamptz  (wajib)

messages
  id              uuid       (pk)
  conversation_id uuid       (wajib, fk → conversations.id, on delete cascade)
  role            text       (wajib, enum: user | assistant | system)
  content         text       (wajib)
  sources         jsonb      (opsional — potongan dokumen yang dipakai, [{documentId,title,score}])
  created_at      timestamptz(wajib)

documents
  id          uuid       (pk)
  title       text       (wajib)
  source      text       (wajib — 'file:<nama>' atau URL)
  checksum    text       (wajib, unique — cegah ingest ganda)
  created_at  timestamptz(wajib)

chunks
  id           uuid       (pk)
  document_id  uuid       (wajib, fk → documents.id, on delete cascade)
  ordinal      integer    (wajib — urutan chunk dalam dokumen)
  content      text       (wajib, panjang 400–1500 karakter)
  embedding    vector(1024) (wajib)
  created_at   timestamptz(wajib)
  index: HNSW (embedding vector_cosine_ops)

images
  id             uuid       (pk)
  prompt         text       (wajib)
  style          text       (wajib, slug dari daftar di §6)
  model          text       (wajib, id model Cloudflare)
  aspect_ratio   text       (wajib, mis. '1:1','16:9','9:16')
  width          integer    (wajib)
  height         integer    (wajib)
  steps          integer    (opsional)
  seed           integer    (opsional)
  source_image   text       (opsional — path gambar referensi untuk image-to-image)
  url            text       (wajib — URL di Supabase Storage)
  duration_ms    integer    (opsional)
  error          text       (opsional — diisi kalau generate gagal)
  created_at     timestamptz(wajib)
```

Aturan: field wajib yang kosong **menggagalkan build/eksekusi** — not null di DB,
zod `.min(1)` di API. Jangan dilonggarkan.

Catatan pgvector: ekstensi `vector` harus aktif sebelum migrasi pertama:
`create extension if not exists vector;`. Dimensi 1024 mengikuti model embedding;
kalau model embedding diganti, kolom dan semua isi harus dibangun ulang.

Catatan koneksi: aplikasi memakai `DATABASE_URL` (pooler transaksi, port 6543).
`drizzle-kit migrate` memakai `DIRECT_URL` (port 5432) karena migrasi butuh
koneksi non-pooler.

## 5. Antarmuka (rute / halaman / perintah)

| Rute / perintah / API | Sumber | Catatan |
|---|---|---|
| `GET /` | halaman | Chat: sidebar percakapan, area pesan, input, pemilih mode |
| `GET /gallery` | halaman | Galeri gambar + prompt-nya |
| `POST /api/unlock` | route | Body `{code}` → set cookie sesi (httpOnly) kalau cocok dengan `APP_ACCESS_CODE` |
| `POST /api/chat` | route | Body `{conversationId?, mode, message}` → respons streaming teks; menyimpan 2 pesan |
| `GET /api/conversations` | route | Daftar percakapan (id, title, mode, updatedAt) |
| `PATCH /api/conversations/[id]` | route | Body `{title}` → ubah judul |
| `DELETE /api/conversations/[id]` | route | Hapus percakapan + pesannya |
| `GET /api/conversations/[id]` | route | Pesan dalam satu percakapan |
| `POST /api/images` | route | Body `{prompt, style, model?, aspectRatio, count?, referenceImage?}` → simpan ke Storage, catat metadata, kembalikan URL |
| `GET /api/images` | route | Daftar gambar (terbaru dulu, batas 50) |
| `POST /api/rag/ingest` | route | Body `{text, title}` atau `{url, title}` → chunk + embed + simpan; hanya boleh dari sesi yang sudah unlock |
| `GET /api/rag/query?q=` | route | Mengembalikan k ≥ 4 chunk + skor (untuk verifikasi FR-4) |
| `GET /api/health` | route | Status koneksi DB + nama model yang dipakai |
| `pnpm rag:ingest <file\|url>` | skrip CLI | Panggil route ingest dengan kunci sesi dev |
| `pnpm exec tsx scripts/rag-replace.mts <file> [judul]` | skrip CLI | Ganti dokumen yang isinya berubah: hapus dokumen berjudul sama (chunk cascade), lalu ingest ulang |
| `pnpm rag:query "<kata kunci>"` | skrip CLI | Cetak chunk + skor |
| `pnpm exec tsx scripts/rag-diagnose.mts <kata> "<query>" [k]` | skrip CLI | Cari potongan yang memuat kata kunci dan lihat peringkatnya untuk sebuah query (alat diagnosa FR-4) |
| `bash scripts/smoke.sh` | skrip | Uji cepat semua rute API, cetak status per kriteria FR |

Setiap rute baru **wajib** didaftarkan di tabel ini.

## 6. Strategi kualitas

| Item | Implementasi | Dicek oleh |
|---|---|---|
| Memori percakapan | Kirim 20 pesan terakhir + ringkasan sistem bila lebih | manual (FR-2) + test unit pembentuk konteks |
| RAG relevan | Chunk 1000 karakter, overlap 150; tabel markdown dipecah per baris dengan baris judul diulang (`lib/rag/chunk.ts`); top-k 6; ambang kosinus ≥ 0.30; maksimal 2 potongan per dokumen (kandidat diambil 4× k lalu disaring) | `pnpm rag:query` + `scripts/rag-diagnose.mts` (FR-4) |
| Jawaban jujur | Prompt sistem: "kalau konteks tidak memuat jawaban, bilang tidak ada di dokumen, jangan mengarang" + sumber ditampilkan di UI | manual, 5 pertanyaan uji di PROGRESS-LOG |
| Curhat aman | System prompt curhat: empati dulu, tanpa diagnosis, tanpa nasihat medis; tautan bantuan bila ada indikasi krisis | manual (FR-5) |
| Kontras & keyboard | Token warna DESIGN.md; semua kontrol fokusabel | checklist visual + uji keyboard |
| Error provider | Semua panggilan provider dibungkus; kegagalan → HTTP ≥ 400 + pesan Indonesia yang jelas | test unit + `smoke.sh` |
| Style gambar | Tabel gaya → potongan prompt positif (mis. `anime`, `photo`, `3d`, `sketch`, `watercolor`) | `pnpm rag:query`? → tidak: uji manual 5 gaya di halaman gambar |
| Aspect ratio | Tabel ratio → (width,height) yang sah untuk model: 1:1=1024x1024, 16:9=1344x768, 9:16=768x1344, 4:3=1152x896, 3:4=896x1152 | uji manual + cek kolom width/height di DB (FR-7) |

## 7. Strategi testing

| Layer | Tool | Yang diuji | Target |
|---|---|---|---|
| Unit | vitest | chunking (batas & overlap), pembentuk konteks pesan, pemetaan ratio→dimensi, pemetaan style→prompt, parser respons provider | ≥ 1 test per fungsi di `lib/rag` dan `lib/ai` |
| Integrasi API | `scripts/smoke.sh` (curl) | FR-1, FR-3, FR-4, FR-6, FR-7, FR-10 | semua exit 0 saat dev server hidup |
| Manual (mata) | checklist | G3, FR-5, FR-9, FR-11, responsif 360 px, keyboard-only | hasil dicatat di PROGRESS-LOG |

Jangan tambah test yang tidak menangkap bug. Kalau tidak ada logika, jangan paksa
menulis test logika.

## 8. Struktur folder

```
app/
  layout.tsx
  page.tsx                 # chat
  gallery/page.tsx
  api/chat/route.ts
  api/conversations/route.ts
  api/conversations/[id]/route.ts
  api/images/route.ts
  api/rag/ingest/route.ts
  api/rag/query/route.ts
  api/unlock/route.ts
  api/health/route.ts
components/
  chat/  Sidebar.tsx  MessageList.tsx  Composer.tsx  ModeSwitch.tsx
  image/ ImageForm.tsx  ImageGrid.tsx
  ui/    Button.tsx  Card.tsx  Pill.tsx
lib/
  db/schema.ts  client.ts
  ai/groq.ts  image.ts  prompts.ts  styles.ts
  rag/chunk.ts  embed.ts  retrieve.ts
  storage/upload.ts
  env.ts                   # validasi env dengan zod, gagal cepat kalau kurang
scripts/
  rag-ingest.ts  rag-query.ts  smoke.sh
drizzle/                   # hasil drizzle-kit generate
docs/
```

## 9. Menjalankan lokal

```bash
pnpm install
cp .env.example .env        # lalu isi nilainya (DATABASE_URL, kunci provider, APP_ACCESS_CODE)
pnpm db:generate            # bikin file migrasi dari lib/db/schema.ts
pnpm db:migrate             # jalankan ke Supabase (pakai DIRECT_URL)
pnpm rag:ingest ./contoh-dokumen.md
pnpm dev                    # buka http://localhost:3000, masukkan APP_ACCESS_CODE
```

## 10. Distribusi / deploy

| Aspek | Keputusan |
|---|---|
| Target | Vercel, project `itz12/ohmysea` (team ITZ) |
| URL produksi | https://ohmysea-iy4k3iv29-itz12.vercel.app (alias https://ohmysea.vercel.app) |
| Sumber | GitHub `main` — **belum tersambung**: akun Vercel tidak punya akses tulis ke `seainheree/ohmysea`, jadi deploy masih manual lewat CLI (`vercel --prod`) |
| Deployment Protection | SSO/Vercel Authentication **dimatikan** untuk produksi supaya bisa dibuka dari HP; gerbang akses aplikasi sendiri (`APP_ACCESS_CODE` + cookie) tetap aktif |
| Command bangun | `pnpm build` |
| Keluaran | Situs Next.js + route handler API |
| Environment Variables | 12 variabel diisi di produksi (DATABASE_URL, DIRECT_URL, Supabase URL/publishable/service, Groq key + 2 model, Cloudflare account + token, Firecrawl, APP_ACCESS_CODE). `CF_MODEL_EMBED`/`CF_MODEL_IMAGE` tidak diisi — memakai default di `lib/env.ts` |
| Runtime route API | Node.js (bukan Edge) — driver `postgres` butuh TCP |
| Biaya | Free tier: Vercel Hobby, Supabase free, Groq free, Cloudflare Workers AI free allowance |

## 11. Keamanan

- [ ] `.env` tidak pernah ikut commit (sudah gitignored); `.env.example` hanya placeholder
- [ ] Tidak ada kunci di kode yang di-bundle ke browser; hanya `NEXT_PUBLIC_SUPABASE_URL` + publishable key yang publik
- [ ] Semua route API kecuali `/api/unlock` dan `/api/health` menolak tanpa cookie sesi (401)
- [ ] Cookie sesi: httpOnly, sameSite=lax, secure di produksi, masa berlaku 30 hari
- [ ] Batas laju sederhana di `/api/chat` dan `/api/images` (mis. 30 permintaan/menit per cookie) agar kuota tidak habis karena kecelakaan
- [ ] Batas jumlah gambar per permintaan (maks 4) dan panjang prompt (maks 2000 karakter)
- [ ] Isi curhat tidak dikirim ke layanan selain Groq
- [ ] Kunci yang sudah pernah tertulis di file contoh (Cloudflare, Groq, Firecrawl) **dirotasi** sebelum repo dibuat publik ulang
- [ ] `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di `lib/storage/upload.ts`

## 12. Keputusan teknis tertunda

| # | Pertanyaan | Perlu diputuskan sebelum |
|---|---|---|
| D1 | Bulatkan ke pgvector saja, atau pindah ke Cloudflare Vectorize kalau jumlah chunk > 50k? | sebelum T-105 (v1 pakai pgvector) |
| D2 | Apakah perlu OCR/PDF di ingest (v1 hanya teks/markdown/URL)? | setelah v1 tayang |
| D3 | Apakah gambar hasil perlu dibersihkan otomatis (retensi 90 hari)? | sebelum T-303 |
| D4 | Perlu ringkasan percakapan panjang (auto-summarize) untuk hemat token? | setelah 1000 pesan tercapai |
