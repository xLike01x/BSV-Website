import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_termin_rueckmeldungen_teilnahme" AS ENUM('ja', 'nein');
  CREATE TABLE "termin_rueckmeldungen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"termin_id" integer,
  	"mitglied_id" integer,
  	"name" varchar,
  	"teilnahme" "enum_termin_rueckmeldungen_teilnahme" NOT NULL,
  	"personen" numeric DEFAULT 1,
  	"bemerkung" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "termine" ADD COLUMN "anmeldeschluss" timestamp(3) with time zone;
  ALTER TABLE "termine" ADD COLUMN "begleitung" boolean;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "termin_rueckmeldungen_id" integer;
  ALTER TABLE "datenschutz" ADD COLUMN "rueckmeldungen_tage" numeric DEFAULT 30;
  ALTER TABLE "termin_rueckmeldungen" ADD CONSTRAINT "termin_rueckmeldungen_termin_id_termine_id_fk" FOREIGN KEY ("termin_id") REFERENCES "public"."termine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "termin_rueckmeldungen" ADD CONSTRAINT "termin_rueckmeldungen_mitglied_id_users_id_fk" FOREIGN KEY ("mitglied_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "termin_rueckmeldungen_termin_idx" ON "termin_rueckmeldungen" USING btree ("termin_id");
  CREATE INDEX "termin_rueckmeldungen_mitglied_idx" ON "termin_rueckmeldungen" USING btree ("mitglied_id");
  CREATE INDEX "termin_rueckmeldungen_updated_at_idx" ON "termin_rueckmeldungen" USING btree ("updated_at");
  CREATE INDEX "termin_rueckmeldungen_created_at_idx" ON "termin_rueckmeldungen" USING btree ("created_at");
  CREATE UNIQUE INDEX "termin_mitglied_idx" ON "termin_rueckmeldungen" USING btree ("termin_id","mitglied_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_termin_rueckmeldungen_fk" FOREIGN KEY ("termin_rueckmeldungen_id") REFERENCES "public"."termin_rueckmeldungen"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_termin_rueckmeldungen_id_idx" ON "payload_locked_documents_rels" USING btree ("termin_rueckmeldungen_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "termin_rueckmeldungen" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "termin_rueckmeldungen" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_termin_rueckmeldungen_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_termin_rueckmeldungen_id_idx";
  ALTER TABLE "termine" DROP COLUMN "anmeldeschluss";
  ALTER TABLE "termine" DROP COLUMN "begleitung";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "termin_rueckmeldungen_id";
  ALTER TABLE "datenschutz" DROP COLUMN "rueckmeldungen_tage";
  DROP TYPE "public"."enum_termin_rueckmeldungen_teilnahme";`)
}
