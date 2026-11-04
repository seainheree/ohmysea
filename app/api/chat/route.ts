import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { streamText } from "ai";
import { z } from "zod";

import { chatModel, curhatModel, HISTORY_LIMIT } from "@/lib/ai/groq";
import { SYSTEM_CHAT, SYSTEM_CURHAT, buildContextBlock } from "@/lib/ai/prompts";
import { getDb } from "@/lib/db/client";
import { conversations, messages } from "@/lib/db/schema";
import { kunciRateLimit, pesanError, rateLimit, requireSession } from "@/lib/guard";
import { ambilMemoriAktif, buildMemoryBlock } from "@/lib/memory";
import { retrieve, toSources } from "@/lib/rag/retrieve";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  conversationId: z.uuid().optional(),
  mode: z.enum(["chat", "curhat"]),
  message: z.string().min(1, "Pesan tidak boleh kosong").max(4000, "Pesan terlalu panjang (maks 4000 karakter)"),
});

function judulDari(pesan: string): string {
  return pesan.replace(/\s+/g, " ").trim().split(" ").slice(0, 6).join(" ").slice(0, 60);
}

export async function POST(request: NextRequest) {
  const tolak = requireSession(request);
  if (tolak) return tolak;

  const batas = rateLimit(`chat:${kunciRateLimit(request)}`, 30, 60_000);
  if (!batas.ok) {
    return NextResponse.json(
      { ok: false, pesan: "Terlalu banyak permintaan. Tunggu satu menit lagi." },
      { status: 429 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Body tidak valid: ${pesanError(err)}` },
      { status: 400 },
    );
  }

  try {
    const db = getDb();

    // 1. Pastikan percakapan ada (buat baru kalau belum).
    let conversationId = body.conversationId;
    if (!conversationId) {
      const [baru] = await db
        .insert(conversations)
        .values({ title: judulDari(body.message) || "Percakapan baru", mode: body.mode })
        .returning({ id: conversations.id });
      if (!baru) throw new Error("Gagal membuat percakapan");
      conversationId = baru.id;
    } else {
      const ada = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      if (!ada[0]) {
        return NextResponse.json(
          { ok: false, pesan: "Percakapan tidak ditemukan." },
          { status: 404 },
        );
      }
    }

    // 2. Simpan pesan pengguna.
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: body.message,
    });

    // 3. Ambil konteks dokumen (RAG) hanya untuk mode chat.
    const potongan = body.mode === "chat" ? await retrieve(body.message) : [];
    const sources = toSources(potongan);

    // 4. Memori AI (fitur Pengaturan) — dipakai di kedua mode.
    const ingatan = await ambilMemoriAktif();

    // 5. Susun riwayat untuk model.
    const riwayat = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(HISTORY_LIMIT);

    const percakapan = riwayat
      .reverse()
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const system =
      (body.mode === "curhat" ? SYSTEM_CURHAT : SYSTEM_CHAT) +
      buildContextBlock(potongan) +
      buildMemoryBlock(ingatan);

    const hasil = streamText({
      model: body.mode === "curhat" ? curhatModel() : chatModel(),
      system,
      messages: percakapan,
      temperature: body.mode === "curhat" ? 0.8 : 0.4,
      maxOutputTokens: body.mode === "curhat" ? 800 : 2000,
      maxRetries: 2,
      onError: ({ error }) => {
        console.error("streamText error:", pesanError(error));
      },
      onFinish: async ({ text }) => {
        try {
          const db2 = getDb();
          await db2.insert(messages).values({
            conversationId,
            role: "assistant",
            content: text,
            sources: sources.length > 0 ? sources : null,
          });
          await db2
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, conversationId));
        } catch (err) {
          console.error("gagal menyimpan balasan:", pesanError(err));
        }
      },
    });

    const upstream = hasil.toTextStreamResponse();
    return new Response(upstream.body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-ohmysea-conversation": conversationId,
        "x-ohmysea-sumber": encodeURIComponent(JSON.stringify(sources)),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, pesan: `Gagal menjawab: ${pesanError(err)}` },
      { status: 502 },
    );
  }
}

/** Daftar percakapan ada di /api/conversations — tidak diduplikasi di sini. */
