-- Lampiran per percakapan: dokumen boleh terikat ke satu percakapan.
-- conversation_id NULL = dokumen basis pengetahuan global (CLI/URL), perilakunya tidak berubah.

ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "conversation_id" uuid;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_conversation_id_conversations_id_fk'
  ) THEN
    ALTER TABLE "documents"
      ADD CONSTRAINT "documents_conversation_id_conversations_id_fk"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

-- Checksum tidak lagi unik global: file yang sama boleh dilampirkan di percakapan berbeda.
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_checksum_unique";
--> statement-breakpoint

-- Dedupe dokumen global tetap berlaku.
CREATE UNIQUE INDEX IF NOT EXISTS "documents_checksum_global_idx"
  ON "documents" ("checksum") WHERE "conversation_id" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "documents_conversation_idx" ON "documents" ("conversation_id");