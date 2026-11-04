"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LockScreen } from "@/components/LockScreen";
import { MemoryPanel } from "@/components/settings/MemoryPanel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Label } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  cekSehat,
  hapusSemuaPercakapan,
  type Mode,
  type RingkasanSehat,
} from "@/lib/api";

export default function HalamanPengaturan() {
  const [terkunci, setTerkunci] = useState(false);
  const [sehat, setSehat] = useState<RingkasanSehat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [modeHapus, setModeHapus] = useState<Mode | "semua">("semua");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async () => {
    try {
      setSehat(await cekSehat());
      setTerkunci(false);
    } catch (err) {
      const teks = err instanceof Error ? err.message : "Gagal memuat status";
      setError(teks);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function hapusRiwayat() {
    setSibuk(true);
    setError(null);
    setInfo(null);
    try {
      const jumlah = await hapusSemuaPercakapan(modeHapus === "semua" ? undefined : modeHapus);
      setInfo(`${jumlah} percakapan dihapus (${modeHapus === "semua" ? "semua mode" : `mode ${modeHapus}`}).`);
      setKonfirmasi(false);
    } catch (err) {
      const teks = err instanceof Error ? err.message : "Gagal menghapus riwayat";
      if (/401|Belum dibuka/i.test(teks)) setTerkunci(true);
      else setError(teks);
    } finally {
      setSibuk(false);
    }
  }

  if (terkunci) return <LockScreen onBuka={() => void muat()} />;

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-besar px-sedang py-besar">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="grid h-10 w-10 place-items-center rounded-penuh border border-border-kuat text-teks-muted hover:text-teks"
          aria-label="Kembali ke chat"
        >
          <Icon name="chat" size={18} />
        </Link>
        <div>
          <h1 className="font-display text-3xl leading-none">
            Pengaturan<span className="text-aksen-terang">.</span>
          </h1>
          <p className="mt-1 text-xs text-teks-muted">
            Memori asisten, riwayat percakapan, dan status layanan.
          </p>
        </div>
      </header>

      <MemoryPanel />

      <section className="flex flex-col gap-sedang rounded-besar border border-border-kuat bg-surface p-sedang">
        <header>
          <h2 className="text-base font-semibold">Riwayat percakapan</h2>
          <p className="mt-1 text-xs text-teks-muted">
            Menghapus percakapan juga menghapus pesannya. Gambar di galeri tidak terpengaruh.
          </p>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <Label>Cakupan</Label>
            <select
              value={modeHapus}
              onChange={(e) => setModeHapus(e.target.value as Mode | "semua")}
              className="rounded-sedang border border-border bg-bg-main px-3 py-2 text-sm outline-none focus:border-aksen"
            >
              <option value="semua">Semua mode</option>
              <option value="chat">Hanya mode chat</option>
              <option value="curhat">Hanya mode curhat</option>
            </select>
          </label>
          <Button varian="bahaya" onClick={() => setKonfirmasi(true)}>
            <Icon name="hapus" size={16} />
            Hapus riwayat
          </Button>
        </div>

        {info && <p className="text-sm text-online">{info}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </section>

      <section className="flex flex-col gap-sedang rounded-besar border border-border-kuat bg-surface p-sedang">
        <header>
          <h2 className="text-base font-semibold">Status layanan</h2>
          <p className="mt-1 text-xs text-teks-muted">
            Dari <code className="text-teks-muted-2">GET /api/health</code> — tidak menampilkan nilai
            rahasia apa pun.
          </p>
        </header>

        {sehat ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-teks-muted-2">Environment</dt>
              <dd>{sehat.env.ok ? "lengkap" : `kurang: ${sehat.env.hilang.join(", ")}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-teks-muted-2">Database</dt>
              <dd>{sehat.db.ok ? "tersambung" : `gagal — ${sehat.db.detail}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-teks-muted-2">Model chat</dt>
              <dd>{sehat.model.chat ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-teks-muted-2">Model curhat</dt>
              <dd>{sehat.model.curhat ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-teks-muted-2">Model embedding</dt>
              <dd>{sehat.model.embedding ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-teks-muted-2">Model gambar</dt>
              <dd className="break-all">{sehat.model.image ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-teks-muted">Memuat status...</p>
        )}

        <p className="text-xs text-teks-muted-2">
          Kode akses, kunci API, dan daftar model diubah lewat environment variable (berkas
          <code className="mx-1 text-teks-muted-2">.env</code> saat lokal, Environment Variables di
          Vercel saat produksi). Bukan dari halaman ini, supaya rahasia tidak pernah ada di browser.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-besar border border-border-kuat bg-surface p-sedang">
        <h2 className="text-base font-semibold">Tentang</h2>
        <p className="text-sm text-teks-muted">
          ohmysea v1 — chatbot pribadi dengan memori, curhat, RAG dari dokumenmu sendiri, dan
          generator gambar. Batas pemakaian: 30 permintaan chat/menit dan 10 gambar/menit.
        </p>
        <p className="text-xs text-teks-muted-2">
          Dokumen acuan: <code>docs/PRD.md</code>, <code>docs/TECH-SPEC.md</code>,{" "}
          <code>docs/DESIGN.md</code>.
        </p>
      </section>

      <ConfirmDialog
        terbuka={konfirmasi}
        judul="Hapus riwayat percakapan?"
        deskripsi={
          modeHapus === "semua"
            ? "Semua percakapan di kedua mode akan dihapus beserta pesannya. Tidak bisa dibatalkan."
            : `Semua percakapan mode ${modeHapus} akan dihapus beserta pesannya. Tidak bisa dibatalkan.`
        }
        labelKonfirmasi={sibuk ? "Menghapus..." : "Hapus"}
        onKonfirmasi={hapusRiwayat}
        onBatal={() => setKonfirmasi(false)}
      />
    </div>
  );
}
