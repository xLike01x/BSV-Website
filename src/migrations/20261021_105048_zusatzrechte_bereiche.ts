import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_news" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_medien" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_sponsoren" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_seiten" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_teams" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_saisonwechsel" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_antraege" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_verein" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_datenschutz" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_statistik" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_papierkorb" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "zusatzrechte_hilfe" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_news";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_medien";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_sponsoren";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_seiten";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_teams";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_saisonwechsel";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_antraege";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_verein";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_datenschutz";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_statistik";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_papierkorb";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "zusatzrechte_hilfe";`)
}
