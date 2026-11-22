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

### 2026-11-23 — Animasi AI & aliran jawaban halus

- **Sesi**: lanjutan
- **Tujuan**: pemilik minta animasi AI saat chat, aliran jawaban mulus, tipografi balasan lebih profesional, dan bingkai lingkaran avatar dibuang
- **Dikerjakan**:
  - `app/page.tsx`: potongan stream dikumpulkan lalu dicat sekali per frame (`requestAnimationFrame`) — sebelumnya tiap token memicu render sendiri sehingga teks bergetar; buffer dibersihkan di jalur sukses, gagal, dan ulang.
  - `components/chat/MessageList.tsx`: kursor menulis memakai CSS `.kursor-menulis` (pudar lembut), bukan animasi framer per frame; status "Kirby sedang menjawab..." memakai `.teks-kilau` (kilau bergerak); titik menunggu naik-turun + skala halus; balasan asisten `text-[15px] leading-7 text-pretty`.
  - `components/chat/MessageList.tsx`: avatar Kirby `object-contain` tanpa `rounded-penuh`/border/latar (sesuai permintaan hapus lingkaran).
  - `app/globals.css`: keyframes kilau teks, kursor pudar, titik dengan skala; `will-change` pada titik.
- **Keputusan**: tanpa dependensi baru. Animasi status pakai CSS (murah, tidak memicu render React).
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` **9 file / 65 lulus** EXIT=0
- **Blocker**: tidak ada
- **Next**: cek browser — kirim pesan panjang, teks harus mengalir rata tanpa getar; status menunggu berkilau; avatar tanpa lingkaran.

---

### 2026-11-23 — Poles UI/UX chatbot: smart scroll, salin, drag-drop, waktu relatif

- **Sesi**: lanjutan
- **Tujuan**: pemilik minta chatbot UI/UX profesional maksimal
- **Dikerjakan**:
  - `components/chat/MessageList.tsx`: gulir otomatis hanya bila pengguna berada ≤120 px dari dasar (tidak lagi menarik paksa saat membaca ke atas); tombol "Pesan terbaru" muncul saat tergulir jauh; tombol salin (ikon `salin` → `centang`) di setiap balasan asisten.
  - `components/chat/Composer.tsx`: berkas bisa dilepas (drag & drop) ke area komposer dengan overlay petunjuk; penghitung karakter muncul >3000 dan mengunci kirim >4000 (batas sama dengan zod `/api/chat`).
  - `components/chat/Sidebar.tsx`: waktu relatif (`lib/waktu.ts`) di tiap baris; aksi ubah/hapus hanya muncul saat hover/fokus di desktop, selalu tampil di HP.
  - `components/ui/Icon.tsx`: ikon `salin`, `bawah`.
  - `lib/waktu.ts` + `lib/waktu.test.ts` (3 test).
- **Keputusan**: tanpa dependensi baru. Karakter batas dikunci di klien + tetap divalidasi server.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0; `pnpm test` **9 file / 65 lulus** EXIT=0
- **Blocker**: tidak ada
- **Next**: cek browser — gulir ke atas saat balasan streaming (harus tetap di posisi), lepas berkas ke komposer, salin balasan, hover baris sidebar.

---

### 2026-11-23 — Animasi selalu aktif (tanpa cabang `prefers-reduced-motion`)

- **Sesi**: lanjutan
- **Tujuan**: pemilik minta "full animasi tanpa reduce motion"
- **Dikerjakan**:
  - `components/chat/useLenis.ts`: cabang `prefers-reduced-motion` dibuang — gulir halus selalu dipasang.
  - `components/chat/MessageList.tsx` & `app/gambar/page.tsx`: `gsap.matchMedia` dibuang; timeline & ScrollTrigger jalan tanpa syarat.
  - `app/globals.css`: dua blok `@media (prefers-reduced-motion)` dihapus (transisi & animasi titik/kursor selalu jalan).
  - `lib/motion.ts` + FR-18 + T-1001 diselaraskan.
- **Keputusan**: gerak selalu aktif; konsekuensi aksesibilitas diterima pemilik.
- **Verifikasi**: `pnpm lint` / `pnpm build` / `pnpm test` (lihat entri sesi UI berikutnya untuk hasil akhir).
- **Blocker**: tidak ada
- **Next**: lanjut poles UI/UX chatbot.

---

### 2026-11-23 — GSAP + ScrollTrigger: hero parallax & reveal galeri

- **Sesi**: lanjutan
- **Tujuan**: pemilik minta animasi kelas situs profesional; memilih opsi "GSAP + ScrollTrigger (hero pro)", framer-motion tetap, wajib hormati `prefers-reduced-motion`
- **Dikerjakan**:
  - Dependensi baru (disetujui pemilik): `gsap` 3.15.1 + `@gsap/react` 2.1.2
  - `lib/motion.ts`: token `GSAP_EASE` (`power3.out` ≈ `KURVA_STANDAR`, `power2.out`) — tidak ada angka durasi baru di komponen
  - `components/chat/useLenis.ts`: `autoRaf:false`; rAF Lenis dijalankan `gsap.ticker`, tiap gulir meneruskan `ScrollTrigger.update`; GSAP diimpor dinamis supaya tidak masuk bundel awal; semua batal saat `prefers-reduced-motion`
  - `components/chat/MessageList.tsx`: `EmptyState` → `useGSAP` + `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`; timeline masuk avatar → judul → subjudul; parallax `scrub` pada wadah gulir chat; `revertOnUpdate` supaya trigger tidak dobel saat `wadahGulir` siap
  - `app/gambar/page.tsx`: kartu galeri (`.kartu-galeri`) reveal sekali saat masuk viewport + header masuk halus; ScrollTrigger memakai wadah gulir halaman itu sendiri
  - `app/page.tsx`: teruskan `wadahGulir` ke `MessageList`
  - Docs: FR-18 diperbarui, tabel Stack `AGENTS.md`, milestone M10 + T-1001
- **Keputusan**: GSAP **tidak** menggantikan framer-motion (pesan/dialog/elemen lain tetap framer). Pin section galeri sengaja tidak dipakai — `position:fixed` di dalam wadah `overflow` rawan glitch; reveal + parallax sudah cukup. Semua motion lewat `gsap.matchMedia`, bukan cek manual.
- **Verifikasi**: `pnpm lint` EXIT=0; `pnpm build` EXIT=0 (17 halaman); `pnpm test` 62 lulus (8 file) EXIT=0. Bukti visual gulir (parallax/reveal) belum diuji otomatis — perlu cek mata di browser.
- **Blocker**: tidak ada
- **Next**: buka `localhost:3000` — sapaan hero harus masuk berurutan lalu bergeser halus saat digulir; `/gambar` — kartu muncul saat digulir. Cek juga dengan OS "reduce motion" → tidak ada animasi.

---

- **Sesi**: lanjutan
- **Tujuan**: pemilik minta "fix UI". Berkas `ui-ux-fixes-analysis.md` (untracked) berisi 10 klaim perbaikan — diperiksa, sebagian besar salah/tak relevan, tidak ada perubahan kode di tree.
- **Diagnosa**: `ui-ux-fixes-analysis.md` mengklaim "Fix Applied" + "62 tests pass" padahal `git status` hanya menampilkan berkas itu (nol perubahan kode). Cek tiap klaim: (1) sidebarRingkas tidak terbalik, (2) ModeSwitch HP sudah ada baris kedua, (3/8) chip saran sudah dibatasi 3 + `flex-wrap`, (4) ikon tema = tujuan + `title`, (6) retry gambar sudah implisit (prompt dipertahankan), (7) tampilkan "Sedang menjawab..." untuk durasi <1 dtk justru bikin kedip, (9) CSS transition pada tinggi textarea bikin jank. **Bug nyata** yang tak ada di daftar: banner error chat dirender di atas wadah gulir, sedangkan efek auto-scroll `MessageList` selalu turun ke bawah → saat kirim gagal pesan error ke luar layar.
- **Dikerjakan**:
  - `app/page.tsx`: banner error dipindah dari atas wadah gulir ke bawah (di atas komposer, sebaris dengan catatan memori) + `role="alert"`; selalu terlihat.
  - `components/chat/Composer.tsx`: setelah ganti mode, fokus kembali ke kotak tulis (skip saat muat pertama) — klaim #10, satu-satunya yang nyata.
  - `components/chat/MessageList.tsx`: chip saran lanjutan masuk berurutan pakai token `TRANSISI.cepat` (klaim #3/#8, gerak sesuai FR-18).
  - `ui-ux-fixes-analysis.md` dihapus (klaim palsu, untracked).
- **Keputusan**: tidak menambah dependensi. Perbaikan galeri-hover (klaim #5) ditolak — animasi `whileHover` framer tak menghormati `prefers-reduced-motion` tanpa `useReducedMotion`, sementara nilai tambah kecil.
- **Verifikasi**: `pnpm build` EXIT=0 (17 halaman); `pnpm test` 62 lulus (8 file) EXIT=0
- **Blocker**: tidak ada
- **Next**: uji browser cepat — kirim pesan dengan provider mati (banner error harus terlihat di bawah), ganti mode (kursor pindah ke kotak tulis), cek chip saran muncul berurutan

---

- **Sesi**: lanjutan
- **Tujuan**: pemilik melaporkan lampiran tidak ikut konteks chat & tak tampil di bubble
- **Diagnosa**: bukan bug kode. Uji E2E ke API lokal **dan** produksi membuktikan lampiran sudah masuk konteks (balasan menyebut isi berkas, `x-ohmysea-sumber` berisi dokumennya, `sources` pesan pengguna terisi). Penyebab: deployment Vercel terakhir 20 jam lalu (pra-`2e7eb3f`) — build lama belum punya lampiran per sesi, `attachmentIds` di bubble, dan penyaring chip "Konteks". Auto-deploy GitHub **tidak** tersambung (`vercel git connect` disarankan), sehingga push ke `main` tak memicu build baru.
- **Dikerjakan**: `vercel --prod` (deployment `ohmysea-c8xflhlqo`, alias `https://ohmysea.vercel.app`); verifikasi E2E produksi: lampiran `catatan.txt` → balasan memuat `NANGKA-9182`, header sumber & sumber pesan pengguna terisi. Percakapan uji dihapus.
- **Keputusan**: setelah `git push`, jalankan `vercel --prod` (atau `vercel git connect` sekali untuk auto-deploy)
- **Verifikasi**: E2E lokal & produksi — lampiran dipakai menjawab + muncul sebagai sumber
- **Blocker**: tidak ada
- **Next**: (opsional) `vercel git connect` supaya push otomatis deploy

---

### 2026-11-21 — Pratinjau lampiran + tombol kamera

- **Sesi**: lanjutan
- **Tujuan**: permintaan pemilik — gambar/berkas yang diunggah harus kelihatan di bubble chat; tambah tombol kamera yang langsung membuka kamera perangkat
- **Dikerjakan**:
  - Pratinjau: `app/page.tsx` menyimpan object URL per `documentId` (`pratinjau`); dibuat sekali dari berkas asli, di-`revoke` saat lampiran gagal/dihapus. `MessageList` menampilkan thumbnail di bubble pesan pengguna (klik = buka gambar penuh); `Composer` menampilkan thumbnail di kotak lampiran & chip "Berkas sesi"
  - Kamera: `<input type="file" accept="image/*" capture="environment">` + tombol kamera **di dalam command box, terpisah dari tombol lampiran** (di kanan, sebelum tombol kirim) — di ponsel langsung membuka kamera, hasilnya lewat jalur lampiran gambar yang sama (OCR + vision)
- **Keputusan**: pratinjau hanya di klien (object URL), tidak disimpan ke DB (bukan base64 di DB); kamera pakai native `capture`, bukan `getUserMedia`
- **Verifikasi**: `pnpm build` EXIT=0; `pnpm test` 8 file / 62 lulus EXIT=0
- **Blocker**: tidak ada
- **Next**: kalau perlu webcam desktop, ganti tombol kamera ke modal `getUserMedia`

---

### 2026-11-21 — Tema lewat cookie (hapus warning script React)

- **Sesi**: lanjutan
- **Tujuan**: hilangkan Console Error `Encountered a script tag while rendering React component` di `app/layout.tsx`
- **Dikerjakan**: `next/script` (baik `src` maupun `dangerouslySetInnerHTML`) ternyata **sendiri** me-render `<script dangerouslySetInnerHTML>` berisi bootstrap `self.__next_s.push(...)`, jadi warning React 19 tak terhindarkan. Solusi: buang semua script tag; tema dipindah ke cookie. `app/layout.tsx` jadi async, baca `cookies()`, set `<html data-tema>` di server (tanpa kedipan). `ThemeToggle` menulis pilihan ke cookie (`ohmysea-tema`) + localStorage.
- **Keputusan**: server menentukan tema dari cookie; tidak ada skrip inline di dokumen (docs Next: jangan tulis `<head>` manual; skrip beforeInteractive disuntik Next).
- **Verifikasi**: `pnpm build` EXIT=0; `pnpm test` 62 lulus; `curl -H "Cookie: ohmysea-tema=terang" /` → `<html ... data-tema="terang">`; tanpa cookie → `gelap`; `__next_s` = 0 di HTML
- **Blocker**: tidak ada
- **Next**: tidak ada

---

### 2026-11-21 — QA/QC /understand + perbaikan hidrasi tema

- **Sesi**: lanjutan
- **Tujuan**: analisis kode (/understand) untuk QA/QC + bereskan error hidrasi yang muncul di log dev
- **Dikerjakan**:
  - `/understand` penuh: 106 file → 248 node / 510 edge / 10 layer / tour 14 langkah, tersimpan di `.ua/knowledge-graph.json` (+ `fingerprints.json`, `meta.json`)
  - Perbaikan `app/layout.tsx`: `<head>` manual + `metaFallback` (churn sesi sebelumnya) memicu "text node in head" + hidrasi gagal; diganti `next/script` `strategy="beforeInteractive"` dan `suppressHydrationWarning` di `<html>`. Skrip tema kembali membaca localStorage/sistem (persistensi tema pulih; kelas mati `tema-loaded` dibuang)
- **Keputusan**: jangan menulis `<head>` manual di App Router — Next mengelola head; skrip beforeInteractive disuntik Next sendiri
- **Verifikasi**: `pnpm build` EXIT=0; `pnpm test` 8 file / 62 lulus EXIT=0; `GET localhost:3000` → status 200, 0 `<meta name="ohmysea-tema">` nyasar, skrip tema ter-inject
- **Blocker**: tidak ada
- **Next**: jalankan dashboard `.ua` bila perlu jelajah graf

---

### 2026-11-21 — Berkas per sesi, memori paten vs otomatis, chip konteks bersih

- **Sesi**: lanjutan
- **Tujuan**: permintaan pemilik — berkas menempel di satu sesi chat (bukan sekali pakai); memori paten dipisah dari memori simpan otomatis dengan tabel terpisah; chip "Konteks" hanya untuk berkas yang diunggah; kartu saran di layar awal dihapus
- **Dikerjakan**:
  - T-901: `hapusLampiranPercakapan()` dihapus; `GET /api/conversations/[id]` mengembalikan `berkas`; komposer menampilkan "Berkas sesi"; `attachmentIds` dicatat di `sources` pesan pengguna
  - T-902: tabel `permanent_memories` + migrasi `0003_high_iron_fist.sql`; `ambilMemoriAktif`/`memoriSudahAda`/`simpanMemoriOtomatis` membaca dua tabel; panel Pengaturan terbagi "Memori paten" dan "Memori simpan otomatis"; PATCH/DELETE memilih tabel lewat `paten`
  - T-903: chip balasan difilter ke dokumen lampiran; dokumen global tetap dipakai menjawab
  - T-904: empat kartu saran di `EmptyState` dihapus
- **Keputusan**: tabel terpisah (bukan kolom `sumber`) sesuai permintaan pemilik. Migrasi hanya menambah `permanent_memories`; delta `documents` dari drizzle (sudah ada di `0002_lampiran`) dibuang manual supaya migrasi tidak gagal.
- **Verifikasi**: `pnpm test` 62 lulus (8 file); `pnpm build` EXIT=0; `pnpm db:migrate` sukses — tabel `permanent_memories` ada
- **Blocker**: tidak ada
- **Next**: uji browser :3000 — unggah berkas, tanya di turn berikutnya, cek dua tabel memori di Pengaturan

---

### 2026-11-21 — Konteks lampiran tampil & hanya dari berkas terunggah

- **Sesi**: lanjutan
- **Tujuan**: permintaan pemilik — berkas yang diunggah harus tampil di bubble pesan yang sama dan konteks tak boleh "tidak terbaca"; jangan campur dokumen global saat ada unggahan
- **Dikerjakan**:
  - T-801: chip "Konteks" di bubble pesan pengguna (bertahan setelah reload, dari `messages.sources`; tampil juga saat streaming)
  - T-802: `/api/chat` mencatat dokumen lampiran ke `sources` pesan user; `pilihPotongan()` memakai lampiran tanpa ambang skor
  - T-803: `aktifIdRef` — hilangkan lomba conversationId saat kirim tepat setelah unggah
  - T-804: `hanyaLampiran` — saat ada lampiran, dokumen global (ADR/PRD/DESIGN) tidak ikut konteks
- **Keputusan**: lampiran tetap sekali pakai (T-701 dipertahankan). Penanda lampiran disimpan di `messages.sources` (nol migrasi). Tidak ada dependensi baru.
- **Verifikasi**: `pnpm test` 62 lulus (8 file, +5 test `retrieve.test.ts`); `pnpm build` EXIT=0
- **Blocker**: tidak ada
- **Next**: uji browser ulang unggah `.docx` di :3000 — konteks harus hanya berisi berkas itu

---

### 2026-11-21 — Lampiran sekali pakai, markdown rapi, regenerate, saran lanjutan

- **Sesi**: lanjutan
- **Tujuan**: permintaan pemilik — berkas dipakai sekali lalu dibuang, jawaban tampil rapi tanpa tanda markdown mentah, tombol ulangi (ikon saja), saran pertanyaan lanjutan dengan sakelar di navbar
- **Dikerjakan**:
  - T-701: `hapusLampiranPercakapan()` dipanggil di `onFinish` `/api/chat`; chip lampiran di komposer dilepas setelah balasan
  - T-702: `lib/markdown.ts` + `components/chat/Markdown.tsx` — parser sendiri (tanpa HTML mentah, tautan non-http ditolak)
  - T-703: baris "Konteks" + chip nama dokumen di bawah balasan, dari `messages.sources`
  - T-704: `regenerate:true` di `/api/chat` + tombol ikon `ulang` di balasan terakhir
  - T-705: `POST /api/saran` + chip saran + sakelar bintang di navbar (`localStorage: ohmysea-saran`)
- **Keputusan**: chip nama dokumen sekarang tampil di balasan (sebelumnya dilarang di AGENTS.md) — permintaan pemilik, aturan diperbarui. Tidak ada dependensi baru.
- **Verifikasi**: `pnpm lint` bersih; `pnpm test` 57 lulus; `pnpm build` exit 0; uji end-to-end dev :3100 — unggah `uji.txt` → jawaban `**SEA-1234**` → unggah ulang `ditimpa:false` (lampiran terhapus) → regenerate `roles: user,assistant` (assistant 1) → `/api/saran` 3 pertanyaan; uji browser: `strong` 7, `li` 11, `**` di DOM 0, chip konteks + tombol ulang + 3 chip saran tampil
- **Blocker**: tidak ada
- **Next**: deploy produksi (`vercel --prod`) lalu uji tombol lampiran di HP

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

### 2026-11-04 — M6: indikator ganda, latar transparan gambar, jawaban tidak kaku, gerak UI

- **Sesi**: lanjutan (laporan bug pemilik: "setiap respon setelah ai menjawab terjadi pengulangan loading", minta latar transparan di fitur gambar, minta jawaban tidak memakai frasa "tidak ada dokumen yang kamu tambahkan", dan minta Framer Motion + AnimatePresence + Lenis)
- **Dikerjakan**:
  - **Bug indikator berulang**: penyebabnya `sibuk` masih `true` selama jeda 2,5 detik pengecekan memori sementara `streaming` sudah dikosongkan → `menunggu` jadi `true` lagi. `setSibuk(false)` dipindah ke tepat setelah balasan tampil (sebelum microtask memori), `finally` dihapus.
  - **Latar transparan**: dicek langsung ke Workers AI — `flux-2-klein-4b` selalu membalas **JPEG tanpa kanal alfa** dan tidak ada model `remove-background` di akun, jadi jalur "model menghasilkan PNG transparan" tidak mungkin. Implementasi: checkbox "Latar transparan" menambahkan `PETUNJUK_TRANSPARAN` (latar putih rata, tanpa bayangan) ke prompt; tombol **Unduh PNG transparan** mengambil gambar lewat `/api/images/file` (same-origin, supaya canvas tidak tainted), menghapus putih yang tersambung ke tepi (flood-fill) + menghaluskan tepi, lalu mengunduh PNG ber-alfa.
  - **Jawaban tidak kaku**: `SYSTEM_CHAT` diubah — kalau dokumen tidak memuat jawaban, Kirby tetap menjawab dari pengetahuan umum dan menambahkan catatan singkat bahwa itu bukan dari dokumen; kalimat "tidak ada di dokumen yang kamu tambahkan" dilarang eksplisit. FR-4 di PRD disesuaikan.
  - **Gerak UI**: dependency `framer-motion 14.9.0` + `lenis 1.3.27` (diminta pemilik). Token gerak di `lib/motion.ts` (150–400 ms, satu kurva standar, spring untuk dialog). Pesan chat, kartu galeri, catatan memori, dan dialog memakai `motion`; `useLenis` memasang gulir halus pada wadah chat dan mati sendiri saat `prefers-reduced-motion`.
  - **Pelajaran penting**: animasi *exit* `AnimatePresence` pada elemen `fixed`/bubble **menyisakan node tak terlihat di DOM** — indikator tetap ada setelah jawaban dan overlay dialog tetap menutupi layar setelah "Batal". Perbaikan: animasi hanya untuk masuk, elemen keluar di-unmount langsung. Saringan memori juga menolak fakta yang menyebut "Kirby" (nama asisten) supaya tidak tersimpan sebagai identitas pengguna.
- **Verifikasi** (output asli, lokal `next start -p 3500`):
  - Timeline browser: 0,7 dtk `titik=3` / header "Kirby sedang menjawab..." → 2,2 dtk `titik=0` (teks mulai mengalir) → 3,6 dtk header "Kirby siap membantu", `balasan=1`, `titik=0`; tetap `titik=0` sampai 15 dtk (tidak berulang)
  - Dialog Pengaturan: klik "Hapus riwayat" → `[role=dialog]` muncul ("Hapus riwayat percakapan?"); klik Batal → dialog hilang total, overlay sisa **0**, halaman tetap bisa diklik
  - Latar transparan: 8 kartu galeri punya tombol "Unduh PNG transparan"; klik → pesan "PNG transparan diunduh."; uji alfa pada gambar 1024×1024 → **851.640 / 1.048.576 piksel transparan (81,2%)**
  - Motion: 9 elemen ber-`style` animasi di halaman chat, 8 kartu galeri beranimasi; `lib/motion.ts` jadi satu sumber durasi
  - Lenis: `<main>` mendapat class `lenis` setelah mount (hook jalan ulang karena menerima elemen, bukan ref); dimatikan bila `prefers-reduced-motion`
  - `pnpm lint` bersih · `pnpm test` **42 lulus** · `pnpm build` exit 0
- **Catatan**: verifikasi gulir Lenis lewat event roda sintetis CDP tidak bisa dipakai sebagai bukti (CDP menghantar drag, bukan `wheel`); bukti yang dipakai = class `lenis` pada wadah + tidak ada error runtime.
- **Blocker**: tidak ada
- **Next**: kandidat lanjutan = CI GitHub Actions, auto-deploy repo→Vercel, rate limit Redis, retensi gambar (D3)

### 2026-11-04 — T-506: sesi dipendekkan ke 24 jam + kode akses produksi diperbarui

- **Sesi**: lanjutan (pemilik memperbarui `APP_ACCESS_CODE` di `.env` dan meminta sesi 24 jam)
- **Dikerjakan**:
  - `lib/session.ts`: `MAX_AGE_SECONDS` 30 hari → **24 jam** (`Max-Age=86400`); nilai cookie tetap HMAC-SHA256(kode), jadi mengganti kode otomatis membatalkan semua sesi lama
  - Env Vercel **Production** `APP_ACCESS_CODE` dihapus lalu ditambahkan ulang dengan nilai baru dari `.env` (nilai tidak pernah ditampilkan/di-commit), lalu produksi di-deploy ulang
  - Dokumen diselaraskan: `docs/TECH-SPEC.md` (checklist keamanan) dan `docs/adr/ADR-004-akses-kode-tunggal.md`
- **Verifikasi** (output asli, produksi https://ohmysea.vercel.app setelah deploy ulang):
  - kode salah → `401`; kode baru (dari `.env`) → `200`
  - header: `Set-Cookie: ohmysea_sesi=…; Expires=Thu, 05 Nov 2026 09:58:24 GMT; Max-Age=86400; Secure; HttpOnly; SameSite=lax`
  - cookie baru: `GET /api/conversations` → `200`, `POST /api/chat` → `200`
  - cookie asal-asalan → `401`; HMAC lokal dari kode baru (`13ed264e7495d27e…`) sama dengan nilai cookie yang diterima produksi → produksi benar-benar memakai kode baru
  - Lokal: `pnpm lint` bersih · `pnpm test` 41 lulus · `pnpm build` exit 0
- **Catatan**: semua sesi lama (cookie dari kode sebelumnya) otomatis tidak berlaku → perangkat lain harus memasukkan kode akses baru, dan sesi berakhir tiap 24 jam
- **Blocker**: tidak ada

### 2026-11-04 — M5: tema, sidebar bisa ditutup, footer rapi, identitas Kirby, memori otomatis

- **Sesi**: lanjutan (permintaan pemilik: tema light/night, sidebar bisa ditutup, footer jangan terpotong, AI bernama Kirby dengan avatar, sembunyikan daftar dokumen dan tampilkan durasi jawaban, Kirby menyimpan memori sendiri dengan penyaring yang bagus)
- **Dikerjakan**:
  - **Tema** (FR-14): token tema terang di `app/globals.css` (`html[data-tema="terang"]` menimpa `--color-*` dari `@theme`, jadi utilitas Tailwind ikut berubah); sakelar `components/ui/ThemeToggle.tsx` di header & Pengaturan; skrip kecil di `<head>` menentukan tema sebelum halaman dilukis (tidak ada kedipan); pilihan disimpan di `localStorage`, bawaan ikut `prefers-color-scheme`
  - **Layout** (FR-15): `body` jadi grid `grid-rows-[1fr_auto] h-dvh` — isi aplikasi menggulir di baris pertama, footer duduk sendiri di baris kedua sehingga tidak terpotong/ditimpa komposer; sidebar bisa disembunyikan di ≥ 768 px lewat tombol panel di header (`localStorage` mengingat pilihannya)
  - **Identitas Kirby** (FR-16): `public/image/kirby.png` (451×480) di-crop tengah & diperkecil jadi `kirby-64.png` + `kirby-96.png`; avatar tampil di sapaan awal, tiap balasan, dan saat menunggu; label balasan "Kirby · 2,0 detik · 16.45"; indikator menulis tiga titik bergerak + teks "Kirby sedang menjawab..." (curhat: "Kirby sedang menyimak..."); chip nama dokumen beserta skornya **dihapus** dari tampilan (nama dokumen tetap disebut di dalam teks jawaban, aturan sumber di AGENTS.md tetap berlaku); persona di `lib/ai/prompts.ts` jadi Kirby
  - **Sapaan awal** (FR-16): `lib/panggilan.ts` membaca panggilan pengguna dari memori aktif → "Hi Sasha, Kirby di sini poyoo~"
  - **Memori otomatis** (FR-12): setelah balasan selesai, `onFinish` di `app/api/chat/route.ts` memanggil `simpanMemoriOtomatis()` — model murah (`GROQ_MODEL_MEMORI`, default `openai/gpt-oss-20b`) mengekstrak fakta, lalu disaring: kategori wajib (identitas/preferensi/kebiasaan/tujuan/pekerjaan/relasi), panjang 12–400 karakter, tolak data sensitif (sandi/PIN/OTP/NIK/rekening/kartu), tolak kejadian sesaat ("hari ini", "lagi", "sedang"), wajib tentang pengguna, tolak duplikat (kata umum dibuang + kecocokan ⊆/Jaccard ≥ 0,5), maks 2 butir per pertukaran & 90 baris total; klien bisa mematikannya di Pengaturan (`autoMemori:false`); model kecil kadang memotong JSON → ada pemulihan butir-per-butir. (`after()` sempat dicoba dan **tidak** dieksekusi di Vercel sehingga tidak ada memori tersimpan; `onFinish` dipakai karena callback itu sudah terbukti jalan di produksi.)
- **Verifikasi** (output asli):
  - Lokal: `pnpm lint` bersih · `pnpm test` **41 lulus** (4 berkas; tambah `lib/panggilan.test.ts` + uji saringan memori) · `pnpm build` exit 0
  - Lokal (API memori otomatis, server `next start -p 3500`): "Panggil aku Sha… aku suka kopi hitam tanpa gula, dan aku kerja sebagai desainer grafis" → tersimpan 2 butir ("Aku suka kopi hitam tanpa gula", "Aku kerja sebagai desainer grafis"); keluhan sesaat ("capek banget hari ini") tidak menambah memori; data sensitif ("kata sandi emailku bulan123 dan PIN kartuku 4321") **tidak** tersimpan (`bocor? False`); `autoMemori:false` → jumlah memori tetap 3; balasan berikutnya menyebut fakta dari memori ("Kamu suka kopi hitam tanpa gula."); mode curhat juga menyimpan fakta tahan lama ("Aku tinggal di Bandung dan suka jalan pagi sebelum kerja")
  - Lokal (browser 1440 px): sapaan awal "Hi Sasha, Kirby di sini poyoo~" + avatar; saat menunggu 3 titik + "Kirby sedang menjawab..." (header sama); setelah selesai label "Kirby · 2,0 detik · 16.45"; `chipDokumenLama: 0`, tidak ada teks skor dokumen; catatan "Kirby menyimpan 1 memori baru — lihat di Pengaturan."
  - Lokal (browser sebelumnya, 1440/768/360 px): tema terang `body` → `rgb(247, 247, 251)` teks `rgb(22, 22, 31)`, footer putih, pilihan "terang" tersimpan; gelap → `rgb(26, 26, 38)`; sidebar disembunyikan → `display: none`, area chat melebar ke 1440 px, pilihan "ringkas" bertahan setelah reload; footer `bottom = 900` (penuh terlihat) dan jarak ke komposer 0 di 1440 px, di 360 px footer 41 px terlihat penuh, tanpa overflow horizontal
- Produksi (https://ohmysea.vercel.app, deploy terakhir): health `True`, `/pengaturan` memuat "Memori AI"; memori otomatis → "Panggil aku Sha… aku suka kopi hitam tanpa gula dan aku kerja sebagai desainer grafis" menghasilkan **2 memori** ("Aku suka kopi hitam tanpa gula", "Aku kerja sebagai desainer grafis") + catatan "Kirby menyimpan 2 memori baru — lihat di Pengaturan."; pesan sesaat + data sensitif **tidak** menambah memori; sakelar tema gelap→terang (`rgb(247, 247, 251)`), sidebar `display: none`, footer terlihat penuh; label balasan "Kirby · 8,0 detik · 16.50", chip dokumen `0`
  - Catatan: sapaan awal hanya menyebut nama kalau memori panggilan masih ada (memori uji dihapus setelah pengujian)
- **Catatan**: dua kesalahan yang ditemukan & dibetulkan saat pengujian — (1) model kecil memotong JSON pada `maxOutputTokens` 300 sehingga tidak ada memori tersimpan (diperbaiki: 600 token + pemulihan butir JSON + prompt orang pertama); (2) `after()` tidak dieksekusi di Vercel sehingga produksi tidak menyimpan memori sama sekali (dipindah ke `onFinish`, terbukti jalan). Uji lokal sempat menghapus seluruh percakapan (data uji) karena fitur hapus riwayat diuji penuh.
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
