# ADR-001 — LLM chat & curhat pakai Groq, bukan TokenHarbor

| Field | Isi |
|---|---|
| Nomor | ADR-001 |
| Tanggal | 2026-11-04 |
| Status | Diterima |
| Pengambil keputusan | Pemilik project |

## Konteks

Chat dan curhat butuh LLM dengan latensi rendah dan biaya nol di kuota gratis.
Pemilik punya dua kunci: Groq dan TokenHarbor. TokenHarbor adalah gateway yang
meneruskan ke beberapa model; Groq adalah penyedia inference langsung
(OpenAI-compatible) dengan model terbuka seperti `llama-3.3-70b-versatile` dan
`openai/gpt-oss-120b`.

## Keputusan

Memakai **Groq langsung** untuk chat dan curhat, dengan dua model:
`openai/gpt-oss-120b` untuk mode chat (penalaran lebih kuat) dan `qwen/qwen3.8-27b`
untuk mode curhat (tanpa token penalaran panjang, jadi balasan lebih cepat).
Model `llama-3.3-70b-versatile` **tidak tersedia** di akun ini — diuji dengan
`GET /v1/models` (11 model) dan `POST /v1/chat/completions` → `model_not_found`.
Kunci TokenHarbor tidak dipakai; variabelnya dihapus dari `.env`/`.env.example`.

## Alternatif yang dipertimbangkan

| Alternatif | Kelebihan | Kekurangan | Kenapa tidak dipilih |
|---|---|---|---|
| **Groq** (dipilih) | Kunci sudah ada, latensi rendah, gratis di kuota, OpenAI-compatible (mudah dipindah) | Pilihan model terbatas; tanpa endpoint embedding; rate limit kuota gratis | — |
| TokenHarbor | Satu kunci untuk banyak model | Satu titik gagal tambahan; belum jelas kuota/biaya; ditambah lapisan yang tidak dibutuhkan v1 | Pemilik memutuskan tidak dipakai |
| OpenAI / Anthropic langsung | Model terkuat | Berbayar (tidak ada free tier yang cukup untuk pemakaian harian) | Melanggar tujuan G5 (biaya Rp 0) |

## Konsekuensi

**Jadi lebih mudah:**

- Satu kunci, satu provider, dokumentasi OpenAI-compatible
- Streaming lewat Vercel AI SDK dengan provider `@ai-sdk/groq`

**Jadi lebih sulit:**

- Ganti provider nanti perlu sentuh `lib/ai/groq.ts` dan prompt (bukan drop-in penuh)
- Embedding RAG harus dari provider lain (lihat ADR-002)

**Yang harus diterima:**

- Rate limit kuota gratis Groq membatasi panjang konteks & frekuensi; perlu batas laju di API

## Kapan keputusan ini perlu ditinjau ulang

- Kalau kuota gratis Groq tidak cukup untuk pemakaian harian
- Kalau butuh model dengan kemampuan khusus (mis. vision) untuk fitur baru
- Kalau TokenHarbor terbukti lebih murah pada pemakaian nyata

## Referensi

- `docs/TECH-SPEC.md#3-stack--alasan`
- `docs/PRD.md#10-pertanyaan-terbuka` (Q7 — terjawab)
