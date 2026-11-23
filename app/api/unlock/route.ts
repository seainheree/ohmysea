import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { pesanError } from "@/lib/guard";
import { SESSION_COOKIE, buatSesi, cookieOptions, isValidCode } from "@/lib/session";

const bodySchema = z.object({ code: z.string().min(1, "Kode akses wajib diisi") });

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;

  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Body harus { code: string }" }, { status: 400 });
  }

  try {
    if (!isValidCode(parsed.code)) {
      return NextResponse.json({ ok: false, pesan: "Kode akses salah." }, { status: 401 });
    }

    // Kode benar. Sesi lama yang paling tua dikeluarkan otomatis kalau slot penuh
    // (tidak ada lagi layar "Perangkat aktif" untuk memilih).
    const token = await buatSesi(request.headers.get("user-agent") ?? "");

    const response = NextResponse.json({ ok: true, pesan: "Akses dibuka." });
    response.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return response;
  } catch (err) {
    // Env server belum siap: beri pesan jelas, bukan 500 kosong.
    return NextResponse.json(
      { ok: false, pesan: `Login tidak bisa diproses: ${pesanError(err)}` },
      { status: 503 },
    );
  }
}
