import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { images } from "@/lib/db/schema";
import { pesanError, requireSession } from "@/lib/guard";

export const runtime = "nodejs";

/**
 * Alirkan byte gambar lewat origin sendiri. Dipakai oleh pemotong latar di
 * browser (canvas butuh gambar "same-origin" supaya tidak jadi tainted).
 */
export async function GET(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) {
    return NextResponse.json({ ok: false, pesan: "Parameter id tidak valid." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [baris] = await db
      .select({ url: images.url })
      .from(images)
      .where(eq(images.id, id.data))
      .limit(1);

    if (!baris?.url || baris.url.startsWith("gagal://")) {
      return NextResponse.json({ ok: false, pesan: "Gambar tidak ditemukan." }, { status: 404 });
    }

    const res = await fetch(baris.url, { cache: "no-store" });
    if (!res.ok || !res.body) {
      return NextResponse.json(
        { ok: false, pesan: `Gagal mengambil gambar (HTTP ${res.status}).` },
        { status: 502 },
      );
    }

    return new Response(res.body, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal mengambil gambar: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}