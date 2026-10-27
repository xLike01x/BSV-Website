import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mitgliedsantraege_familienmitglieder_geschlecht" AS ENUM('m', 'w', 'd');
  CREATE TYPE "public"."enum_mitgliedsantraege_geschlecht" AS ENUM('m', 'w', 'd');
  CREATE TYPE "public"."enum_mitgliedschaften_geschlecht" AS ENUM('m', 'w', 'd');
  ALTER TABLE "mitgliedsantraege_familienmitglieder" ADD COLUMN "geschlecht" "enum_mitgliedsantraege_familienmitglieder_geschlecht";
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "geschlecht" "enum_mitgliedsantraege_geschlecht";
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "kontakt_einwilligung" boolean;
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "foto_social_media" boolean;
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "foto_presse" boolean;
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "foto_kind_einverstanden" boolean;
  ALTER TABLE "mitgliedschaften" ADD COLUMN "geschlecht" "enum_mitgliedschaften_geschlecht";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mitgliedsantraege_familienmitglieder" DROP COLUMN IF EXISTS "geschlecht";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN IF EXISTS "geschlecht";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN IF EXISTS "kontakt_einwilligung";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN IF EXISTS "foto_social_media";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN IF EXISTS "foto_presse";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN IF EXISTS "foto_kind_einverstanden";
  ALTER TABLE "mitgliedschaften" DROP COLUMN IF EXISTS "geschlecht";
  DROP TYPE IF EXISTS "public"."enum_mitgliedsantraege_familienmitglieder_geschlecht";
  DROP TYPE IF EXISTS "public"."enum_mitgliedsantraege_geschlecht";
  DROP TYPE IF EXISTS "public"."enum_mitgliedschaften_geschlecht";`)
}
