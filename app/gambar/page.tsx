"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { LockScreen } from "@/components/LockScreen";
import { UnduhTransparan } from "@/components/image/UnduhTransparan";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { TRANSISI } from "@/lib/motion";
import {
  DEFAULT_MODEL,
  DEFAULT_RATIO,
  IMAGE_MODELS,
  MAKS_UKURAN_REFERENSI_MB,
  RATIOS,
  STYLES,
  dukungDimensi,
  dukungGambarReferensi,
} from "@/lib/ai/styles";
import { buatGambar, daftarGambar, type Gambar } from "@/lib/api";

export default function HalamanGambar() {
  const [terkunci, setTerkunci] = useState(false);
  const [galeri, setGaleri] = useState<Gambar[]>([]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]!.slug);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [ratio, setRatio] = useState<string>(DEFAULT_RATIO);
  const [referensi, setReferensi] = useState<File | null>(null);
  const [transparan, setTransparan] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function muat() {
    try {
      setGaleri(await daftarGambar());
      setTerkunci(false);
    } catch (err) {
      const teks = err instanceof Error ? err.message : "Gagal memuat galeri";
      if (/401|Belum dibuka/i.test(teks)) setTerkunci(true);
      else setError(teks);
    }
  }

  useEffect(() => {
    void muat();
  }, []);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setError(null);
    setStatus("Menghasilkan gambar... ini bisa sampai 30 detik.");
    try {
      const gambar = await buatGambar({
        prompt,
        style,
        model,
        aspectRatio: ratio,
        transparan,
        reference: referensi,
      });
      setGaleri((g) => [gambar, ...g]);
      setStatus(
        transparan
          ? "Gambar selesai. Klik “Unduh PNG transparan” untuk latar bening."
          : "Gambar selesai.",
      );
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat gambar");
      setStatus(null);
    } finally {
      setSibuk(false);
    }
  }

  if (terkunci) {
    return (
      <LockScreen
        onBuka={() => {
          setTerkunci(false);
          void muat();
        }}
      />
    );
  }

  const bolehReferensi = dukungGambarReferensi(model);

  return (
    <div className="mx-auto flex h-full w-full max-w-[900px] min-h-0 flex-1 flex-col gap-besar overflow-y-auto px-sedang py-besar">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-4xl leading-none">
          oh<span className="text-aksen-terang">my</span>sea · gambar
        </h1>
        <Link href="/" className="text-sm text-teks-muted hover:text-teks">
          ← Kembali ke chat
        </Link>
      </header>

      <form onSubmit={kirim} className="flex flex-col gap-sedang rounded-besar border border-border bg-surface p-sedang">
        <label className="flex flex-col gap-1">
          <Label>Prompt</Label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Contoh: kucing oren duduk di meja kayu, cahaya pagi"
            className="resize-none rounded-sedang border border-border bg-bg-main px-sedang py-2 text-sm outline-none focus:border-aksen"
          />
        </label>

        <div className="grid grid-cols-1 gap-sedang sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <Label>Style</Label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="rounded-sedang border border-border bg-bg-main px-3 py-2 text-sm outline-none focus:border-aksen"
            >
              {STYLES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <Label>Model</Label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                if (!dukungGambarReferensi(e.target.value)) setReferensi(null);
              }}
              className="rounded-sedang border border-border bg-bg-main px-3 py-2 text-sm outline-none focus:border-aksen"
            >
              {IMAGE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <Label>Aspect ratio</Label>
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              disabled={!dukungDimensi(model)}
              className="rounded-sedang border border-border bg-bg-main px-3 py-2 text-sm outline-none focus:border-aksen disabled:opacity-50"
            >
              {Object.entries(RATIOS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} · {v.width}×{v.height}
                </option>
              ))}
            </select>
            {!dukungDimensi(model) && (
              <span className="text-[11px] text-teks-muted-2">
                Model ini selalu menghasilkan 1024×1024 — ratio diabaikan.
              </span>
            )}
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <Label>Gambar referensi (image-to-image, opsional)</Label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={!bolehReferensi}
            onChange={(e) => setReferensi(e.target.files?.[0] ?? null)}
            className="text-sm text-teks-muted file:mr-3 file:rounded-penuh file:border-0 file:bg-border file:px-3 file:py-1.5 file:text-teks"
          />
          <span className="text-[11px] text-teks-muted-2">
            {bolehReferensi
              ? `PNG/JPEG/WEBP, maks ${MAKS_UKURAN_REFERENSI_MB} MB. Dikirim sebagai input_image_0.`
              : "Model ini tidak mendukung gambar referensi."}
          </span>
        </label>

        <label className="flex items-start gap-2 rounded-sedang border border-border bg-bg-main p-sedang">
          <input
            type="checkbox"
            checked={transparan}
            onChange={(e) => setTransparan(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-aksen"
            aria-label="Latar transparan"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Latar transparan</span>
            <span className="text-[11px] text-teks-muted-2">
              Model gambar selalu mengembalikan JPEG tanpa kanal alfa, jadi subjek
              diminta tampil di atas latar putih rata; latarnya dibuang di browser
              saat kamu klik “Unduh PNG transparan”.
            </span>
          </span>
        </label>

        {status && <p className="text-sm text-teks-muted">{status}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={sibuk || prompt.trim().length < 3}>
          {sibuk ? "Membuat gambar..." : "Buat gambar"}
        </Button>
      </form>

      <section className="flex flex-col gap-sedang">
        <Label>Galeri ({galeri.filter((g) => !g.url.startsWith("gagal://")).length})</Label>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: TRANSISI.sedang }}
          className="grid grid-cols-1 gap-sedang sm:grid-cols-2 lg:grid-cols-3"
        >
          {galeri
            .filter((g) => !g.url.startsWith("gagal://"))
            .map((g, i) => (
              <motion.figure
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: TRANSISI.sedang }}
                className="overflow-hidden rounded-besar border border-border bg-surface"
              >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.url}
                    alt={g.prompt}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="flex flex-col gap-1 p-sedang">
                    <span className="line-clamp-2 text-sm">{g.prompt}</span>
                    <span className="text-[11px] text-teks-muted-2">
                      {g.style} · {g.model.split("/").pop()} · {g.aspectRatio} · {g.width}×{g.height}
                      {g.sourceImage ? " · image-to-image" : ""}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <UnduhTransparan id={g.id} prompt={g.prompt} utama={i === 0} />
                      <a
                        href={g.url}
                        download
                        className="w-fit text-xs text-aksen-terang hover:underline"
                      >
                        Unduh asli
                      </a>
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
        </motion.div>
        {galeri.length === 0 && (
          <p className="text-sm text-teks-muted">Belum ada gambar. Coba buat satu di atas.</p>
        )}
      </section>
    </div>
  );
}
