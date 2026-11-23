"use client";

import { parseMarkdown, type Blok, type Sebaris } from "@/lib/markdown";

function Inline({ potongan }: { potongan: Sebaris[] }) {
  return (
    <>
      {potongan.map((p, i) => {
        if (p.jenis === "tebal") return <strong key={i} className="font-semibold text-teks">{p.isi}</strong>;
        if (p.jenis === "miring") return <em key={i}>{p.isi}</em>;
        if (p.jenis === "kode")
          return (
            <code key={i} className="rounded-kecil bg-bg-main px-1 py-0.5 font-mono text-[0.92em] text-aksen-lembut">
              {p.isi}
            </code>
          );
        if (p.jenis === "tautan")
          return (
            <a
              key={i}
              href={p.href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-aksen-lembut underline underline-offset-2"
            >
              {p.isi}
            </a>
          );
        return <span key={i}>{p.isi}</span>;
      })}
    </>
  );
}

function Baris({ baris }: { baris: Sebaris[][] }) {
  return (
    <>
      {baris.map((isi, i) => (
        <span key={i} className="block">
          <Inline potongan={isi} />
        </span>
      ))}
    </>
  );
}

function SatuBlok({ b }: { b: Blok }) {
  if (b.jenis === "kode")
    return (
      <pre className="overflow-x-auto rounded-sedang border border-border bg-bg-main px-sedang py-2 font-mono text-[12px] leading-relaxed text-teks">
        <code>{b.isi}</code>
      </pre>
    );
  if (b.jenis === "judul") {
    const kelas = b.tingkat <= 2 ? "text-base font-semibold" : "text-sm font-semibold";
    return (
      <p className={`${kelas} text-teks`}>
        <Inline potongan={b.isi} />
      </p>
    );
  }
  if (b.jenis === "garis") return <hr className="border-border" />;
  if (b.jenis === "kutipan")
    return (
      <blockquote className="border-l-2 border-aksen/60 pl-sedang text-teks-muted">
        <Baris baris={b.baris} />
      </blockquote>
    );
  if (b.jenis === "daftar") {
    const Tag = b.terurut ? "ol" : "ul";
    return (
      <Tag className={`flex flex-col gap-1 pl-4 ${b.terurut ? "list-decimal" : "list-disc"}`}>
        {b.butir.map((isi, i) => (
          <li key={i}>
            <Inline potongan={isi} />
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p>
      <Baris baris={b.baris} />
    </p>
  );
}

/** Balasan asisten dirender sebagai markdown, bukan teks mentah ber-**bintang**. */
export function Markdown({ teks }: { teks: string }) {
  const blok = parseMarkdown(teks);
  return (
    // min-w-0 + break-words: kata panjang tanpa spasi patah di dalam bubble,
    // bukan mendorong lebar tata letak sampai halaman bisa digeser ke kanan.
    <div className="flex min-w-0 flex-col gap-2 break-words">
      {blok.map((b, i) => (
        <SatuBlok key={i} b={b} />
      ))}
    </div>
  );
}