"use client";

import { useCallback, useEffect, useState } from "react";

import { LockScreen } from "@/components/LockScreen";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { ModeSwitch } from "@/components/chat/ModeSwitch";
import { Sidebar } from "@/components/chat/Sidebar";
import {
  ambilPesan,
  daftarPercakapan,
  gantiJudul,
  hapusPercakapan,
  kirimPesan,
  type Mode,
  type Percakapan,
  type Pesan,
} from "@/lib/api";

export default function Home() {
  const [terkunci, setTerkunci] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const [percakapan, setPercakapan] = useState<Percakapan[]>([]);
  const [aktif, setAktif] = useState<Percakapan | null>(null);
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [streaming, setStreaming] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);

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

  useEffect(() => {
    (async () => {
      setMemuat(true);
      await muatDaftar(mode);
      setMemuat(false);
    })();
  }, [mode, muatDaftar]);

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

    const sementara: Pesan = {
      id: `sementara-${Date.now()}`,
      conversationId: aktif?.id ?? "",
      role: "user",
      content: teks,
      createdAt: new Date().toISOString(),
    };
    setPesan((p) => [...p, sementara]);

    try {
      const hasil = await kirimPesan({
        conversationId: aktif?.id,
        mode,
        message: teks,
        onChunk: (bagian) => setStreaming((s) => s + bagian),
      });

      const data = await ambilPesan(hasil.conversationId);
      setPesan(data.pesan);
      setAktif(data.percakapan);
      setStreaming("");
      await muatDaftar(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
      setStreaming("");
    } finally {
      setSibuk(false);
    }
  }

  async function ubahJudul(p: Percakapan) {
    const baru = window.prompt("Judul baru:", p.title);
    if (!baru || baru.trim() === p.title) return;
    try {
      await gantiJudul(p.id, baru.trim());
      await muatDaftar(mode);
      if (aktif?.id === p.id) setAktif({ ...p, title: baru.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah judul");
    }
  }

  async function buang(p: Percakapan) {
    if (!window.confirm(`Hapus percakapan "${p.title}"? Pesannya ikut terhapus.`)) return;
    try {
      await hapusPercakapan(p.id);
      if (aktif?.id === p.id) percakapanBaru();
      await muatDaftar(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  function gantiMode(m: Mode) {
    setMode(m);
    percakapanBaru();
  }

  if (memuat) {
    return (
      <main className="grid min-h-dvh place-items-center text-sm text-teks-muted">Memuat...</main>
    );
  }

  if (terkunci) {
    return (
      <LockScreen
        onBuka={() => {
          setTerkunci(false);
          void muatDaftar(mode);
        }}
      />
    );
  }

  return (
    <div className="flex flex-1">
      <Sidebar
        percakapan={percakapan}
        aktifId={aktif?.id ?? null}
        mode={mode}
        onPilih={bukaPercakapan}
        onBaru={percakapanBaru}
        onGantiJudul={ubahJudul}
        onHapus={buang}
        terbuka={sidebarTerbuka}
        onTutup={() => setSidebarTerbuka(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-bg-topbar px-sedang py-3">
          <button
            onClick={() => setSidebarTerbuka(true)}
            aria-label="Buka menu"
            className="text-muted md:hidden text-teks-muted"
          >
            ☰
          </button>
          <ModeSwitch mode={mode} onChange={gantiMode} />
          <span className="ml-auto hidden items-center gap-2 text-xs text-teks-muted sm:flex">
            <span className="inline-block h-2 w-2 rounded-penuh bg-online" />
            {mode === "curhat" ? "Mode curhat" : "Siap membantu"}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {error && (
            <p className="mx-auto mt-sedang max-w-[760px] rounded-sedang border border-danger/40 bg-danger/10 px-sedang py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <MessageList pesan={pesan} streaming={streaming} mode={mode} />
        </main>

        <Composer onKirim={kirim} sibuk={sibuk} mode={mode} />
      </div>
    </div>
  );
}
