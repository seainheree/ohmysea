# ADR-004 — Akses v1: satu kode akses, bukan tanpa proteksi & bukan Supabase Auth

| Field | Isi |
|---|---|
| Nomor | ADR-004 |
| Tanggal | 2026-11-04 |
| Status | Diterima |
| Pengambil keputusan | Pemilik project |

## Konteks

Aplikasi di-deploy ke Vercel sehingga punya URL publik, memakai kuota gratis
Groq/Cloudflare, dan menyimpan isi curhat. v1 hanya untuk satu pengguna (Non-Goals
PRD: tanpa akun pengguna publik). Tanpa proteksi apa pun, siapa pun yang tahu URL
bisa menghabiskan kuota dan membaca isi percakapan.

## Keputusan

Gerbang akses tunggal: satu kode rahasia di `APP_ACCESS_CODE` (env), ditukar
lewat `POST /api/unlock` menjadi cookie sesi httpOnly (masa berlaku 30 hari).
Semua route API selain `/api/unlock` dan `/api/health` menolak permintaan tanpa
cookie yang sah (401).

## Alternatif yang dipertimbangkan

| Alternatif | Kelebihan | Kekurangan | Kenapa tidak dipilih |
|---|---|---|---|
| **Kode akses + cookie** (dipilih) | Nol biaya, tanpa tabel pengguna, cepat dipasang, cukup untuk 1 orang | Bukan autentikasi kuat; kode bocor = akses bocor; tidak ada audit per pengguna | — |
| Tanpa proteksi | Paling sederhana | Kuota bisa dihabiskan orang lain; isi curhat terbuka | Tidak diterima untuk data pribadi |
| Supabase Auth (email/magic link) | Standar, aman, siap multi-user nanti | Menambah tabel auth, alur kirim email, UI login, dan waktu setup yang tidak dibutuhkan untuk 1 pengguna | Berlebihan untuk v1 — bisa dinaikkan ke sini kalau butuh multi-user |
| Basic auth di Vercel (password proteksi deployment) | Tanpa kode sama sekali | Hanya tersedia di paket tertentu; kurang fleksibel untuk API | Biaya/paket |
| Membatasi lewat allowlist IP | Ketat | IP HP berubah-ubah | Tidak praktis |

## Konsekuensi

**Jadi lebih mudah:**

- Tidak ada tabel pengguna, tidak ada sesi tersimpan di DB
- Bisa dimatikan hanya dengan menghapus cookie / mengganti kode

**Jadi lebih sulit:**

- Semua route baru wajib memanggil pemeriksa sesi — mudah terlupa
- Tidak ada catatan siapa mengakses apa

**Yang harus diterima:**

- Kode akses harus diganti kalau pernah muncul di log/tangkapan layar
- Cookie = kunci. Perangkat yang dipakai bersama harus di-logout manual

## Kapan keputusan ini perlu ditinjau ulang

- Kalau aplikasi dipakai lebih dari satu orang
- Kalau muncul kebutuhan berbagi percakapan atau data per pengguna

## Referensi

- `docs/TECH-SPEC.md#5-antarmuka`, `#11-keamanan`
- `docs/PRD.md#10-pertanyaan-terbuka` (Q6 — terjawab)
