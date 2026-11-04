"use client";

import { useEffect, useRef } from "react";

import { Icon } from "@/components/ui/Icon";
import type { Pesan } from "@/lib/api";

function waktu(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MessageList({
  pesan,
  streaming,
  mode,
}: {
  pesan: Pesan[];
  streaming: string;
  mode: "chat" | "curhat";
}) {
  const bawah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan.length, streaming]);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-sedang px-sedang py-besar">
      {pesan.map((m) => (
        <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[90%]"}>
            <div
              className={`whitespace-pre-wrap rounded-besar px-sedang py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-aksen text-white"
                  : "border border-border bg-surface text-teks"
              }`}
            >
              {m.content}
            </div>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {m.sources.map((s) => (
                  <span
                    key={s.documentId}
                    title={`skor kemiripan ${s.score}`}
                    className="inline-flex items-center gap-1 rounded-penuh border border-border-kuat bg-surface px-2 py-0.5 text-[11px] text-teks-muted"
                  >
                    <Icon name="berkas" size={11} />
                    {s.title} · {s.score.toFixed(2)}
                  </span>
                ))}
              </div>
            )}
            <p
              className={`mt-1 text-[10px] text-teks-muted-2 ${m.role === "user" ? "text-right" : ""}`}
            >
              {waktu(m.createdAt)}
            </p>
          </div>
        </div>
      ))}

      {streaming && (
        <div className="flex justify-start">
          <div className="max-w-[90%] whitespace-pre-wrap rounded-besar border border-border bg-surface px-sedang py-3 text-sm leading-relaxed">
            {streaming}
          </div>
        </div>
      )}

      {pesan.length === 0 && !streaming && <EmptyState mode={mode} />}
      <div ref={bawah} />
    </div>
  );
}

function EmptyState({ mode }: { mode: "chat" | "curhat" }) {
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
          { judul: "Lanjut besok", isi: "Percakapan ini tersimpan, bisa dilanjut kapan saja." },
          { judul: "Tanya bebas", isi: "Kalau tidak ada di dokumen, aku bilang jujur." },
        ];

  return (
    <div className="flex flex-col items-start gap-besar py-besar text-left sm:items-center sm:text-center">
      <div>
        <h2 className="font-display text-4xl leading-tight">
          Mau <span className="text-aksen-terang">ngapain</span> hari ini?
        </h2>
        <p className="mt-2 text-sm text-teks-muted">
          {mode === "curhat"
            ? "Mode curhat: aku menanggapi perasaanmu dulu, bukan menceramahi."
            : "Mode chat: aku ingat percakapan ini dan bisa memakai dokumen yang kamu tambahkan."}
        </p>
      </div>
      <div className="grid w-full grid-cols-1 gap-sedang sm:grid-cols-2">
        {kartu.map((k) => (
          <div key={k.judul} className="rounded-besar border border-border-kuat bg-surface p-sedang text-left">
            <p className="text-sm font-semibold">{k.judul}</p>
            <p className="mt-1 text-xs text-teks-muted">{k.isi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
