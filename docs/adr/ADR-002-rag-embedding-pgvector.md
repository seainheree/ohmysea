# ADR-002 — RAG: embedding Cloudflare bge-m3 + pgvector di Postgres Supabase

| Field | Isi |
|---|---|
| Nomor | ADR-002 |
| Tanggal | 2026-11-04 |
| Status | Diterima |
| Pengambil keputusan | Pemilik project |

## Konteks

RAG sederhana butuh dua hal: pengubah teks jadi vektor, dan tempat menyimpan
vektor untuk pencarian kemiripan. Groq (provider LLM terpilih, ADR-001) **tidak
menyediakan endpoint embedding** — sudah diperiksa: `POST /v1/embeddings` tidak
ada di dokumentasi model maupun API reference Groq. Postgres Supabase yang sudah
dimiliki mendukung ekstensi pgvector.

## Keputusan

Embedding memakai **Cloudflare Workers AI `@cf/baai/bge-m3`** (1024 dimensi,
multibahasa). Vektor disimpan di tabel `chunks` pada Postgres Supabase sebagai
`vector(1024)` dengan indeks HNSW kosinus. Retrieval: top-k 4, ambang skor ≥ 0.35.

Sudah diuji dengan kunci yang ada: pemanggilan embedding mengembalikan
`success: true`, panjang vektor 1024.

## Alternatif yang dipertimbangkan

| Alternatif | Kelebihan | Kekurangan | Kenapa tidak dipilih |
|---|---|---|---|
| **Cloudflare bge-m3 + pgvector** (dipilih) | Kunci Cloudflare sudah ada (dipakai juga untuk gambar); multibahasa (Indonesia); satu DB untuk relasi + vektor; tidak ada vendor baru | Beban embedding masuk ke kuota Workers AI; pgvector perlu dirawat di DB yang sama | — |
| Cloudflare Vectorize | Ditujukan khusus vektor, skalanya bagus | Vendor & lapisan baru; data terpisah dari relasi; dua tempat untuk dijaga | Berlebihan untuk skala v1 (< 50k chunk) — lihat D1 di TECH-SPEC |
| Embedding lewat gateway pihak ketiga (mis. TokenHarbor) | Bisa satu kunci | Tidak dipakai pemilik (ADR-001); kuota/biaya tidak jelas | Ditolak pemilik |
| Embedding lokal (model di mesin/worker sendiri) | Tanpa biaya API, data tidak keluar | Perlu waktu setup & RAM; deploy Vercel tidak bisa menjalankan model lokal | Tidak sepadan untuk v1 |
| Tanpa vektor: pencarian kata kunci BM25/`ILIKE` | Paling sederhana | Kualitas retrieval jauh lebih buruk untuk parafrase | RAG jadi tidak berguna |

## Konsekuensi

**Jadi lebih mudah:**

- Satu koneksi DB untuk data relasional dan vektor; join chunk↔dokumen gratis
- Multibahasa: dokumen Indonesia dan Inggris pakai ruang vektor yang sama
- Kunci Cloudflare dipakai bersama gambar → satu tempat untuk mengatur kuota

**Jadi lebih sulit:**

- Mengganti model embedding = membangun ulang seluruh vektor (dimensi berbeda)
- Query mirip butuh operator jarak pgvector (`<=>`), tidak bisa dilayani ORM biasa tanpa `sql` mentah

**Yang harus diterima:**

- Ekstensi `vector` harus aktif di project Supabase sebelum migrasi pertama
- Migrasi drizzle memakai koneksi non-pooler (port 5432)

## Kapan keputusan ini perlu ditinjau ulang

- Jumlah chunk menembus ~50k atau latensi pencarian > 300 ms
- Cloudflare menghentikan model `bge-m3`
- Muncul kebutuhan reranking/hybrid search (lihat Non-Goals PRD)

## Referensi

- `docs/TECH-SPEC.md#3-stack--alasan`, `#4-model-data`
- `docs/PRD.md#10-pertanyaan-terbuka` (Q1, Q2 — terjawab)
