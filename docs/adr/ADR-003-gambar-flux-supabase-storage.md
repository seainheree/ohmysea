# ADR-003 — Gambar: flux-2-klein-4b + Supabase Storage

| Field | Isi |
|---|---|
| Nomor | ADR-003 |
| Tanggal | 2026-11-04 |
| Status | Diterima |
| Pengambil keputusan | Pemilik project |

## Konteks

Fitur generate image butuh text-to-image **dan** image-to-image (gambar referensi
diubah), dengan pilihan style, model, dan aspect ratio. Provider yang dipakai
harus yang sudah punya kunci (Cloudflare Workers AI). Hasil gambar perlu tempat
penyimpanan yang bisa dipanggil `<img>` dan aman dari file yang ikut commit.

## Keputusan

- Model default: **`@cf/black-forest-labs/flux-2-klein-4b`** — satu model untuk
  text-to-image dan editing/image-to-image.
- Input gambar referensi dikirim sebagai field `input_image_0` (multipart).
- Aspect ratio dikontrol lewat `width`/`height`.
- Hasil disimpan ke **Supabase Storage** bucket `images`; yang masuk DB hanya URL
  + metadata.

Sudah diuji langsung dengan kunci yang ada:

| Uji | Hasil |
|---|---|
| text-to-image (multipart, JSON body) | 200 OK, gambar JPEG base64 |
| `width=1344 height=768` | 200 OK, keluaran benar-benar 1344x768 |
| `input_image_0=@gambar.png` + prompt edit | 200 OK |
| nama field salah (`input_image`, `image`) | diabaikan tanpa error — makanya field yang benar wajib dipakai |
| `@cf/black-forest-labs/flux-1-schnell` | 200 OK (JSON), tapi pernah menolak prompt wajar dengan error NSFW (false positive) |

## Alternatif yang dipertimbangkan

| Alternatif | Kelebihan | Kekurangan | Kenapa tidak dipilih |
|---|---|---|---|
| **flux-2-klein-4b** (dipilih) | Cepat, satu model untuk generate + edit, dukung multi-referensi, width/height dihormati | Endpoint multipart (bukan JSON biasa) → pemanggilan dari Next.js perlu `FormData`; filter keamanan bisa salah tolak | — |
| flux-2-klein-9b | Kualitas lebih tinggi | Lebih lambat & lebih mahal di kuota | Disediakan sebagai pilihan model, bukan default |
| flux-1-schnell | Cepat, JSON sederhana | Tidak mendukung image-to-image → US-05 gagal | Disediakan sebagai pilihan, bukan default |
| SDXL / dreamshaper-8-lcm | Beragam gaya | Tidak mendukung image-to-image di katalog saat ini | Tidak dipilih |
| Simpan gambar sebagai base64 di kolom DB | Tanpa storage eksternal | DB membengkak; halaman berat; tidak bisa di-cache | Ditolak |
| Simpan di repo (`public/`) | Paling mudah | File besar masuk git; repo publik membocorkan gambar | Ditolak |

## Konsekuensi

**Jadi lebih mudah:**

- URL publik Storage langsung dipakai di `<img>` dan galeri
- Satu kunci Cloudflare untuk gambar + embedding

**Jadi lebih sulit:**

- Panggilan gambar dari server harus memakai `FormData` multipart, bukan `JSON.stringify`
- Perlu `SUPABASE_SERVICE_ROLE_KEY` (rahasia) untuk upload → wajib hanya di kode server
- Error NSFW false-positive harus ditangani (tampilkan pesan, sarankan ganti prompt)

**Yang harus diterima:**

- Bucket `images` harus dibuat manual di dashboard Supabase sebelum T-201
- Gambar lama tidak otomatis dibersihkan (lihat D3 di TECH-SPEC)

## Kapan keputusan ini perlu ditinjau ulang

- Kalau Cloudflare menghentikan `flux-2-klein-*`
- Kalau false-positive filter keamanan jadi sering (> 1 dari 10 permintaan)
- Kalau ukuran gambar menembus kuota storage gratis Supabase

## Referensi

- `docs/TECH-SPEC.md#3-stack--alasan`, `#5-antarmuka`
- `docs/PRD.md#6-kebutuhan-fungsional` (FR-6, FR-7, FR-8)
