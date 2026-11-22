"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { DURASI, GSAP_EASE, TRANSISI } from "@/lib/motion";
import type { Pesan } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/chat/Markdown";

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

/** Avatar asisten (public/image/kirby.png), tanpa bingkai — dipakai di setiap balasan. */
function AvatarAsisten({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/image/kirby-96.png"
      alt="ohmysea"
      width={size}
      height={size}
      className="shrink-0 object-contain"
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

/** Tombol salin isi balasan asisten (beri umpan balik centang sebentar). */
function TombolSalin({ teks }: { teks: string }) {
  const [tersalin, setTersalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(true);
      window.setTimeout(() => setTersalin(false), 1600);
    } catch {
      // Clipboard bisa diblokir browser; abaikan tanpa mengganggu chat.
    }
  }

  return (
    <button
      onClick={() => void salin()}
      aria-label={tersalin ? "Balasan tersalin" : "Salin balasan"}
      title={tersalin ? "Tersalin" : "Salin balasan"}
      className="grid h-7 w-7 place-items-center rounded-penuh text-teks-muted-2 transition-colors hover:bg-border hover:text-teks"
    >
      <Icon name={tersalin ? "centang" : "salin"} size={14} />
    </button>
  );
}

export function MessageList({
  pesan,
  streaming,
  mode,
  nama,
  menunggu = false,
  onUlangi,
  bisaUlangi = false,
  saran = [],
  onSaran,
  pratinjau = {},
  wadahGulir = null,
}: {
  pesan: PesanTampil[];
  streaming: string;
  mode: "chat" | "curhat";
  /** Panggilan pengguna dari memori (kalau ada), untuk sapaan awal. */
  nama?: string | null;
  /** true selama permintaan berjalan tapi belum ada teks yang masuk. */
  menunggu?: boolean;
  /** Ulangi jawaban terakhir (ikon saja, di balasan asisten terakhir). */
  onUlangi?: () => void;
  bisaUlangi?: boolean;
  /** Saran pertanyaan lanjutan; klik = langsung dikirim. */
  saran?: string[];
  onSaran?: (teks: string) => void;
  /** documentId → object URL gambar yang diunggah, untuk dipratinjau di bubble. */
  pratinjau?: Record<string, string>;
  /** Wadah gulir chat — dipakai ScrollTrigger untuk parallax sapaan. */
  wadahGulir?: HTMLElement | null;
}) {
  const bawah = useRef<HTMLDivElement>(null);
  const dekatBawah = useRef(true);
  const [tampilTurun, setTampilTurun] = useState(false);

  // Gulir otomatis hanya kalau pengguna memang berada di dasar; kalau sedang
  // membaca ke atas, jangan ditarik turun tiap potongan balasan masuk.
  useEffect(() => {
    const el = wadahGulir;
    if (!el) return;
    const pantau = () => {
      const sisa = el.scrollHeight - el.scrollTop - el.clientHeight;
      dekatBawah.current = sisa < 120;
      setTampilTurun(sisa >= 120);
    };
    pantau();
    el.addEventListener("scroll", pantau, { passive: true });
    return () => el.removeEventListener("scroll", pantau);
  }, [wadahGulir]);

  useEffect(() => {
    if (dekatBawah.current) bawah.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan.length, streaming, menunggu]);

  const sedangMenulis = menunggu || streaming.length > 0;
  const akhirAsisten = [...pesan].reverse().find((m) => m.role === "assistant")?.id ?? null;

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
              <div className="rounded-besar rounded-tl-kecil border border-border bg-surface px-sedang py-3 text-[15px] leading-7 text-pretty text-teks">
                <Markdown teks={m.content} />
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">
                    Konteks
                  </span>
                  {[...new Set(m.sources.map((s) => s.title))].map((judul) => (
                    <span
                      key={judul}
                      title={judul}
                      className="inline-flex max-w-[220px] items-center gap-1 rounded-penuh border border-border-kuat bg-bg-main px-2 py-0.5 text-[11px] text-teks-muted"
                    >
                      <Icon name="berkas" size={11} />
                      <span className="truncate">{judul}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[10px] text-teks-muted-2">
                  <span className="text-aksen-lembut">Kirby</span>
                  {durasi(m.durasiMs) ? ` · ${durasi(m.durasiMs)}` : ""} · {waktu(m.createdAt)}
                </p>
                <TombolSalin teks={m.content} />
                {bisaUlangi && m.id === akhirAsisten && (
                  <button
                    onClick={onUlangi}
                    aria-label="Ulangi jawaban"
                    title="Ulangi jawaban"
                    className="grid h-7 w-7 place-items-center rounded-penuh text-teks-muted-2 transition-colors hover:bg-border hover:text-teks"
                  >
                    <Icon name="ulang" size={14} />
                  </button>
                )}
              </div>
              {bisaUlangi && m.id === akhirAsisten && saran.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {saran.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0, transition: { ...TRANSISI.cepat, delay: i * 0.06 } }}
                      onClick={() => onSaran?.(s)}
                      className="rounded-penuh border border-border-kuat bg-surface px-sedang py-1.5 text-left text-[12px] text-teks-muted transition-colors hover:border-aksen hover:text-teks"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              )}
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
                {(() => {
                  const gambar = (m.sources ?? []).filter((s) => pratinjau[s.documentId]);
                  return gambar.length > 0 ? (
                    <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
                      {gambar.map((s) => (
                        <a
                          key={s.documentId}
                          href={pratinjau[s.documentId]}
                          target="_blank"
                          rel="noreferrer"
                          title={s.title}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pratinjau[s.documentId]}
                            alt={s.title}
                            className="max-h-52 rounded-sedang border border-border object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div className="whitespace-pre-wrap rounded-besar rounded-br-kecil bg-aksen px-sedang py-3 text-sm leading-relaxed text-white">
                  {m.content}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1">
                    <span className="text-[10px] uppercase tracking-[0.08em] text-teks-muted-2">
                      Konteks
                    </span>
                    {[...new Set(m.sources.map((s) => s.title))].map((judul) => (
                      <span
                        key={judul}
                        title={judul}
                        className="inline-flex max-w-[220px] items-center gap-1 rounded-penuh border border-border-kuat bg-bg-main px-2 py-0.5 text-[11px] text-teks-muted"
                      >
                        <Icon name="berkas" size={11} />
                        <span className="truncate">{judul}</span>
                      </span>
                    ))}
                  </div>
                )}
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
                    <Markdown teks={streaming} />
                    <span className="kursor-menulis ml-0.5 inline-block h-4 w-[2px] self-end rounded-penuh bg-aksen-lembut" />
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-teks-muted">
                    <TitikMenulis />
                    <span className="teks-kilau text-xs">
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
            <EmptyState mode={mode} nama={nama} scroller={wadahGulir} />
          </motion.div>
        )}
      </AnimatePresence>
      {tampilTurun && (
        <button
          onClick={() => {
            dekatBawah.current = true;
            setTampilTurun(false);
            bawah.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }}
          className="sticky bottom-3 z-10 mx-auto flex items-center gap-1.5 rounded-penuh border border-border-kuat bg-surface/95 px-3 py-1.5 text-[11px] text-teks-muted shadow-lg backdrop-blur transition-colors hover:text-teks"
          aria-label="Ke pesan terbaru"
        >
          <Icon name="bawah" size={13} /> Pesan terbaru
        </button>
      )}
      <div ref={bawah} />
    </div>
  );
}

function EmptyState({
  mode,
  nama,
  scroller,
}: {
  mode: "chat" | "curhat";
  nama?: string | null;
  scroller?: HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const panggilan = nama ? nama.charAt(0).toUpperCase() + nama.slice(1) : null;

  // Sapaan hero: masuk berurutan dengan GSAP; parallax halus mengikuti gulir chat.
  useGSAP(
    () => {
      gsap.registerPlugin(useGSAP, ScrollTrigger);
      gsap
        .timeline({ defaults: { ease: GSAP_EASE.standar, duration: DURASI.sedang } })
        .from(".hero-avatar", { opacity: 0, scale: 0.7, y: 12 })
        .from(".hero-judul", { opacity: 0, y: 18 }, "-=0.15")
        .from(".hero-sub", { opacity: 0, y: 12 }, "-=0.2");

      if (scroller) {
        gsap.to(".hero-inti", {
          y: -48,
          ease: "none",
          scrollTrigger: {
            scroller,
            trigger: ref.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    },
    { scope: ref, dependencies: [scroller], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      className="flex flex-col items-start gap-besar py-besar text-left sm:items-center sm:text-center"
    >
      <div className="hero-inti flex flex-col items-start sm:items-center">
        <div className="hero-avatar">
          <AvatarAsisten size={64} />
        </div>
        <h2 className="hero-judul mt-sedang font-display text-4xl leading-tight">
          Hi{panggilan ? ` ${panggilan}` : ""}, Kirby <span className="text-aksen-terang">di sini</span> poyoo~
        </h2>
        <p className="hero-sub mt-2 text-sm text-teks-muted">
          Mau ngapain hari ini?{" "}
          {mode === "curhat"
            ? "Mode curhat: aku menanggapi perasaanmu dulu, bukan menceramahi."
            : "Mode chat: aku ingat percakapan ini dan bisa memakai dokumen yang kamu tambahkan."}
        </p>
      </div>
    </div>
  );
}
