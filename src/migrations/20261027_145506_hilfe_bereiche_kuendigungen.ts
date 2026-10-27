import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'kuendigungen' BEFORE 'kontaktanfragen';
  ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'spielergebnisse' BEFORE 'forms';
  ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'animationen' BEFORE 'forms';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'kuendigungen' BEFORE 'kontaktanfragen';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'spielergebnisse' BEFORE 'forms';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'animationen' BEFORE 'forms';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hilfe_bereiche" ALTER COLUMN "bereich" SET DATA TYPE text;
  DROP TYPE "public"."enum_hilfe_bereiche_bereich";
  CREATE TYPE "public"."enum_hilfe_bereiche_bereich" AS ENUM('dashboard', 'posts', 'termine', 'media', 'pages', 'categories', 'saisonwechsel', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'passantraege', 'mitgliedschaften', 'kontaktanfragen', 'users', 'menue', 'verein', 'registrierungen', 'papierkorb', 'statistik', 'sicherheit', 'texte', 'forms', 'form-submissions', 'redirects', 'search', 'rollen', 'updates', 'sicherung', 'rollenRechte', 'datenschutz', 'mailVorlagen', 'dokumente', 'sponsoren', 'alben', 'gesuche', 'profilbilder', 'passdokumente', 'hilfe-center', 'hilfe', 'hilfe-feedback', 'account');
  ALTER TABLE "hilfe_bereiche" ALTER COLUMN "bereich" SET DATA TYPE "public"."enum_hilfe_bereiche_bereich" USING "bereich"::"public"."enum_hilfe_bereiche_bereich";
  ALTER TABLE "hilfe_faq" ALTER COLUMN "bereich" SET DATA TYPE text;
  DROP TYPE "public"."enum_hilfe_faq_bereich";
  CREATE TYPE "public"."enum_hilfe_faq_bereich" AS ENUM('dashboard', 'posts', 'termine', 'media', 'pages', 'categories', 'saisonwechsel', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'passantraege', 'mitgliedschaften', 'kontaktanfragen', 'users', 'menue', 'verein', 'registrierungen', 'papierkorb', 'statistik', 'sicherheit', 'texte', 'forms', 'form-submissions', 'redirects', 'search', 'rollen', 'updates', 'sicherung', 'rollenRechte', 'datenschutz', 'mailVorlagen', 'dokumente', 'sponsoren', 'alben', 'gesuche', 'profilbilder', 'passdokumente', 'hilfe-center', 'hilfe', 'hilfe-feedback', 'account');
  ALTER TABLE "hilfe_faq" ALTER COLUMN "bereich" SET DATA TYPE "public"."enum_hilfe_faq_bereich" USING "bereich"::"public"."enum_hilfe_faq_bereich";`)
}
