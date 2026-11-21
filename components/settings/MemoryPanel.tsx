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
 * Panel Memori AI dalam dua tabel terpisah:
 * - Memori paten: ditulis pengguna, tidak pernah disentuh proses otomatis.
 * - Memori simpan otomatis: hasil ekstraksi Kirby dari percakapan.
 * Keduanya disuntikkan ke prompt sistem (lihat lib/memory.ts).
 */
export function MemoryPanel({ onJumlahBerubah }: { onJumlahBerubah?: (n: number) => void }) {
  const [daftar, setDaftar] = useState<Memori[]>([]);
  const [teks, setTeks] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ubah, setUbah] = useState<{ id: string; teks: string; paten: boolean } | null>(null);
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
      setInfo("Memori paten ditambahkan. Asisten akan selalu mengingatnya.");
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
      await ubahMemori(ubah.id, { content: ubah.teks.trim(), paten: ubah.paten });
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
      await ubahMemori(m.id, { aktif: !m.aktif, paten: Boolean(m.paten) });
      await muat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status");
    }
  }

  async function konfirmasiHapus() {
    if (!mauHapus) return;
    setSibuk(true);
    try {
      await hapusMemori(mauHapus.id, Boolean(mauHapus.paten));
      setMauHapus(null);
      await muat();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus memori");
    } finally {
      setSibuk(false);
    }
  }

  const paten = daftar.filter((m) => m.paten);
  const otomatis = daftar.filter((m) => !m.paten);
  const aktif = daftar.filter((m) => m.aktif).length;

  function renderDaftar(items: Memori[], kosong: string) {
    return (
      <ul className="flex flex-col divide-y divide-border">
        {items.map((m) => (
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
                  onChange={(e) => setUbah({ id: m.id, teks: e.target.value, paten: ubah.paten })}
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
                    onClick={() => setUbah({ id: m.id, teks: m.content, paten: Boolean(m.paten) })}
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
        {items.length === 0 && <li className="py-3 text-sm text-teks-muted">{kosong}</li>}
      </ul>
    );
  }

  return (
    <section className="flex flex-col gap-besar rounded-besar border border-border-kuat bg-surface p-sedang">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Memori AI</h2>
          <p className="mt-1 text-xs text-teks-muted">
            Fakta yang diingat asisten di semua percakapan. Dua tabel terpisah: paten (kamu tulis)
            dan simpan otomatis (Kirby catat).
          </p>
        </div>
        <span className="rounded-penuh border border-border-kuat px-2 py-0.5 text-[11px] text-teks-muted">
          {aktif} aktif / {daftar.length} total
        </span>
      </header>

      <div className="flex flex-col gap-sedang">
        <div>
          <h3 className="text-sm font-semibold">Memori paten</h3>
          <p className="mt-0.5 text-xs text-teks-muted">
            Ditulis sendiri olehmu. Tidak pernah diubah atau dihapus oleh proses otomatis.
          </p>
        </div>

        <form onSubmit={simpan} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Label>Memori paten baru</Label>
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

        {renderDaftar(
          paten,
          "Belum ada memori paten. Tambahkan satu di atas — misalnya namamu atau panggilan yang kamu suka.",
        )}
      </div>

      <div className="flex flex-col gap-sedang">
        <div>
          <h3 className="text-sm font-semibold">Memori simpan otomatis</h3>
          <p className="mt-0.5 text-xs text-teks-muted">
            Kirby catat sendiri dari percakapan. Bisa kamu matikan atau hapus kapan saja.
          </p>
        </div>
        {renderDaftar(
          otomatis,
          "Belum ada memori otomatis. Kirby akan menyimpan fakta penting saat kamu bercerita.",
        )}
      </div>

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