# CARA-PAKAI — Kit Vibecoding

Panduan ini mulai dari **nol absolut**: kamu belum punya ide, belum punya repo,
belum punya akun apa pun. Ikuti urutannya. Jangan lompat.

Untuk siapa: orang yang bukan programmer (atau programmer pemula) yang mau bikin
software dengan bantuan agent AI, tapi tidak mau hasilnya berantakan 3 bulan
kemudian.

---

## 0. Pahami dulu cara kerjanya (2 menit)

Vibecoding yang berantakan: langsung minta agent "bikinkan saya aplikasi X".
Hasilnya jalan di awal, lalu kacau — fitur saling tabrak, tidak tahu kenapa
sebuah kode begitu, agent lupa aturan tiap sesi baru.

Kit ini memaksa urutan sebaliknya:

```
IDE (di kepala kamu, masih kabur)
  │
  ▼
PRD        → KENAPA & APA (masalah, tujuan, yang TIDAK dikerjakan)
  │
  ▼
TECH-SPEC  → BAGAIMANA (stack, arsitektur, data, rute)
  │
  ▼
ADR        → keputusan penting + alasan "kenapa bukan yang lain"
  │
  ▼
TASKS      → urutan kerja, tiap task punya command verifikasi
  │
  ▼
KODE       → baru di sini agent menulis kode, satu task sekali
  │
  ▼
PROGRESS-LOG → catatan tiap akhir sesi
```

Lima file itu (`AGENTS.md`, `PRD`, `TECH-SPEC`, `TASKS`, `PROGRESS-LOG`) plus
folder `adr/` adalah **seluruh isi kit**. Kode menyusul belakangan.

Aturan emas kit ini: **setiap kriteria penerimaan harus bisa dijalankan sebagai
command.** "Kelihatan bagus" bukan kriteria. "Perintah X keluar kode 0 dan
menghasilkan Y" itu kriteria. Kalau keluaranmu subjektif (tampilan, suara, rasa),
ubah jadi checklist manual yang konkret.

---

## 1. Yang kamu butuhkan

| Alat | Untuk | Wajib? |
|---|---|---|
| Akun GitHub | Menyimpan repo, tempat agent & kamu bekerja | Ya |
| Agent AI (mis. OpenCode) | Menulis dokumen & kode, ikut aturan `AGENTS.md` | Ya |
| Git | Versi riwayat, atau pakai web GitHub saja | Disarankan |
| Alat sesuai stack | Ditentukan nanti di Tahap 0; dipasang saat kode mulai | Tergantung project |
| Browser | Buat repo di web, baca dokumen | Ya |

<small>Kalau kamu benar-benar menolak terminal, kamu bisa kerjakan hampir semua
langkah lewat web GitHub. Tapi agent biasanya bekerja di folder lokal, jadi
menyalin (`git clone`) ke folder lokal lebih nyaman.</small>

---

## 2. Kamu belum punya ide? Normal. Mulai dari sini.

Jangan tunggu punya "ide besar". Yang kamu butuhkan cuma:

1. **Masalah siapa** yang mau kamu selesaikan? (dirimu sendiri boleh)
2. **Hasil apa** yang bikin masalah itu hilang?

Contoh lemah: "bikin aplikasi keren".
Contoh cukup: "aku susah mencatat utang teman-teman; aku ingin daftar utang yang
bisa dilihat di HP".

Kalau cuma itu pun kamu belum punya, **tetap lanjut ke Langkah 3**. Agent akan
menggali idemu lewat wawancara. Dokumen PRD-nya yang akan membuat idemu jadi
kongkret. Itu justru cara kerja kit ini.

---

## 3. Bikin repo dulu — sebelum menulis apa pun

Kamu **tidak** menulis ide lebih dulu. Kamu siapkan wadah dulu, baru isi.

**Pertanyaan: bikin repo di GitHub dulu, atau kerjakan lokal dulu?**
→ Untuk pemula, **bikin repo GitHub dulu**. Alasannya: `AGENTS.md` harus sudah ada
di root sebelum agent bicara, dan repo GitHub jadi satu sumber kebenaran yang bisa
diakses dari mana-mana.

### 3a. Bikin repo kosong di GitHub

1. Buka `github.com`, login (bikin akun kalau belum punya).
2. Klik **New repository**.
3. Nama: `<nama-project>` (huruf kecil, pakai tanda hubung).
4. Pilih **Public** (kecuali project pribadi/rahasia → Private).
5. Jangan centang "Add a README" — biar kosong.
6. Klik **Create repository**.

### 3b. Taruh kit ini ke dalam repo

Ada dua jalan:

**Jalan A — kamu punya kit di folder lokal (folder ini):**

```bash
git clone https://github.com/<username>/<nama-project>.git
cd <nama-project>
# salin isi folder template/ ke root repo ini
```

**Jalan B — kamu pakai agent dan repo lokal:**

Buka folder repo di agent-mu, lalu bilang:

> "Folder ini kosong. Salin semua isi dari `<lokasi-kit>/template/` ke root folder
> ini, jangan ubah isinya."

Setelah selesai, root repo harus memuat: `AGENTS.md`, `README.md`, `.gitignore`,
`docs/`, dan `PROMPT-PEMBUKA.md`.

### 3c. Commit pertama

```bash
git add -A
git commit -m "Proyek baru: scaffold dokumen dari kit vibecoding"
git push -u origin main
```

Commit pertama ini **tidak** berisi ide atau kode — hanya wadah + aturan. Itu
disengaja.

### 3d. Kalau kamu belum tahu mau pakai alat apa

Tidak perlu tahu sekarang. Jangan pilih sendiri. Saat prompt pembuka dijalankan
(Langkah 4), agent akan menanyakan kendalamu (anggaran, tempat menjalankan,
keahlian, skala) lalu mengajukan 2–3 opsi alat dengan kelebihan/kekurangan, dan
kamu memilih. Stack baru dituang ke dokumen **setelah** kamu memutuskan.

Kalau kamu sudah punya preferensi alat, sebutkan di Langkah 4 — agent langsung
pakai itu tanpa menawar.

---

## 4. Prompt pembuka (master prompt)

Sekarang, dan baru sekarang, kamu mengobrol dengan agent. Buka
`PROMPT-PEMBUKA.md` di repo, **salin seluruh isinya** (di bawah garis pemisah), lalu
tempel ke kotak chat agent.

Prompt itu menyuruh agent: baca `AGENTS.md` → **Tahap 0** (tentukan alat: kalau kamu
belum sebut apa pun, agent menanya kendala lalu menawarkan opsi; kalau sudah sebut,
langsung pakai) → baru isi `docs/PRD.md` → `TECH-SPEC` → `adr/` → `TASKS` →
`AGENTS.md`. Satu tahap sekali, satu pertanyaan per pesan.

Chat itu akan jadi panjang dan bolak-balik. **Itu normal** — kamu sedang
menggodok ide, dan hasilnya dokumen yang jujur, bukan karangan.

> **Penting**: agent dilarang menulis kode di sesi ini. Kalau dia mulai menyalin
> file ke `src/`, katakan: "Stop. Kita belum punya TASKS. Balik ke PRD."

---

## 5. Periksa hasil dokumentasi (jangan langsung percaya agent)

Buka tiap file di `docs/` dan cek manual:

- [ ] **PRD** punya bagian Non-Goals **berisi minimal 3 butir**. Kalau kosong, agent
      akan menambah fitur tanpa batas nanti.
- [ ] Tiap FR punya **kriteria penerimaan berbentuk command**.
- [ ] **TECH-SPEC** menyebut versi alat secara eksplisit (mis. `X 2.3`, bukan cuma
      "pakai X") — dan hanya alat yang kamu putuskan, tanpa tambahan asumsi.
- [ ] Ada minimal 1 **ADR** dengan kolom "kenapa tidak dipilih" terisi.
- [ ] **TASKS** punya minimal 1 milestone; tiap task punya Dependency + Verifikasi.
- [ ] `AGENTS.md` bagian Larangan terisi (dependensi, kode, apa pun yang tak boleh
      disentuh agent tanpa izin).
- [ ] **Kalau projectmu punya tampilan**: `docs/DESIGN.md` terisi (referensi +
      arah gaya + checklist visual). Kalau projectmu tanpa tampilan, hapus file itu.

Kalau ada yang kosong, suruh agent lengkapi **sebelum** lanjut.

---

## 6. Mulai task pertama

Setelah dokumen disetujui:

1. Suruh agent: "Baca `docs/TASKS.md`, pilih satu task yang dependency-nya selesai
   dan statusnya bukan blocked. Sebutkan ID + rencana singkat. **Jangan kerjakan
   dulu, tunggu aku setuju.**"
2. Setuju (atau koreksi) rencananya.
3. Agent kerjakan **hanya** task itu, lalu jalankan command verifikasinya dan
   tunjukkan output asli.
4. Agent update status task + isi `PROGRESS-LOG.md` + commit.

Ulangi untuk task berikutnya. Satu task per sesi. Jangan pernah bilang "kerjakan
semua task".

---

## 7. Loop kerja harian

```
Buka sesi baru
  → agent baca AGENTS.md + TASKS.md
  → pilih 1 task
  → kerjakan
  → build & test (output asli)
  → update TASKS + PROGRESS-LOG
  → commit
  → tutup sesi
```

Selesai sebuah milestone? Baru pindah ke milestone berikutnya. Tidak lompat.

---

## Pertanyaan yang sering muncul

**1. Apakah tiap project butuh template berbeda?**
Tidak. Satu template generik untuk semua. Yang berbeda hanya **isinya** (`<...>`
diisi per project), bukan bentuknya. Untuk project kecil, kamu boleh menghapus
bagian yang tak relevan (mis. ADR kalau memang tak ada keputusan berarti) — tapi
jangan ubah strukturnya sebelum paham gunanya.

**2. Apakah kita langsung import template lalu prompt ide?**
Ya, dengan urutan: **repo dulu → taruh template → baru prompt ide.** Ide tidak
dituang sebelum `AGENTS.md` ada, karena agent butuh aturan itu untuk bekerja benar.
Prompt ide = Langkah 4 di atas.

**3. Apakah ada master prompt?**
Ada — `PROMPT-PEMBUKA.md`. Itu prompt pembuka yang menyuruh agent mewawancarai kamu
dan mengisi dokumen bertahap. Salin apa adanya di awal project. Setelah dokumentasi
jadi, prompt kerja sehari-hari cukup mengacu ke `AGENTS.md` (kit ini sudah mengatur
di bagian "Cara kerja").

**4. Boleh langsung minta agent bikin kode?**
Boleh, **setelah** PRD + TASKS ada dan task pertama punya kriteria penerimaan
berbentuk command. Sebelum itu, kode cuma menebak.

**5. Agent lupa aturan tiap sesi baru, kenapa?**
Sesi baru = konteks baru. Karena itu aturannya ada di `AGENTS.md`, bukan cuma di
percakapan. Awali sesi dengan "Baca `AGENTS.md` dulu."

**6. Kalau agent salah dan merusak sesuatu?**
`git` menyimpan semua versi. `git log`, lalu kembalikan. Salah isi terdeteksi saat
build, bukan setelah tayang.

**7. Aku belum tahu mau pakai alat/teknologi apa. Boleh?**
Boleh, itu normal. Sebutkan saja di Langkah 4; agent akan menanya kendalamu lalu
mengajukan 2–3 opsi. Template ini sengaja tidak memuat teknologi apa pun — supaya
keputusan dibuat berdasarkan kebutuhanmu, bukan kebiasaan agent.

---

## Checklist "siap mulai ngoding"

- [ ] Repo GitHub ada, isi template sudah ter-push
- [ ] Chat prompt pembuka sudah dijalankan
- [ ] `docs/PRD.md` lengkap + Non-Goals berisi
- [ ] `docs/TECH-SPEC.md` lengkap + versi alat eksplisit
- [ ] Stack sudah kamu **putuskan** (dari pilihan agent atau pilihanmu sendiri)
- [ ] Minimal 1 ADR
- [ ] `docs/TASKS.md` punya task pertama dengan command verifikasi
- [ ] `AGENTS.md` terisi (stack, command, larangan)
- [ ] Baru sekarang: minta agent mulai T-001

---

## 7b. Bersihkan file scaffold (sekali, sebelum task pertama)

Setelah dokumen disetujui, dua file ini hanya contoh dan boleh dihapus biar tidak
membingungkan sesi berikutnya:

- `PROMPT-PEMBUKA.md` — sudah dipakai; prompt harian cukup mengacu ke `AGENTS.md`.
- `docs/adr/ADR-000-contoh-keputusan.md` — hapus setelah punya ADR sungguhan
  (mis. `ADR-001-*.md`).
- `docs/DESIGN.md` — **hanya** kalau projectmu tak punya tampilan (alat terminal,
  pustaka, layanan tanpa UI). Kalau ada tampilan, isi dan pertahankan.

Semua file lain **jangan dihapus** — itu dokumen hidup project.
