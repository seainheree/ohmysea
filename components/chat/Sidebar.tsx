"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Card";
import type { Mode, Percakapan } from "@/lib/api";

type Props = {
  percakapan: Percakapan[];
  aktifId: string | null;
  mode: Mode;
  jumlahMemori: number;
  onPilih: (p: Percakapan) => void;
  onBaru: () => void;
  onGantiJudul: (p: Percakapan, judul: string) => void;
  onHapus: (p: Percakapan) => void;
  onHapusSemua: (mode?: Mode) => void;
  terbuka: boolean;
  onTutup: () => void;
};

export function Sidebar({
  percakapan,
  aktifId,
  mode,
  jumlahMemori,
  onPilih,
  onBaru,
  onGantiJudul,
  onHapus,
  onHapusSemua,
  terbuka,
  onTutup,
}: Props) {
  // Di mobile sidebar adalah drawer: saat tertutup isinya tidak boleh difokus Tab.
  const [layarLebar, setLayarLebar] = useState(true);
  const [cari, setCari] = useState("");
  const [ubah, setUbah] = useState<{ id: string; teks: string } | null>(null);
  const [mauHapus, setMauHapus] = useState<Percakapan | null>(null);
  const [mauHapusSemua, setMauHapusSemua] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const terapkan = () => setLayarLebar(mq.matches);
    terapkan();
    mq.addEventListener("change", terapkan);
    return () => mq.removeEventListener("change", terapkan);
  }, []);

  const tersembunyi = !terbuka && !layarLebar;

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return percakapan;
    return percakapan.filter((p) => p.title.toLowerCase().includes(q));
  }, [percakapan, cari]);

  function simpanJudul() {
    if (!ubah) return;
    const bersih = ubah.teks.trim();
    const asal = percakapan.find((p) => p.id === ubah.id);
    if (bersih && asal && bersih !== asal.title) onGantiJudul(asal, bersih);
    setUbah(null);
  }

  return (
    <>
      {terbuka && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={onTutup}
          aria-hidden="true"
        />
      )}

      <aside
        aria-hidden={tersembunyi}
        inert={tersembunyi}
        className={`fixed inset-y-0 left-0 z-30 flex w-[86vw] max-w-[310px] shrink-0 flex-col border-r border-border bg-bg-sidebar transition-transform duration-200 md:static md:w-[310px] md:max-w-none md:translate-x-0 ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-sedang py-3">
          {/* Logo merek — sumber public/image/favico.png */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/logo-256.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-[12px]"
          />
          <span className="font-display text-2xl leading-none">
            oh<span className="text-aksen-terang">my</span>sea
          </span>
          <button
            onClick={onTutup}
            aria-label="Tutup menu"
            className="ml-auto grid h-10 w-10 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-teks md:hidden"
          >
            <Icon name="tutup" />
          </button>
        </div>

        <div className="px-sedang pt-sedang">
          <button
            onClick={onBaru}
            className="flex w-full items-center justify-center gap-2 rounded-penuh bg-gradient-to-r from-aksen to-aksen-terang px-sedang py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgb(236_72_153_/_0.3)] transition-opacity hover:opacity-90"
          >
            <Icon name="tambah" size={16} />
            Percakapan baru
          </button>
        </div>

        <nav className="mt-sedang flex flex-col gap-1 px-2" aria-label="Menu utama">
          <NavItem href="/" ikon="chat" label="Chat" aktif />
          <NavItem href="/gambar" ikon="gambar" label="Gambar" />
          <NavItem
            href="/pengaturan"
            ikon="pengaturan"
            label="Pengaturan"
            lencana={jumlahMemori > 0 ? `${jumlahMemori} memori` : undefined}
          />
        </nav>

        <div className="mt-sedang flex items-center justify-between px-sedang">
          <Label>Riwayat {mode === "curhat" ? "· curhat" : ""}</Label>
          {percakapan.length > 0 && (
            <button
              onClick={() => setMauHapusSemua(true)}
              className="text-[11px] text-teks-muted-2 hover:text-danger"
            >
              hapus semua
            </button>
          )}
        </div>

        <div className="px-sedang pt-2">
          <div className="flex items-center gap-2 rounded-penuh border border-border bg-bg-main px-3 py-2">
            <Icon name="cari" size={15} className="text-teks-muted-2" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari percakapan..."
              aria-label="Cari percakapan"
              className="w-full bg-transparent text-sm outline-none placeholder:text-teks-muted-2"
            />
            {cari && (
              <button onClick={() => setCari("")} aria-label="Bersihkan pencarian">
                <Icon name="tutup" size={14} className="text-teks-muted-2" />
              </button>
            )}
          </div>
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto px-2 pb-sedang" aria-label="Riwayat percakapan">
          <ul className="flex flex-col gap-1">
            {tersaring.map((p) => (
              <li key={p.id} className="group">
                {ubah?.id === p.id ? (
                  <div className="flex flex-col gap-2 rounded-sedang border border-aksen/60 p-2">
                    <input
                      value={ubah.teks}
                      onChange={(e) => setUbah({ id: p.id, teks: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") simpanJudul();
                        if (e.key === "Escape") setUbah(null);
                      }}
                      maxLength={80}
                      autoFocus
                      aria-label="Judul baru"
                      className="w-full rounded-sedang border border-border bg-bg-main px-2 py-1.5 text-sm outline-none focus:border-aksen"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={simpanJudul}
                        className="rounded-penuh bg-aksen px-3 py-1 text-xs font-medium text-white"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setUbah(null)}
                        className="rounded-penuh border border-border-kuat px-3 py-1 text-xs text-teks-muted"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-1 rounded-sedang px-1.5 py-1 ${
                      p.id === aktifId ? "bg-border text-teks" : "text-teks-muted hover:bg-surface"
                    }`}
                  >
                    <button
                      onClick={() => onPilih(p)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-2 text-left text-sm"
                      title={p.title}
                    >
                      <Icon name={p.mode === "curhat" ? "curhat" : "chat"} size={15} className="shrink-0 opacity-70" />
                      <span className="truncate">{p.title}</span>
                    </button>
                    <button
                      onClick={() => setUbah({ id: p.id, teks: p.title })}
                      aria-label={`Ganti judul ${p.title}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-bg-main hover:text-teks"
                    >
                      <Icon name="ubah" size={15} />
                    </button>
                    <button
                      onClick={() => setMauHapus(p)}
                      aria-label={`Hapus ${p.title}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-bg-main hover:text-danger"
                    >
                      <Icon name="hapus" size={15} />
                    </button>
                  </div>
                )}
              </li>
            ))}
            {tersaring.length === 0 && (
              <li className="px-2 py-2 text-xs text-teks-muted-2">
                {cari ? "Tidak ada judul yang cocok." : "Belum ada percakapan di mode ini."}
              </li>
            )}
          </ul>
        </nav>

        <div className="border-t border-border px-sedang py-3 text-xs text-teks-muted-2">
          {mode === "curhat" ? "Mode curhat aktif" : "Mode chat aktif"}
        </div>
      </aside>

      <ConfirmDialog
        terbuka={mauHapus !== null}
        judul="Hapus percakapan ini?"
        deskripsi={mauHapus ? `"${mauHapus.title}" beserta seluruh pesannya akan dihapus.` : undefined}
        onKonfirmasi={() => {
          if (mauHapus) onHapus(mauHapus);
          setMauHapus(null);
        }}
        onBatal={() => setMauHapus(null)}
      />

      <ConfirmDialog
        terbuka={mauHapusSemua}
        judul="Hapus seluruh riwayat?"
        deskripsi={`Semua percakapan mode ${mode} akan dihapus beserta pesannya. Tidak bisa dibatalkan.`}
        onKonfirmasi={() => {
          onHapusSemua(mode);
          setMauHapusSemua(false);
        }}
        onBatal={() => setMauHapusSemua(false)}
      />
    </>
  );
}

function NavItem({
  href,
  ikon,
  label,
  aktif = false,
  lencana,
}: {
  href: string;
  ikon: "chat" | "gambar" | "pengaturan";
  label: string;
  aktif?: boolean;
  lencana?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-sedang px-3 py-2.5 text-sm ${
        aktif ? "bg-surface text-teks" : "text-teks-muted hover:bg-surface hover:text-teks"
      }`}
    >
      <Icon name={ikon} size={17} />
      <span>{label}</span>
      {lencana && (
        <span className="ml-auto rounded-penuh border border-border-kuat px-2 py-0.5 text-[10px] text-teks-muted-2">
          {lencana}
        </span>
      )}
    </Link>
  );
}
