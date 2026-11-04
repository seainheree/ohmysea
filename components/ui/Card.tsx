import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...sisa
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...sisa}
      className={`rounded-besar border border-border bg-surface p-sedang ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-teks-muted-2">
      {children}
    </span>
  );
}

export function Pill({
  children,
  aktif = false,
  title,
}: {
  children: ReactNode;
  aktif?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-penuh border px-3 py-1 text-xs ${
        aktif
          ? "border-aksen bg-aksen/15 text-aksen-lembut"
          : "border-border-kuat text-teks-muted"
      }`}
    >
      {children}
    </span>
  );
}
