"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LockScreen } from "@/components/LockScreen";
import { Composer } from "@/components/chat/Composer";
import { MessageList, type PesanTampil } from "@/components/chat/MessageList";
import { ModeSwitch } from "@/components/chat/ModeSwitch";
import { Sidebar } from "@/components/chat/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ambilPesan,
  daftarMemori,
  daftarPercakapan,
  gantiJudul,
  hapusPercakapan,
  hapusSemuaPercakapan,
  kirimPesan,
  type Mode,
  type Percakapan,
  type Pesan,
} from "@/lib/api";
import { tebakPanggilanPengguna } from "@/lib/panggilan";

export default function Home() {
  const [terkunci, setTerkunci] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const [percakapan, setPercakapan] = useState<Percakapan[]>([]);
  const [aktif, setAktif] = useState<Percakapan | null>(null);
  const [pesan, setPesan] = useState<PesanTampil[]>([]);
  const [streaming, setStreaming] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [jumlahMemori, setJumlahMemori] = useState(0);
  const [mauHapusIni, setMauHapusIni] = useState(false);
  const [sidebarRingkas, setSidebarRingkas] = useState(false);
  const [autoMemori, setAutoMemori] = useState(true);
  const [catatanMemori, setCatatanMemori] = useState<string | null>(null);
  const [panggilan, setPanggilan] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSidebarRingkas(localStorage.getItem("ohmysea-sidebar") === "ringkas");
      setAutoMemori(localStorage.getItem("ohmysea-memori-otomatis") !== "mati");
    } catch {
      // localStorage bisa diblokir; abaikan
    }
    function pantau(e: StorageEvent) {
      if (e.key === "ohmysea-memori-otomatis") setAutoMemori(e.newValue !== "mati");
    }
    window.addEventListener("storage", pantau);
    return () => window.removeEventListener("storage", pantau);
  }, []);

  function gantiRingkas() {
    setSidebarRingkas((r) => {
      const baru = !r;
      try {
        localStorage.setItem("ohmysea-sidebar", baru ? "ringkas" : "terbuka");
      } catch {
        // abaikan
      }
      return baru;
    });
  }

  const muatDaftar = useCallback(async (m: Mode) => {
    try {
      const daftar = await daftarPercakapan(m);
      setPercakapan(daftar);
      setTerkunci(false);
      return daftar;
    } catch (err) {
      const teks = err instanceof Error ? err.message : "Gagal memuat";
      if (/401|Belum dibuka/i.test(teks)) setTerkunci(true);
      else setError(teks);
      return [];
    }
  }, []);

  const muatMemori = useCallback(async () => {
    try {
      const daftar = await daftarMemori();
      setJumlahMemori(daftar.filter((m) => m.aktif).length);
      setPanggilan(tebakPanggilanPengguna(daftar));
    } catch {
      // jumlah memori hanya lencana; kegagalan di sini tidak boleh mengganggu chat
    }
  }, []);

  useEffect(() => {
    (async () => {
      setMemuat(true);
      await muatDaftar(mode);
      await muatMemori();
      setMemuat(false);
    })();
  }, [mode, muatDaftar, muatMemori]);

  async function bukaPercakapan(p: Percakapan) {
    setAktif(p);
    setError(null);
    setSidebarTerbuka(false);
    try {
      const data = await ambilPesan(p.id);
      setPesan(data.pesan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesan");
    }
  }

  function percakapanBaru() {
    setAktif(null);
    setPesan([]);
    setStreaming("");
    setError(null);
    setSidebarTerbuka(false);
  }

  async function kirim(teks: string) {
    setSibuk(true);
    setError(null);
    setStreaming("");
    setCatatanMemori(null);

    const sementara: PesanTampil = {
      id: `sementara-${Date.now()}`,
      conversationId: aktif?.id ?? "",
      role: "user",
      content: teks,
      createdAt: new Date().toISOString(),
    };
    setPesan((p) => [...p, sementara]);

    try {
      const sebelum = jumlahMemori;
      const hasil = await kirimPesan({
        conversationId: aktif?.id,
        mode,
        message: teks,
        autoMemori,
        onChunk: (bagian) => setStreaming((s) => s + bagian),
      });

      const data = await ambilPesan(hasil.conversationId);
      const daftar: PesanTampil[] = data.pesan.map((m, i) =>
        m.role === "assistant" && i === data.pesan.length - 1
          ? { ...m, durasiMs: hasil.durasiMs }
          : m,
      );
      setPesan(daftar);
      setAktif(data.percakapan);
      setStreaming("");
      await muatDaftar(mode);

      // Memori otomatis disimpan setelah balasan selesai (server) — beri jeda
      // sebentar lalu bandingkan jumlahnya supaya pengguna tahu apa yang diingat.
      if (autoMemori) {
        await new Promise((r) => setTimeout(r, 2500));
        const baru = await daftarMemori();
        const aktifBaru = baru.filter((m) => m.aktif).length;
        setJumlahMemori(aktifBaru);
        const selisih = aktifBaru - sebelum;
        if (selisih > 0) {
          setCatatanMemori(
            `Kirby menyimpan ${selisih} memori baru${aktifBaru > 0 ? " — lihat di Pengaturan" : ""}.`,
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
      setStreaming("");
    } finally {
      setSibuk(false);
    }
  }

  async function simpanJudul(p: Percakapan, judul: string) {
    try {
      await gantiJudul(p.id, judul);
      await muatDaftar(mode);
      if (aktif?.id === p.id) setAktif({ ...p, title: judul });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah judul");
    }
  }

  async function buang(p: Percakapan) {
    try {
      await hapusPercakapan(p.id);
      if (aktif?.id === p.id) percakapanBaru();
      await muatDaftar(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  async function buangSemua(m?: Mode) {
    try {
      const jumlah = await hapusSemuaPercakapan(m);
      percakapanBaru();
      await muatDaftar(mode);
      setError(null);
      if (jumlah === 0) setError("Tidak ada percakapan yang bisa dihapus di mode ini.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus riwayat");
    }
  }

  function gantiMode(m: Mode) {
    setMode(m);
    percakapanBaru();
  }

  if (memuat) {
    return (
      <main className="grid min-h-[60dvh] place-items-center text-sm text-teks-muted">Memuat...</main>
    );
  }

  if (terkunci) {
    return (
      <LockScreen
        onBuka={() => {
          setTerkunci(false);
          void muatDaftar(mode);
          void muatMemori();
        }}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <Sidebar
        percakapan={percakapan}
        aktifId={aktif?.id ?? null}
        mode={mode}
        jumlahMemori={jumlahMemori}
        ringkas={sidebarRingkas}
        onPilih={bukaPercakapan}
        onBaru={percakapanBaru}
        onGantiJudul={simpanJudul}
        onHapus={buang}
        onHapusSemua={buangSemua}
        terbuka={sidebarTerbuka}
        onTutup={() => setSidebarTerbuka(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-10 flex shrink-0 items-center gap-1.5 border-b border-border bg-bg-topbar/95 px-sedang py-2 backdrop-blur sm:gap-2">
          <button
            onClick={() => setSidebarTerbuka(true)}
            aria-label="Buka menu"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-teks md:hidden"
          >
            <Icon name="menu" />
          </button>

          <button
            onClick={gantiRingkas}
            aria-label={sidebarRingkas ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            title={sidebarRingkas ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            className="hidden h-11 w-11 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-teks md:grid"
          >
            <Icon name="panel" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {aktif ? aktif.title : mode === "curhat" ? "Curhat baru" : "Chat baru"}
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-teks-muted-2">
              <span className="inline-block h-1.5 w-1.5 rounded-penuh bg-online" />
              {sibuk
                ? "Kirby sedang menjawab..."
                : mode === "curhat"
                  ? "Kirby siap mendengarkan"
                  : "Kirby siap membantu"}
            </p>
          </div>

          <div className="hidden sm:block">
            <ModeSwitch mode={mode} onChange={gantiMode} />
          </div>

          <ThemeToggle />

          {aktif && (
            <button
              onClick={() => setMauHapusIni(true)}
              aria-label="Hapus percakapan ini"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-danger"
            >
              <Icon name="hapus" />
            </button>
          )}

          <Link
            href="/pengaturan"
            aria-label="Pengaturan"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-penuh text-teks-muted hover:bg-border hover:text-teks"
          >
            <Icon name="pengaturan" />
          </Link>
        </header>

        <div className="shrink-0 border-b border-border px-sedang py-2 sm:hidden">
          <ModeSwitch mode={mode} onChange={gantiMode} />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {error && (
            <p className="mx-auto mt-sedang max-w-[760px] rounded-sedang border border-danger/40 bg-danger/10 px-sedang py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <MessageList
            pesan={pesan}
            streaming={streaming}
            mode={mode}
            nama={panggilan}
            menunggu={sibuk && streaming.length === 0}
          />
        </main>

        {catatanMemori && (
          <p className="shrink-0 border-t border-border bg-surface px-sedang py-2 text-center text-[11px] text-teks-muted">
            {catatanMemori}
          </p>
        )}

        <Composer onKirim={kirim} sibuk={sibuk} mode={mode} />
      </div>

      <ConfirmDialog
        terbuka={mauHapusIni}
        judul="Hapus percakapan ini?"
        deskripsi={
          aktif ? `"${aktif.title}" beserta seluruh pesannya akan dihapus.` : undefined
        }
        onKonfirmasi={() => {
          if (aktif) void buang(aktif);
          setMauHapusIni(false);
        }}
        onBatal={() => setMauHapusIni(false)}
      />
    </div>
  );
}
