"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { TRANSISI } from "@/lib/motion";
import type { Pesan } from "@/lib/api";

/** Pesan ditambah durasi balasan (dihitung klien, hanya untuk ditampilkan). */
export type PesanTampil = Pesan & { durasiMs?: number };

function waktu(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** "2,4 detik" — dibulatkan ke satu angka di belakang koma. */
function durasi(ms?: number): string | null {
  if (typeof ms !== "number" || ms <= 0) return null;
  const detik = ms / 1000;
  if (detik < 60) return `${detik.toFixed(1).replace(".", ",")} detik`;
  const menit = Math.floor(detik / 60);
  const sisa = Math.round(detik % 60);
  return `${menit}m ${sisa}s`;
}

/** Avatar asisten (public/image/kirby.png) — dipakai di setiap balasan & saat menulis. */
function AvatarAsisten({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/image/kirby-96.png"
      alt="ohmysea"
      width={size}
      height={size}
      className="shrink-0 rounded-penuh border border-border-kuat bg-surface object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** Tiga titik bergerak — penanda asisten sedang menyusun jawaban. */
function TitikMenulis() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <span className="titik-menulis" />
      <span className="titik-menulis" />
      <span className="titik-menulis" />
    </span>
  );
}

export function MessageList({
  pesan,
  streaming,
  mode,
  nama,
  menunggu = false,
}: {
  pesan: PesanTampil[];
  streaming: string;
  mode: "chat" | "curhat";
  /** Panggilan pengguna dari memori (kalau ada), untuk sapaan awal. */
  nama?: string | null;
  /** true selama permintaan berjalan tapi belum ada teks yang masuk. */
  menunggu?: boolean;
}) {
  const bawah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan.length, streaming, menunggu]);

  const sedangMenulis = menunggu || streaming.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-sedang px-sedang py-besar">
      <AnimatePresence initial={false}>
        {pesan.map((m) =>
          m.role === "assistant" ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: TRANSISI.sedang }}
              className="flex w-full items-start gap-2.5"
            >
            <AvatarAsisten />
            <div className="min-w-0 flex-1">
              <div className="whitespace-pre-wrap rounded-besar rounded-tl-kecil border border-border bg-surface px-sedang py-3 text-sm leading-relaxed text-teks">
                {m.content}
              </div>
              <p className="mt-1 text-[10px] text-teks-muted-2">
                <span className="text-aksen-lembut">Kirby</span>
                {durasi(m.durasiMs) ? ` · ${durasi(m.durasiMs)}` : ""} · {waktu(m.createdAt)}
              </p>
            </div>
            </motion.div>
          ) : (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: TRANSISI.sedang }}
              className="flex justify-end"
            >
              <div className="max-w-[85%]">
                <div className="whitespace-pre-wrap rounded-besar rounded-br-kecil bg-aksen px-sedang py-3 text-sm leading-relaxed text-white">
                  {m.content}
                </div>
                <p className="mt-1 text-right text-[10px] text-teks-muted-2">{waktu(m.createdAt)}</p>
              </div>
            </motion.div>
          ),
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sedangMenulis && (
          <motion.div
            key="menunggu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: TRANSISI.cepat }}
            className="flex w-full items-start gap-2.5"
            aria-live="polite"
          >
            <AvatarAsisten />
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full items-start rounded-besar rounded-tl-kecil border border-border bg-surface px-sedang py-3 text-sm leading-relaxed">
                {streaming ? (
                  <>
                    <span className="whitespace-pre-wrap">{streaming}</span>
                    <motion.span
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="ml-0.5 inline-block h-4 w-[2px] self-end bg-aksen-lembut"
                    />
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-teks-muted">
                    <TitikMenulis />
                    <span className="text-xs">
                      {mode === "curhat" ? "Kirby sedang menyimak..." : "Kirby sedang menjawab..."}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pesan.length === 0 && !sedangMenulis && (
          <motion.div
            key="sapaan"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: TRANSISI.sedang }}
          >
            <EmptyState mode={mode} nama={nama} />
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bawah} />
    </div>
  );
}

function EmptyState({ mode, nama }: { mode: "chat" | "curhat"; nama?: string | null }) {
  const panggilan = nama ? nama.charAt(0).toUpperCase() + nama.slice(1) : null;
  const kartu =
    mode === "curhat"
      ? [
          { judul: "Ada yang mengganjal", isi: "Tumpahkan saja, aku dengarkan dulu." },
          { judul: "Hari yang berat", isi: "Ceritakan bagian terberatnya." },
          { judul: "Butuh ditata", isi: "Boleh mulai dari apa yang paling mengganggu." },
          { judul: "Cuma ingin bicara", isi: "Tidak perlu jelas, mulai saja." },
        ]
      : [
          { judul: "Pakai dokumenku", isi: "Tanya apa pun soal PRD atau TECH-SPEC ohmysea." },
          { judul: "Bikin gambar", isi: "Mode gambar ada di halaman Gambar." },
          { judul: "Ingat-ingatanku", isi: "Isi memori di Pengaturan agar aku ingat hal pentingmu." },
          { judul: "Tanya bebas", isi: "Kalau tidak ada di dokumen, aku bilang jujur." },
        ];

  return (
    <div className="flex flex-col items-start gap-besar py-besar text-left sm:items-center sm:text-center">
      <div className="flex flex-col items-start sm:items-center">
        <AvatarAsisten size={64} />
        <h2 className="mt-sedang font-display text-4xl leading-tight">
          Hi{panggilan ? ` ${panggilan}` : ""}, Kirby <span className="text-aksen-terang">di sini</span> poyoo~
        </h2>
        <p className="mt-2 text-sm text-teks-muted">
          Mau ngapain hari ini?{" "}
          {mode === "curhat"
            ? "Mode curhat: aku menanggapi perasaanmu dulu, bukan menceramahi."
            : "Mode chat: aku ingat percakapan ini dan bisa memakai dokumen yang kamu tambahkan."}
        </p>
      </div>
      <div className="grid w-full grid-cols-1 gap-sedang sm:grid-cols-2">
        {kartu.map((k) => (
          <div
            key={k.judul}
            className="rounded-besar border border-border-kuat bg-surface p-sedang text-left"
          >
            <p className="text-sm font-semibold">{k.judul}</p>
            <p className="mt-1 text-xs text-teks-muted">{k.isi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
