import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" DROP CONSTRAINT "texte_countdown_termin_id_termine_id_fk";
  
  ALTER TABLE "texte" DROP CONSTRAINT "texte_countdown_seite_id_pages_id_fk";
  
  DROP INDEX "texte_countdown_countdown_termin_idx";
  DROP INDEX "texte_countdown_countdown_seite_idx";
  ALTER TABLE "termine" ADD COLUMN "countdown" boolean;
  ALTER TABLE "termine" ADD COLUMN "countdown_seite_id" integer;
  ALTER TABLE "termine" ADD COLUMN "countdown_text" varchar;
  ALTER TABLE "termine" ADD CONSTRAINT "termine_countdown_seite_id_pages_id_fk" FOREIGN KEY ("countdown_seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "termine_countdown_seite_idx" ON "termine" USING btree ("countdown_seite_id");
  ALTER TABLE "texte" DROP COLUMN "countdown_aktiv";
  ALTER TABLE "texte" DROP COLUMN "countdown_termin_id";
  ALTER TABLE "texte" DROP COLUMN "countdown_titel";
  ALTER TABLE "texte" DROP COLUMN "countdown_text";
  ALTER TABLE "texte" DROP COLUMN "countdown_seite_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "termine" DROP CONSTRAINT "termine_countdown_seite_id_pages_id_fk";
  
  DROP INDEX "termine_countdown_seite_idx";
  ALTER TABLE "texte" ADD COLUMN "countdown_aktiv" boolean DEFAULT false;
  ALTER TABLE "texte" ADD COLUMN "countdown_termin_id" integer;
  ALTER TABLE "texte" ADD COLUMN "countdown_titel" varchar;
  ALTER TABLE "texte" ADD COLUMN "countdown_text" varchar;
  ALTER TABLE "texte" ADD COLUMN "countdown_seite_id" integer;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_countdown_termin_id_termine_id_fk" FOREIGN KEY ("countdown_termin_id") REFERENCES "public"."termine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_countdown_seite_id_pages_id_fk" FOREIGN KEY ("countdown_seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "texte_countdown_countdown_termin_idx" ON "texte" USING btree ("countdown_termin_id");
  CREATE INDEX "texte_countdown_countdown_seite_idx" ON "texte" USING btree ("countdown_seite_id");
  ALTER TABLE "termine" DROP COLUMN "countdown";
  ALTER TABLE "termine" DROP COLUMN "countdown_seite_id";
  ALTER TABLE "termine" DROP COLUMN "countdown_text";`)
}
