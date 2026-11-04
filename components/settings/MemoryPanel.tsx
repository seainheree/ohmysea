"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Card";
import {
  daftarMemori,
  hapusMemori,
  tambahMemori,
  ubahMemori,
  type Memori,
} from "@/lib/api";

/**
 * Panel Memori AI: daftar fakta yang diingat asisten di semua percakapan
 * (disuntikkan ke prompt sistem — lihat lib/memory.ts).
 */
export function MemoryPanel({ onJumlahBerubah }: { onJumlahBerubah?: (n: number) => void }) {
  const [daftar, setDaftar] = useState<Memori[]>([]);
  const [teks, setTeks] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ubah, setUbah] = useState<{ id: string; teks: string } | null>(null);
  const [mauHapus, setMauHapus] = useState<Memori | null>(null);

  const muat = useCallback(async () => {
    try {
      const data = await daftarMemori();
      setDaftar(data);
      onJumlahBerubah?.(data.filter((m) => m.aktif).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat memori");
    }
  }, [onJumlahBerubah]);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    const isi = teks.trim();
    if (isi.length < 3) return;
    setSibuk(true);
    setError(null);
    setInfo(null);
    try {
      await tambahMemori(isi);
      setTeks("");
      setInfo("Memori ditambahkan. Asisten akan mengingatnya di percakapan berikutnya.");
      await muat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah memori");
    } finally {
      setSibuk(false);
    }
  }

  async function simpanUbah() {
    if (!ubah) return;
    setSibuk(true);
    setError(null);
    try {
      await ubahMemori(ubah.id, { content: ubah.teks.trim() });
      setUbah(null);
      await muat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah memori");
    } finally {
      setSibuk(false);
    }
  }

  async function toggleAktif(m: Memori) {
    try {
      await ubahMemori(m.id, { aktif: !m.aktif });
      await muat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status");
    }
  }

  async function konfirmasiHapus() {
    if (!mauHapus) return;
    setSibuk(true);
    try {
      await hapusMemori(mauHapus.id);
      setMauHapus(null);
      await muat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus memori");
    } finally {
      setSibuk(false);
    }
  }

  const aktif = daftar.filter((m) => m.aktif).length;

  return (
    <section className="flex flex-col gap-sedang rounded-besar border border-border-kuat bg-surface p-sedang">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Memori AI</h2>
          <p className="mt-1 text-xs text-teks-muted">
            Fakta yang diingat asisten di semua percakapan. Berguna untuk hal yang kamu tidak mau
            ulang sebutkan.
          </p>
        </div>
        <span className="rounded-penuh border border-border-kuat px-2 py-0.5 text-[11px] text-teks-muted">
          {aktif} aktif / {daftar.length} total
        </span>
      </header>

      <form onSubmit={simpan} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Label>Memori baru</Label>
          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Contoh: namaku Sasha, panggil aku Sha. Aku suka jawaban singkat tanpa basa-basi."
            className="mt-1 w-full resize-none rounded-sedang border border-border bg-bg-main px-sedang py-2 text-sm outline-none focus:border-aksen"
          />
          <span className="text-[11px] text-teks-muted-2">{teks.length}/500 karakter</span>
        </div>
        <Button type="submit" disabled={sibuk || teks.trim().length < 3} className="sm:mt-6">
          <Icon name="tambah" size={16} />
          Tambah
        </Button>
      </form>

      {info && <p className="text-sm text-online">{info}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <ul className="flex flex-col divide-y divide-border">
        {daftar.map((m) => (
          <li key={m.id} className="flex items-start gap-2 py-3">
            <button
              onClick={() => toggleAktif(m)}
              aria-label={m.aktif ? "Nonaktifkan memori" : "Aktifkan memori"}
              title={m.aktif ? "Aktif — klik untuk menonaktifkan" : "Nonaktif — klik untuk mengaktifkan"}
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-penuh border ${
                m.aktif ? "border-aksen bg-aksen/20 text-aksen-lembut" : "border-border-kuat text-teks-muted-2"
              }`}
            >
              {m.aktif && <Icon name="centang" size={13} />}
            </button>

            {ubah?.id === m.id ? (
              <div className="flex flex-1 flex-col gap-2">
                <textarea
                  value={ubah.teks}
                  onChange={(e) => setUbah({ id: m.id, teks: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full resize-none rounded-sedang border border-border bg-bg-main px-sedang py-2 text-sm outline-none focus:border-aksen"
                />
                <div className="flex gap-2">
                  <Button onClick={simpanUbah} disabled={sibuk}>
                    Simpan
                  </Button>
                  <Button varian="garis" onClick={() => setUbah(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={`flex-1 text-sm ${m.aktif ? "" : "text-teks-muted-2 line-through"}`}>
                  {m.content}
                </p>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setUbah({ id: m.id, teks: m.content })}
                    aria-label="Ubah memori"
                    className="grid h-9 w-9 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-teks"
                  >
                    <Icon name="ubah" size={16} />
                  </button>
                  <button
                    onClick={() => setMauHapus(m)}
                    aria-label="Hapus memori"
                    className="grid h-9 w-9 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-danger"
                  >
                    <Icon name="hapus" size={16} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {daftar.length === 0 && (
          <li className="py-3 text-sm text-teks-muted">
            Belum ada memori. Tambahkan satu di atas — misalnya namamu, gaya jawaban yang kamu suka,
            atau konteks pekerjaanmu.
          </li>
        )}
      </ul>

      <ConfirmDialog
        terbuka={mauHapus !== null}
        judul="Hapus memori ini?"
        deskripsi={mauHapus?.content}
        onKonfirmasi={konfirmasiHapus}
        onBatal={() => setMauHapus(null)}
      />
    </section>
  );
}
