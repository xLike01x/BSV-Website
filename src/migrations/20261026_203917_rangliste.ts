import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_spielergebnisse_spiel" AS ENUM('hochhalten', 'memory', 'elfmeterSerie');
  CREATE TABLE "spielergebnisse" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"spitzname" varchar NOT NULL,
  	"spiel" "enum_spielergebnisse_spiel" NOT NULL,
  	"wert" numeric NOT NULL,
  	"freigegeben" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "spielergebnisse_id" integer;
  ALTER TABLE "animationen" ADD COLUMN "rangliste" boolean DEFAULT true;
  ALTER TABLE "animationen" ADD COLUMN "rangliste_freigabe" boolean DEFAULT false;
  CREATE INDEX "spielergebnisse_spiel_idx" ON "spielergebnisse" USING btree ("spiel");
  CREATE INDEX "spielergebnisse_wert_idx" ON "spielergebnisse" USING btree ("wert");
  CREATE INDEX "spielergebnisse_freigegeben_idx" ON "spielergebnisse" USING btree ("freigegeben");
  CREATE INDEX "spielergebnisse_updated_at_idx" ON "spielergebnisse" USING btree ("updated_at");
  CREATE INDEX "spielergebnisse_created_at_idx" ON "spielergebnisse" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spielergebnisse_fk" FOREIGN KEY ("spielergebnisse_id") REFERENCES "public"."spielergebnisse"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_spielergebnisse_id_idx" ON "payload_locked_documents_rels" USING btree ("spielergebnisse_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "spielergebnisse" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "spielergebnisse" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_spielergebnisse_fk";
  
  DROP INDEX "payload_locked_documents_rels_spielergebnisse_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "spielergebnisse_id";
  ALTER TABLE "animationen" DROP COLUMN "rangliste";
  ALTER TABLE "animationen" DROP COLUMN "rangliste_freigabe";
  DROP TYPE "public"."enum_spielergebnisse_spiel";`)
}
