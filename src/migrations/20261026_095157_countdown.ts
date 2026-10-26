import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ADD COLUMN "countdown_aktiv" boolean DEFAULT false;
  ALTER TABLE "texte" ADD COLUMN "countdown_termin_id" integer;
  ALTER TABLE "texte" ADD COLUMN "countdown_kicker" varchar DEFAULT 'Bald im BSV';
  ALTER TABLE "texte" ADD COLUMN "countdown_titel" varchar;
  ALTER TABLE "texte" ADD COLUMN "countdown_text" varchar;
  ALTER TABLE "texte" ADD COLUMN "countdown_link_text" varchar DEFAULT 'Alle Infos zum Termin ›';
  ALTER TABLE "texte" ADD CONSTRAINT "texte_countdown_termin_id_termine_id_fk" FOREIGN KEY ("countdown_termin_id") REFERENCES "public"."termine"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "texte_countdown_countdown_termin_idx" ON "texte" USING btree ("countdown_termin_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" DROP CONSTRAINT "texte_countdown_termin_id_termine_id_fk";
  
  DROP INDEX "texte_countdown_countdown_termin_idx";
  ALTER TABLE "texte" DROP COLUMN "countdown_aktiv";
  ALTER TABLE "texte" DROP COLUMN "countdown_termin_id";
  ALTER TABLE "texte" DROP COLUMN "countdown_kicker";
  ALTER TABLE "texte" DROP COLUMN "countdown_titel";
  ALTER TABLE "texte" DROP COLUMN "countdown_text";
  ALTER TABLE "texte" DROP COLUMN "countdown_link_text";`)
}
