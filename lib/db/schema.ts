import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/** Potongan dokumen yang dipakai untuk menjawab (disimpan di messages.sources). */
export type RagSource = {
  documentId: string;
  title: string;
  score: number;
};

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("Percakapan baru"),
  mode: text("mode").notNull().$type<"chat" | "curhat">().default("chat"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"user" | "assistant" | "system">(),
    content: text("content").notNull(),
    sources: jsonb("sources").$type<RagSource[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  checksum: text("checksum").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    content: text("content").notNull(),
    // 1024 = dimensi @cf/baai/bge-m3. Ganti model embedding = bangun ulang kolom ini.
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("chunks_document_idx").on(t.documentId, t.ordinal),
    index("chunks_embedding_hnsw").using("hnsw", sql`${t.embedding} vector_cosine_ops`),
  ],
);

export const images = pgTable(
  "images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prompt: text("prompt").notNull(),
    style: text("style").notNull(),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    steps: integer("steps"),
    seed: integer("seed"),
    sourceImage: text("source_image"),
    url: text("url").notNull(),
    durationMs: integer("duration_ms"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("images_created_idx").on(t.createdAt)],
);

/** Memori AI: fakta yang diingat tentang pengguna, disuntikkan ke prompt sistem. */
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    aktif: boolean("aktif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("memories_aktif_idx").on(t.aktif, t.createdAt)],
);

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Chunk = typeof chunks.$inferSelect;
export type ImageRow = typeof images.$inferSelect;
export type Memory = typeof memories.$inferSelect;
