import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'registrierungen' BEFORE 'papierkorb';
  ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'mailVorlagen' BEFORE 'dokumente';
  ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'profilbilder' BEFORE 'hilfe-center';
  ALTER TYPE "public"."enum_hilfe_bereiche_bereich" ADD VALUE 'passdokumente' BEFORE 'hilfe-center';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'registrierungen' BEFORE 'papierkorb';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'mailVorlagen' BEFORE 'dokumente';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'profilbilder' BEFORE 'hilfe-center';
  ALTER TYPE "public"."enum_hilfe_faq_bereich" ADD VALUE 'passdokumente' BEFORE 'hilfe-center';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hilfe_bereiche" ALTER COLUMN "bereich" SET DATA TYPE text;
  DROP TYPE "public"."enum_hilfe_bereiche_bereich";
  CREATE TYPE "public"."enum_hilfe_bereiche_bereich" AS ENUM('dashboard', 'posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'passantraege', 'mitgliedschaften', 'kontaktanfragen', 'users', 'menue', 'verein', 'papierkorb', 'statistik', 'sicherheit', 'texte', 'forms', 'form-submissions', 'redirects', 'search', 'rollen', 'sicherung', 'rollenRechte', 'datenschutz', 'dokumente', 'sponsoren', 'alben', 'gesuche', 'hilfe-center', 'hilfe', 'hilfe-feedback', 'account');
  ALTER TABLE "hilfe_bereiche" ALTER COLUMN "bereich" SET DATA TYPE "public"."enum_hilfe_bereiche_bereich" USING "bereich"::"public"."enum_hilfe_bereiche_bereich";
  ALTER TABLE "hilfe_faq" ALTER COLUMN "bereich" SET DATA TYPE text;
  DROP TYPE "public"."enum_hilfe_faq_bereich";
  CREATE TYPE "public"."enum_hilfe_faq_bereich" AS ENUM('dashboard', 'posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'passantraege', 'mitgliedschaften', 'kontaktanfragen', 'users', 'menue', 'verein', 'papierkorb', 'statistik', 'sicherheit', 'texte', 'forms', 'form-submissions', 'redirects', 'search', 'rollen', 'sicherung', 'rollenRechte', 'datenschutz', 'dokumente', 'sponsoren', 'alben', 'gesuche', 'hilfe-center', 'hilfe', 'hilfe-feedback', 'account');
  ALTER TABLE "hilfe_faq" ALTER COLUMN "bereich" SET DATA TYPE "public"."enum_hilfe_faq_bereich" USING "bereich"::"public"."enum_hilfe_faq_bereich";`)
}
