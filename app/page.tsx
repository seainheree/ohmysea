"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { LockScreen } from "@/components/LockScreen";
import { Composer } from "@/components/chat/Composer";
import { MessageList, type PesanTampil } from "@/components/chat/MessageList";
import { ModeSwitch } from "@/components/chat/ModeSwitch";
import { Sidebar } from "@/components/chat/Sidebar";
import { useLenis } from "@/components/chat/useLenis";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TRANSISI } from "@/lib/motion";
import {
  ambilPesan,
  ambilSaran,
  buatPercakapan,
  daftarMemori,
  daftarPercakapan,
  gantiJudul,
  hapusPercakapan,
  hapusSemuaPercakapan,
  kirimPesan,
  unggahLampiran,
  unggahLampiranGambar,
  type BerkasSesi,
  type Mode,
  type Percakapan,
  type Pesan,
} from "@/lib/api";
import { extractText, jenisDari, kecilkanGambar } from "@/lib/extract";
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
  const [lampiran, setLampiran] = useState<{
    nama: string;
    status: string;
    galat?: boolean;
    documentId?: string;
    /** Object URL gambar yang sedang dilampirkan (pratinjau, hanya di klien). */
    pratinjau?: string;
  } | null>(null);
  const [berkasSesi, setBerkasSesi] = useState<BerkasSesi[]>([]);
  /** documentId → object URL gambar, supaya berkas yang diunggah tampil di chat. */
  const [pratinjau, setPratinjau] = useState<Record<string, string>>({});
  const [sibukLampiran, setSibukLampiran] = useState(false);
  const [saran, setSaran] = useState<string[]>([]);
  const [saranAktif, setSaranAktif] = useState(true);
  const [panggilan, setPanggilan] = useState<string | null>(null);
  const [wadahGulir, setWadahGulir] = useState<HTMLElement | null>(null);
  const [isiGulir, setIsiGulir] = useState<HTMLDivElement | null>(null);
  // id percakapan aktif disimpan di ref juga: `aktif` (state) bisa belum ter-render
  // saat pesan dikirim tepat setelah lampiran membuat percakapan baru.
  const aktifIdRef = useRef<string | null>(null);

  useLenis(wadahGulir, isiGulir);

  useEffect(() => {
    try {
      setSidebarRingkas(localStorage.getItem("ohmysea-sidebar") === "ringkas");
      setAutoMemori(localStorage.getItem("ohmysea-memori-otomatis") !== "mati");
      setSaranAktif(localStorage.getItem("ohmysea-saran") !== "mati");
    } catch {
      // localStorage bisa diblokir; abaikan
    }
    function pantau(e: StorageEvent) {
      if (e.key === "ohmysea-memori-otomatis") setAutoMemori(e.newValue !== "mati");
      if (e.key === "ohmysea-saran") setSaranAktif(e.newValue !== "mati");
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

  function gantiSaran() {
    setSaranAktif((s) => {
      const baru = !s;
      try {
        localStorage.setItem("ohmysea-saran", baru ? "nyala" : "mati");
      } catch {
        // abaikan
      }
      if (!baru) setSaran([]);
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
    aktifIdRef.current = p.id;
    setAktif(p);
    setError(null);
    setSaran([]);
    setSidebarTerbuka(false);
    try {
      const data = await ambilPesan(p.id);
      setPesan(data.pesan);
      setBerkasSesi(data.berkas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesan");
    }
  }

  function percakapanBaru() {
    aktifIdRef.current = null;
    setAktif(null);
    setPesan([]);
    setBerkasSesi([]);
    setStreaming("");
    setError(null);
    setSaran([]);
    setSidebarTerbuka(false);
  }

  async function pastikanPercakapan(): Promise<string> {
    if (aktifIdRef.current) return aktifIdRef.current;
    const baru = await buatPercakapan({ mode });
    aktifIdRef.current = baru.id;
    setAktif(baru);
    await muatDaftar(mode);
    return baru.id;
  }

  /** Catat berkas yang tersimpan di sesi ini (ganti entri dengan judul sama). */
  function catatBerkas(id: string, title: string) {
    setBerkasSesi((daftar) => [...daftar.filter((b) => b.id !== id && b.title !== title), { id, title }]);
  }

  async function lampirkan(berkas: File) {
    setSibukLampiran(true);
    const jenis = jenisDari(berkas);
    // Object URL dibuat sekali dari berkas asli: dipakai komposer + bubble chat.
    const urlPratinjau = jenis === "gambar" ? URL.createObjectURL(berkas) : undefined;
    setLampiran({ nama: berkas.name, status: "Membaca…", pratinjau: urlPratinjau });
    try {
      if (jenis === "gambar") {
        // Gambar: OCR di browser (untuk tulisan) + deskripsi model vision di server.
        let ocrText = "";
        try {
          const hasilOcr = await extractText(berkas, (pesan) =>
            setLampiran({ nama: berkas.name, status: pesan, pratinjau: urlPratinjau }),
          );
          ocrText = hasilOcr.teks;
        } catch {
          // OCR bukan syarat: foto tanpa tulisan tetap bisa dijelaskan model vision.
        }

        setLampiran({ nama: berkas.name, status: "Menanyakan isi gambar…", pratinjau: urlPratinjau });
        const { blob } = await kecilkanGambar(berkas);
        const gambar = await unggahLampiranGambar({
          conversationId: await pastikanPercakapan(),
          filename: berkas.name,
          ocrText,
          image: blob,
        });

        setLampiran({
          nama: berkas.name,
          status: `${gambar.pesan} · ${gambar.model}`,
          documentId: gambar.documentId,
          pratinjau: urlPratinjau,
        });
        catatBerkas(gambar.documentId, berkas.name);
        if (urlPratinjau) setPratinjau((p) => ({ ...p, [gambar.documentId]: urlPratinjau }));
        return;
      }

      const hasil = await extractText(berkas, (pesan) =>
        setLampiran({ nama: berkas.name, status: pesan }),
      );

      const simpan = await unggahLampiran({
        conversationId: await pastikanPercakapan(),
        filename: berkas.name,
        mime: berkas.type,
        size: berkas.size,
        text: hasil.teks,
      });

      const catatan = [
        simpan.pesan,
        hasil.halaman ? `${hasil.halaman} halaman` : null,
        hasil.ocr ? "sebagian lewat OCR" : null,
        hasil.dipotong ? "dipotong di 500 ribu karakter" : null,
      ]
        .filter(Boolean)
        .join(" · ");

      setLampiran({ nama: berkas.name, status: catatan, documentId: simpan.documentId });
      catatBerkas(simpan.documentId, berkas.name);
    } catch (err) {
      if (urlPratinjau) URL.revokeObjectURL(urlPratinjau);
      setLampiran({
        nama: berkas.name,
        status: err instanceof Error ? err.message : "Gagal membaca berkas",
        galat: true,
      });
    } finally {
      setSibukLampiran(false);
    }
  }

  /**
   * Kumpulkan potongan stream lalu cat ke layar sekali per frame.
   * Tanpa ini tiap token memicu render sendiri → teks bergetar dan gulir tersendat.
   */
  function penampungStream() {
    let buf = "";
    let raf = 0;
    return {
      tambah(bagian: string) {
        buf += bagian;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const teks = buf;
          buf = "";
          if (teks) setStreaming((s) => s + teks);
        });
      },
      hentikan() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        buf = "";
      },
    };
  }

  async function kirim(teks: string) {
    if (sibukLampiran) return;
    setSibuk(true);
    setError(null);
    setStreaming("");
    setCatatanMemori(null);
    setSaran([]);

    // Lampiran yang sedang terpasang ikut jadi "Konteks" di bubble pesan ini,
    // lalu dilepas dari komposer karena sudah pindah ke pesannya.
    const lampiranDikirim = lampiran && !lampiran.galat ? lampiran : null;
    setLampiran(null);

    const sementara: PesanTampil = {
      id: `sementara-${Date.now()}`,
      conversationId: aktifIdRef.current ?? "",
      role: "user",
      content: teks,
      sources: lampiranDikirim?.documentId
        ? [{ documentId: lampiranDikirim.documentId, title: lampiranDikirim.nama, score: 1 }]
        : null,
      createdAt: new Date().toISOString(),
    };
    setPesan((p) => [...p, sementara]);
    const aliran = penampungStream();

    try {
      const sebelum = jumlahMemori;
      const hasil = await kirimPesan({
        conversationId: aktifIdRef.current ?? undefined,
        mode,
        message: teks,
        autoMemori,
        attachmentIds: lampiranDikirim?.documentId ? [lampiranDikirim.documentId] : undefined,
        onChunk: aliran.tambah,
      });

      const data = await ambilPesan(hasil.conversationId);
      const daftar: PesanTampil[] = data.pesan.map((m, i) =>
        m.role === "assistant" && i === data.pesan.length - 1
          ? { ...m, durasiMs: hasil.durasiMs }
          : m,
      );
      aliran.hentikan();
      setPesan(daftar);
      setBerkasSesi(data.berkas);
      aktifIdRef.current = data.percakapan.id;
      setAktif(data.percakapan);
      setStreaming("");
      await muatDaftar(mode);
      // Balasan sudah tampil — lepaskan status sibuk SEKARANG, jangan tunggu
      // pengecekan memori, kalau tidak indikator "sedang menjawab" muncul lagi.
      setSibuk(false);
      if (saranAktif) {
        void ambilSaran(hasil.conversationId)
          .then(setSaran)
          .catch(() => setSaran([]));
      }

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
      aliran.hentikan();
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
      setStreaming("");
      setSibuk(false);
      // Kirim gagal: lampiran belum terpakai, kembalikan ke komposer supaya bisa diulang.
      if (lampiranDikirim) setLampiran(lampiranDikirim);
    }
  }

  /** Ulangi jawaban terakhir: pertanyaan terakhir dikirim ulang, tidak disimpan dua kali. */
  async function ulangi() {
    const id = aktifIdRef.current;
    const terakhirTanya = [...pesan].reverse().find((m) => m.role === "user");
    if (!id || sibuk || !terakhirTanya) return;

    setSibuk(true);
    setError(null);
    setStreaming("");
    setSaran([]);
    const aliran = penampungStream();
    try {
      const hasil = await kirimPesan({
        conversationId: id,
        mode,
        message: terakhirTanya.content,
        autoMemori: false,
        regenerate: true,
        onChunk: aliran.tambah,
      });

      const data = await ambilPesan(id);
      setPesan(
        data.pesan.map((m, i) =>
          m.role === "assistant" && i === data.pesan.length - 1
            ? { ...m, durasiMs: hasil.durasiMs }
            : m,
        ),
      );
      aliran.hentikan();
      setStreaming("");
      setSibuk(false);
      if (saranAktif) void ambilSaran(id).then(setSaran).catch(() => setSaran([]));
    } catch (err) {
      aliran.hentikan();
      setError(err instanceof Error ? err.message : "Gagal mengulang jawaban");
      setStreaming("");
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

          <button
            onClick={gantiSaran}
            aria-pressed={saranAktif}
            aria-label={saranAktif ? "Matikan saran lanjutan" : "Nyalakan saran lanjutan"}
            title={saranAktif ? "Saran lanjutan: nyala" : "Saran lanjutan: mati"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-penuh transition-colors hover:bg-border ${
              saranAktif ? "text-aksen-lembut" : "text-teks-muted-2 hover:text-teks"
            }`}
          >
            <Icon name="saran" />
          </button>

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

        <main ref={(el) => setWadahGulir(el)} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div ref={(el) => setIsiGulir(el)}>
            <MessageList
              pesan={pesan}
              streaming={streaming}
              mode={mode}
              nama={panggilan}
              menunggu={sibuk && streaming.length === 0}
              pratinjau={pratinjau}
              wadahGulir={wadahGulir}
              onUlangi={() => void ulangi()}
              bisaUlangi={!sibuk && pesan.some((m) => m.role === "assistant")}
              saran={saranAktif ? saran : []}
              onSaran={(teks) => void kirim(teks)}
            />
          </div>
        </main>

        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: TRANSISI.cepat }}
            role="alert"
            className="shrink-0 border-t border-danger/40 bg-danger/10 px-sedang py-2 text-center text-sm text-danger"
          >
            {error}
          </motion.p>
        )}

        {catatanMemori && (
          <motion.p
            key={catatanMemori}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: TRANSISI.cepat }}
            className="shrink-0 border-t border-border bg-surface px-sedang py-2 text-center text-[11px] text-teks-muted"
          >
            {catatanMemori}
          </motion.p>
        )}

        <Composer
          onKirim={kirim}
          sibuk={sibuk}
          mode={mode}
          onLampirkan={lampirkan}
          lampiran={lampiran}
          sibukLampiran={sibukLampiran}
          onHapusLampiran={() => {
            if (lampiran?.pratinjau) URL.revokeObjectURL(lampiran.pratinjau);
            setLampiran(null);
          }}
          berkasSesi={berkasSesi}
          pratinjau={pratinjau}
        />
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
