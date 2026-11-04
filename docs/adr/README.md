# Daftar Keputusan Arsitektur (ADR) — ohmysea

Satu ADR = satu keputusan. ADR **tidak pernah dihapus**. Kalau sebuah keputusan
diganti, set ADR lama ke `Digantikan oleh ADR-00X` lalu buat file baru.

| Nomor | Judul | Status | Tanggal |
|---|---|---|---|
| [ADR-001](ADR-001-llm-groq.md) | LLM chat & curhat pakai Groq, bukan TokenHarbor | Diterima | 2026-11-04 |
| [ADR-002](ADR-002-rag-embedding-pgvector.md) | RAG: embedding Cloudflare bge-m3 + pgvector di Postgres Supabase | Diterima | 2026-11-04 |
| [ADR-003](ADR-003-gambar-flux-supabase-storage.md) | Gambar: flux-2-klein-4b + Supabase Storage | Diterima | 2026-11-04 |
| [ADR-004](ADR-004-akses-kode-tunggal.md) | Akses v1: satu kode akses, bukan tanpa proteksi & bukan Supabase Auth | Diterima | 2026-11-04 |

## Kapan keputusan perlu ADR

Punya ADR kalau ada **alternatif nyata** yang wajar dipilih orang lain. Tidak perlu
ADR untuk hal yang hanya punya satu pilihan masuk akal (mis. "pakai HTTPS") — cukup
satu kalimat di `TECH-SPEC.md`.
