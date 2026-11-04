# AGENTS.md — ohmysea

## Project

ohmysea adalah chatbot web pribadi dengan RAG sederhana. Tiga mode: **chat**
(ngobrol dengan memori percakapan), **curhat** (mode bercerita, ditanggapi
empatik), dan **generate image** (text-to-image + image-to-image, pilihan style,
model, aspect ratio). Dipakai sendiri (satu gerbang kode akses), deploy di Vercel.
Semua balasan memakai Bahasa Indonesia.

Dokumen acuan: `docs/PRD.md` (kenapa/apa), `docs/TECH-SPEC.md` (bagaimana),
`docs/TASKS.md` (urutan kerja), `docs/adr/` (keputusan + alasan),
`docs/DESIGN.md` (token & arah tampilan).

## Stack

| Layer | Teknologi | Versi |
|---|---|---|
| Runtime | Node.js | 24.18.0 |
| Framework | Next.js (App Router) | 16.4.5 |
| UI | React / React DOM | 19.3.1 |
| Styling | Tailwind CSS | 4.3.4 |
| Bahasa | TypeScript | 7.0.2 |
| ORM | drizzle-orm / drizzle-kit | 0.45.4 / 0.31.11 |
| Driver DB | postgres (postgres.js) | 4.0.0 |
| Database | Supabase Postgres + pgvector | project `vuxltppwzjgqrefgfuxs` |
| Storage | Supabase Storage (bucket `images`) | @supabase/supabase-js 2.118.0 |
| LLM chat/curhat | Groq — `openai/gpt-oss-120b` (chat), `qwen/qwen3.8-27b` (curhat) | via AI SDK `@ai-sdk/groq` 4.0.76 (SDK `ai` 7.0.162) |
| Embedding | Cloudflare Workers AI `@cf/baai/bge-m3` (1024 dim) | REST v4 |
| Generate gambar | Cloudflare Workers AI `@cf/black-forest-labs/flux-2-klein-4b` | REST v4 |
| Scrape URL | Firecrawl | REST v1 |
| Validasi input | zod | 4.6.7 |
| Uji | vitest + skrip curl | vitest 5.1.0, tsx 4.23.15 |
| Deploy | Vercel | — |

Manajer paket: **pnpm 12.16.1** (setelan `allowBuilds` untuk esbuild ada di `pnpm-workspace.yaml` — bukan di `package.json`). Node: **24.x**. Jangan pakai npm/yarn tanpa tanya.

## Command

Jalankan dari root repo.

| Keperluan | Command |
|---|---|
| Install | `pnpm install` |
| Dev | `pnpm dev` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| Migrasi DB | `pnpm db:generate` lalu `pnpm db:migrate` |
| Ingest dokumen | `pnpm rag:ingest <file\|url>` |
| Ganti dokumen yang berubah | `pnpm exec tsx scripts/rag-replace.mts <file> [judul]` |
| Cek retrieval | `pnpm rag:query "<kata kunci>"` |
| Diagnosa peringkat retrieval | `pnpm exec tsx scripts/rag-diagnose.mts <kata-kunci> "<query>" [k]` |
| Uji API cepat | `BASE=http://localhost:3000 bash scripts/smoke.sh` |

**Sebelum menyatakan tugas selesai**, jalankan `pnpm build` dan `pnpm test`,
tunjukkan output aslinya. Jangan menyimpulkan dari pembacaan kode.

## Struktur folder

```
app/                 # rute & UI (App Router)
  (chat)/            # halaman utama + galeri
  api/               # route handler: chat, conversations, images, rag, unlock
components/          # komponen UI
lib/
  db/                # skema drizzle + koneksi
  ai/               # klien Groq, Cloudflare AI, prompt builder
  rag/               # chunking, embed, retrieval
  storage/           # upload Supabase Storage
scripts/             # rag-ingest, rag-query, smoke.sh
docs/                # PRD, TECH-SPEC, TASKS, DESIGN, adr/, PROGRESS-LOG
drizzle/             # file migrasi hasil generate
```

## Konvensi kode

- Teks untuk pengguna: **Bahasa Indonesia**. Nama variabel/fungsi/kolom DB: Inggris.
- Nilai warna/jarak/radius diambil dari token di `docs/DESIGN.md` (file token), bukan
  angka yang ditulis ulang per komponen.
- Kunci API hanya dibaca di kode server (`lib/`). Tidak ada kunci rahasia di
  komponen client, tidak ada `NEXT_PUBLIC_` untuk hal rahasia.
- Validasi input API dengan zod; jangan percaya body mentah.
- Prompt sistem (chat vs curhat) hidup di satu file `lib/ai/prompts.ts`, tidak
  disebar.
- Tidak menambahkan dependency baru tanpa bertanya.

## Aturan yang harus dijaga

- Tidak ada nilai rahasia di file yang ikut commit. `.env` gitignored; `.env.example` hanya placeholder.
- Mode curhat tidak pernah memberi diagnosis medis/psikologis. Kalau ada indikasi krisis, arahkan ke bantuan profesional + tautan layanan bantuan.
- Semua jawaban chat/curhat berbahasa Indonesia, ringkas, tidak bertele-tele.
- Jawaban RAG wajib menyebut sumber (nama dokumen/URL). Kalau konteks tidak memuat jawabannya, jawab jujur "tidak ada di dokumen" — jangan mengarang.
- Field wajib di DB tidak boleh null; tipe kolom mengikuti `docs/TECH-SPEC.md` §4.
- Parameter RAG dikunci di `lib/rag/retrieve.ts`: top-k 8, ambang kosinus 0.30, maksimal 3 potongan per dokumen (cegah satu dokumen memenuhi semua slot). Chunk 1000 karakter / overlap 150, dan tabel markdown dipecah per baris dengan baris judul diulang (`lib/rag/chunk.ts`).
- Memori AI (`memories`) disuntikkan ke prompt sistem lewat `lib/memory.ts` dan berlaku di **kedua** mode. Maks 60 memori aktif; satu memori maks 500 karakter. Jangan menambah jalur lain yang menulis prompt sistem tanpa memakai helper ini.
- Kegagalan provider AI harus tampil sebagai pesan error di UI, bukan layar kosong.
- Gambar hasil disimpan ke Storage; yang masuk DB adalah URL + metadata, bukan base64.

## Larangan

Jangan lakukan tanpa bertanya dulu:

- Menambah/menghapus dependency di `package.json`
- Mengubah skema DB atau menjalankan migrasi yang menghapus kolom/tabel
- Menambah provider AI baru (mis. TokenHarbor, OpenAI) — keputusan pemilik
- Mengirim isi curhat ke layanan apa pun selain Groq (untuk menjawab)
- Mengubah token desain di `docs/DESIGN.md`
- `git push`, `git commit --amend`, atau menulis ulang riwayat

Selalu boleh tanpa bertanya:

- Menambah test
- Menambah file yang belum dipakai
- Menjalankan command read-only (`git status`, `git log`, `ls`, `grep`)
- Menjalankan `pnpm build`, `pnpm test`, `pnpm lint`

## Cara kerja

1. Baca `docs/TASKS.md`. Ambil **satu** task yang dependency-nya sudah selesai dan
   statusnya bukan `blocked`.
2. Sebutkan task ID + rencana singkat. Tunggu konfirmasi.
3. Kerjakan hanya itu.
4. Jalankan `pnpm build` && `pnpm test`; tunjukkan output aslinya.
5. Update status di `docs/TASKS.md` + isi `docs/PROGRESS-LOG.md`.
6. Commit dengan pesan yang menjelaskan **kenapa**, bukan apa.

Kalau task berstatus `blocked`: jangan dipaksa. Laporkan terblokir, kerjakan task
lain. Kalau menemukan bug di luar cakupan: catat di bagian "Temuan di luar cakupan"
di `docs/TASKS.md`. Jangan diperbaiki sekarang.

## Definisi selesai

Sebuah task selesai hanya jika **semua** terpenuhi:

- [ ] Kriteria penerimaan di `docs/TASKS.md` terpenuhi
- [ ] `pnpm build` exit 0 — output ditunjukkan
- [ ] `pnpm test` hijau — output ditunjukkan
- [ ] Tidak ada nilai rahasia baru di file yang ikut commit
- [ ] Kriteria FR terkait di `docs/PRD.md` masih bisa diverifikasi dengan command-nya
- [ ] Tidak ada `console.log`, komentar TODO, atau file uji tertinggal
- [ ] `docs/PROGRESS-LOG.md` diperbarui

## Gaya komunikasi

- Bahasa Indonesia. Langsung, tanpa basa-basi. Kalau tidak yakin, bilang tidak yakin.
- Kalau tool gagal: laporkan gagal beserta error aslinya. Jangan mengarang hasil.
- Ringkas hasil akhir: apa yang berubah, apa yang sudah diverifikasi, apa yang tersisa.
