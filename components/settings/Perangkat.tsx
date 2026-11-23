"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { cabutPerangkat, cabutSemuaPerangkat, daftarPerangkat, type Perangkat } from "@/lib/api";
import { waktuRelatif } from "@/lib/waktu";

/**
 * Perangkat yang boleh masuk. Kode akses cuma gerbang; yang menentukan berapa
 * device boleh memakai sekaligus adalah daftar ini (maks 4).
 */
export function PerangkatAktif() {
  const [daftar, setDaftar] = useState<Perangkat[]>([]);
  const [maks, setMaks] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  const muat = useCallback(async () => {
    try {
      const data = await daftarPerangkat();
      setDaftar(data.perangkat);
      setMaks(data.maks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat perangkat");
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  /** Perangkat sendiri dicabut → cookie sudah tidak sah, muat ulang halaman. */
  function selesaiDicabut(sekarang: boolean) {
    if (sekarang) {
      window.location.reload();
      return;
    }
    setInfo("Perangkat dicabut.");
    void muat();
  }

  async function cabut(p: Perangkat) {
    setSibuk(true);
    setError(null);
    setInfo(null);
    try {
      const hasil = await cabutPerangkat(p.id);
      selesaiDicabut(hasil.sekarang);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencabut perangkat");
    } finally {
      setSibuk(false);
    }
  }

  async function cabutSemua() {
    setSibuk(true);
    setError(null);
    try {
      await cabutSemuaPerangkat();
      setKonfirmasi(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencabut perangkat");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <section className="flex flex-col gap-sedang rounded-besar border border-border-kuat bg-surface p-sedang">
      <header className="flex items-start gap-3">
        <div>
          <h2 className="text-base font-semibold">Perangkat aktif</h2>
          <p className="mt-1 text-xs text-teks-muted">
            Maksimal {maks} perangkat. Login ke-{(maks + 1).toString()} ditolak sampai salah satu
            dicabut. Masa berlaku 24 jam.
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-penuh border border-border-kuat px-2 py-0.5 text-xs tabular-nums text-teks-muted">
          {daftar.length}/{maks}
        </span>
      </header>

      {daftar.length === 0 ? (
        <p className="text-sm text-teks-muted">Memuat perangkat...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {daftar.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-sedang border border-border px-3 py-2"
            >
              <Icon name="chat" size={16} />
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {p.device}
                  {p.sekarang && <span className="ml-2 text-xs text-aksen-terang">perangkat ini</span>}
                </p>
                <p className="text-xs text-teks-muted-2">Masuk {waktuRelatif(p.createdAt)}</p>
              </div>
              <button
                onClick={() => void cabut(p)}
                disabled={sibuk}
                className="ml-auto shrink-0 rounded-penuh border border-border-kuat px-3 py-1 text-xs text-danger transition-colors hover:border-danger disabled:opacity-50"
              >
                {p.sekarang ? "Keluar" : "Cabut"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {info && <p className="text-sm text-online">{info}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <button
          onClick={() => setKonfirmasi(true)}
          disabled={sibuk || daftar.length === 0}
          className="inline-flex items-center gap-2 rounded-penuh border border-border-kuat px-3 py-2 text-sm text-teks-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <Icon name="hapus" size={15} />
          Cabut semua perangkat
        </button>
      </div>

      <ConfirmDialog
        terbuka={konfirmasi}
        judul="Cabut semua perangkat?"
        deskripsi="Semua perangkat, termasuk yang ini, harus memasukkan kode akses lagi. Cocok kalau kamu merasa kodenya bocor."
        labelKonfirmasi={sibuk ? "Mencabut..." : "Cabut semua"}
        onKonfirmasi={cabutSemua}
        onBatal={() => setKonfirmasi(false)}
      />
    </section>
  );
}
