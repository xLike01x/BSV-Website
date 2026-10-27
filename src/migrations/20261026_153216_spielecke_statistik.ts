import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "spielstatistik" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"datum" varchar NOT NULL,
  	"elfmeter_schuesse" numeric DEFAULT 0,
  	"elfmeter_tore" numeric DEFAULT 0,
  	"hochhalten_spiele" numeric DEFAULT 0,
  	"hochhalten_rekord" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "spielstatistik_id" integer;
  CREATE UNIQUE INDEX "spielstatistik_datum_idx" ON "spielstatistik" USING btree ("datum");
  CREATE INDEX "spielstatistik_updated_at_idx" ON "spielstatistik" USING btree ("updated_at");
  CREATE INDEX "spielstatistik_created_at_idx" ON "spielstatistik" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spielstatistik_fk" FOREIGN KEY ("spielstatistik_id") REFERENCES "public"."spielstatistik"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_spielstatistik_id_idx" ON "payload_locked_documents_rels" USING btree ("spielstatistik_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "spielstatistik" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "spielstatistik" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_spielstatistik_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_spielstatistik_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "spielstatistik_id";`)
}
