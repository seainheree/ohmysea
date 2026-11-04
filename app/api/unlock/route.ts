import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { SESSION_COOKIE, cookieOptions, isValidCode, sessionValue } from "@/lib/session";

const bodySchema = z.object({ code: z.string().min(1, "Kode akses wajib diisi") });

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;

  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, pesan: "Body harus { code: string }" }, { status: 400 });
  }

  if (!isValidCode(parsed.code)) {
    return NextResponse.json({ ok: false, pesan: "Kode akses salah." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, pesan: "Akses dibuka." });
  response.cookies.set(SESSION_COOKIE, sessionValue(), cookieOptions());
  return response;
}
