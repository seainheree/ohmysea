# ohmysea

Chatbot web pribadi dengan RAG sederhana. Tiga mode dalam satu aplikasi: **chat**
(ngobrol dengan memori percakapan), **curhat** (mode bercerita, ditanggapi
empatik), dan **generate image** (text-to-image dan image-to-image, dengan pilihan
style, model, serta aspect ratio). Jawaban chat/curhat bisa memakai konteks dari
kumpulan dokumen sendiri (RAG sederhana, sumber ikut ditampilkan).

## Ringkas project

| Field | Isi |
|---|---|
| Nama | ohmysea |
| Jenis | Web app — chatbot + RAG + generator gambar |
| Tujuan | Satu tempat untuk ngobrol, curhat, dan bikin gambar; bisa dipakai dari HP; biaya Rp 0 di kuota gratis |
| Anggaran | Rp 0/bulan (free tier Vercel, Supabase, Groq, Cloudflare Workers AI) |
| Stack | Next.js 16.4.5, React 19.3.1, TypeScript 7.0.2, Tailwind 4.3.4, Drizzle 0.45.4, pnpm 12.16.1 |
| Penyimpanan data | Supabase Postgres + pgvector; gambar di Supabase Storage |
| Model AI | Groq `openai/gpt-oss-120b` (chat) & `qwen/qwen3.8-27b` (curhat), Cloudflare `@cf/baai/bge-m3` (embedding), Cloudflare `@cf/black-forest-labs/flux-2-klein-4b` (gambar) |
| Deploy | Vercel |

## Menjalankan lokal

```bash
pnpm install
cp .env.example .env     # isi DATABASE_URL, kunci Groq/Cloudflare/Firecrawl, APP_ACCESS_CODE
pnpm db:generate
pnpm db:migrate
pnpm rag:ingest ./contoh-dokumen.md
pnpm dev                 # http://localhost:3000
```

Detail lengkap ada di `docs/TECH-SPEC.md` §9.

## Status

**Jalan di produksi:** https://ohmysea-iy4k3iv29-itz12.vercel.app (alias: https://ohmysea.vercel.app)

Yang sudah terverifikasi dengan command: gerbang kode akses, chat streaming + memori, mode curhat, RAG
(ingest berkas & URL, retrieval pgvector), generate gambar text-to-image & image-to-image, galeri.
Sisa yang masih manual (mata/keyboard): checklist 360 px, uji keyboard-only, dan 5 pertanyaan uji RAG
di `docs/PROGRESS-LOG.md`. Rincian status per task: `docs/TASKS.md`.

## Dokumen

- `docs/PRD.md` — kenapa & apa (termasuk Non-Goals)
- `docs/TECH-SPEC.md` — bagaimana
- `docs/TASKS.md` — urutan kerja + command verifikasi
- `docs/adr/` — keputusan penting + alasannya
- `docs/DESIGN.md` — token desain & checklist visual
- `AGENTS.md` — aturan untuk agent
- `docs/PROGRESS-LOG.md` — catatan akhir sesi
- `CARA-PAKAI.md` — panduan kit vibecoding (asal scaffold ini)
